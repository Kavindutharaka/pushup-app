<?php
require_once 'config.php';

$db = Database::getInstance()->getConnection();

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch($action) {
        case 'save_score':
            if($method === 'POST') {
                saveScore($db);
            }
            break;

        case 'reset_leaderboard':
            if($method === 'POST') {
                resetLeaderboard($db);
            }
            break;

        case 'get_active_session':
            if($method === 'GET') {
                getActiveSession($db);
            }
            break;

        case 'get_all_data':
            if($method === 'GET') {
                getAllData($db);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(array('error' => 'Invalid action'));
            break;
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array('error' => $e->getMessage()));
}

// Save player score
function saveScore($db) {
    $data = json_decode(file_get_contents('php://input'), true);

    if(!isset($data['challenge_type']) || !isset($data['player_name']) || !isset($data['score'])) {
        http_response_code(400);
        echo json_encode(array('error' => 'Missing required fields'));
        return;
    }

    // Get active session for this challenge
    $stmt = $db->prepare("
        SELECT session_id
        FROM sessions
        WHERE challenge_type = :challenge_type AND status = 'active'
        LIMIT 1
    ");
    $stmt->execute(array(':challenge_type' => $data['challenge_type']));
    $session = $stmt->fetch();

    if(!$session) {
        // Create new session if none exists
        $stmt = $db->prepare("
            INSERT INTO sessions (challenge_type, session_start_time, status)
            VALUES (:challenge_type, NOW(), 'active')
        ");
        $stmt->execute(array(':challenge_type' => $data['challenge_type']));
        $session_id = $db->lastInsertId();
    } else {
        $session_id = $session['session_id'];
    }

    // Insert player score
    $stmt = $db->prepare("
        INSERT INTO player_scores (session_id, challenge_type, player_name, player_contact, score, played_at)
        VALUES (:session_id, :challenge_type, :player_name, :player_contact, :score, NOW())
    ");

    $stmt->execute(array(
        ':session_id' => $session_id,
        ':challenge_type' => $data['challenge_type'],
        ':player_name' => $data['player_name'],
        ':player_contact' => isset($data['player_contact']) ? $data['player_contact'] : null,
        ':score' => $data['score']
    ));

    echo json_encode(array(
        'success' => true,
        'score_id' => $db->lastInsertId(),
        'session_id' => $session_id
    ));
}

// Reset leaderboard and capture top 3 winners
function resetLeaderboard($db) {
    $data = json_decode(file_get_contents('php://input'), true);

    if(!isset($data['challenge_type'])) {
        http_response_code(400);
        echo json_encode(array('error' => 'Missing challenge_type'));
        return;
    }

    $challenge_type = $data['challenge_type'];

    // Get active session
    $stmt = $db->prepare("
        SELECT session_id
        FROM sessions
        WHERE challenge_type = :challenge_type AND status = 'active'
        LIMIT 1
    ");
    $stmt->execute(array(':challenge_type' => $challenge_type));
    $session = $stmt->fetch();

    if($session) {
        $session_id = $session['session_id'];

        // Get top 3 players from current session
        $stmt = $db->prepare("
            SELECT player_name, player_contact, score
            FROM player_scores
            WHERE session_id = :session_id AND challenge_type = :challenge_type
            ORDER BY score DESC
            LIMIT 3
        ");
        $stmt->execute(array(
            ':session_id' => $session_id,
            ':challenge_type' => $challenge_type
        ));
        $topPlayers = $stmt->fetchAll();

        // Save winners
        $rank = 1;
        foreach($topPlayers as $player) {
            $stmt = $db->prepare("
                INSERT INTO session_winners (session_id, challenge_type, rank_position, player_name, player_contact, score, won_at)
                VALUES (:session_id, :challenge_type, :rank_position, :player_name, :player_contact, :score, NOW())
            ");
            $stmt->execute(array(
                ':session_id' => $session_id,
                ':challenge_type' => $challenge_type,
                ':rank_position' => $rank,
                ':player_name' => $player['player_name'],
                ':player_contact' => $player['player_contact'],
                ':score' => $player['score']
            ));
            $rank++;
        }

        // Mark session as completed
        $stmt = $db->prepare("
            UPDATE sessions
            SET status = 'completed', session_end_time = NOW()
            WHERE session_id = :session_id
        ");
        $stmt->execute(array(':session_id' => $session_id));
    }

    // Create new active session
    $stmt = $db->prepare("
        INSERT INTO sessions (challenge_type, session_start_time, status)
        VALUES (:challenge_type, NOW(), 'active')
    ");
    $stmt->execute(array(':challenge_type' => $challenge_type));

    echo json_encode(array(
        'success' => true,
        'new_session_id' => $db->lastInsertId(),
        'winners_captured' => count($topPlayers ?? [])
    ));
}

// Get active session ID for a challenge
function getActiveSession($db) {
    $challenge_type = isset($_GET['challenge_type']) ? $_GET['challenge_type'] : '';

    if(!$challenge_type) {
        http_response_code(400);
        echo json_encode(array('error' => 'Missing challenge_type'));
        return;
    }

    $stmt = $db->prepare("
        SELECT session_id, session_start_time
        FROM sessions
        WHERE challenge_type = :challenge_type AND status = 'active'
        LIMIT 1
    ");
    $stmt->execute(array(':challenge_type' => $challenge_type));
    $session = $stmt->fetch();

    echo json_encode($session ? $session : array('error' => 'No active session'));
}

// Get all data for admin panel
function getAllData($db) {
    $challenge_type = isset($_GET['challenge_type']) ? $_GET['challenge_type'] : 'all';

    // Build query
    $where_clause = $challenge_type !== 'all' ? "WHERE s.challenge_type = :challenge_type" : "";

    // Get all sessions with their scores and winners
    $query = "
        SELECT
            s.session_id,
            s.challenge_type,
            s.session_start_time,
            s.session_end_time,
            s.status,
            (SELECT COUNT(*) FROM player_scores ps WHERE ps.session_id = s.session_id) as total_players
        FROM sessions s
        $where_clause
        ORDER BY s.challenge_type, s.session_id DESC
    ";

    $stmt = $db->prepare($query);
    if($challenge_type !== 'all') {
        $stmt->execute(array(':challenge_type' => $challenge_type));
    } else {
        $stmt->execute();
    }
    $sessions = $stmt->fetchAll();

    // For each session, get scores and winners
    foreach($sessions as &$session) {
        // Get all scores for this session
        $stmt = $db->prepare("
            SELECT score_id, player_name, player_contact, score, played_at
            FROM player_scores
            WHERE session_id = :session_id
            ORDER BY score DESC, played_at ASC
        ");
        $stmt->execute(array(':session_id' => $session['session_id']));
        $session['scores'] = $stmt->fetchAll();

        // Get winners for completed sessions
        if($session['status'] === 'completed') {
            $stmt = $db->prepare("
                SELECT rank_position, player_name, player_contact, score, won_at
                FROM session_winners
                WHERE session_id = :session_id
                ORDER BY rank_position ASC
            ");
            $stmt->execute(array(':session_id' => $session['session_id']));
            $session['winners'] = $stmt->fetchAll();
        } else {
            $session['winners'] = array();
        }
    }

    echo json_encode(array(
        'success' => true,
        'sessions' => $sessions
    ));
}
?>
