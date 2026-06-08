// Shared online-database service for the Weekend Fitness Challenge kiosk.
//
// Replaces the old local PHP API (server/api.php). Every operation is now a
// direct SQL query executed against the remote Microsoft SQL Server through the
// generic endpoint below. The endpoint runs whatever T-SQL is sent in "SysID"
// and returns the resulting rows as a JSON array.
//
//   POST https://mas.phvtech.com/api/Master/sp
//   { "SysID": "<T-SQL statement>" }   ->   [ {row}, {row}, ... ]
//
// Tables (created on the server):
//   moov_fit_sessions(session_id, challenge_type, session_start_time,
//                     session_end_time, status, created_at)
//   moov_fit_scores  (score_id, session_id, challenge_type, player_name,
//                     player_contact, score, played_at, created_at)
//   moov_fit_winners (winner_id, session_id, challenge_type, rank_position,
//                     player_name, player_contact, score, won_at, created_at)

angular.module('MoovDB', []).factory('DB', function ($http, $q) {
    var ENDPOINT = 'https://mas.phvtech.com/api/Master/sp';

    var TABLES = {
        sessions: 'moov_fit_sessions',
        scores: 'moov_fit_scores',
        winners: 'moov_fit_winners'
    };

    // Escape a value for safe inlining inside a single-quoted T-SQL literal.
    function esc(value) {
        if (value === null || value === undefined) return '';
        return String(value).replace(/'/g, "''");
    }

    // Run a raw T-SQL statement. Resolves with an array of row objects.
    function run(sql) {
        return $http.post(ENDPOINT, { SysID: sql }).then(function (response) {
            // The endpoint returns an array of rows; guard against null/objects.
            return angular.isArray(response.data) ? response.data : [];
        });
    }

    // Find the active session id for a challenge, creating one if none exists.
    function getOrCreateActiveSession(challengeType) {
        var ct = esc(challengeType);
        return run(
            "SELECT TOP 1 session_id FROM " + TABLES.sessions +
            " WHERE challenge_type = '" + ct + "' AND status = 'active'" +
            " ORDER BY session_id DESC"
        ).then(function (rows) {
            if (rows.length) {
                return rows[0].session_id;
            }
            return run(
                "INSERT INTO " + TABLES.sessions +
                " (challenge_type, session_start_time, status)" +
                " OUTPUT INSERTED.session_id" +
                " VALUES ('" + ct + "', GETDATE(), 'active')"
            ).then(function (out) {
                return out.length ? out[0].session_id : 0;
            });
        });
    }

    // Save a single player's score into the active session.
    function saveScore(challengeType, playerName, playerContact, score) {
        var ct = esc(challengeType);
        var numScore = parseInt(score, 10) || 0;
        return getOrCreateActiveSession(challengeType).then(function (sessionId) {
            return run(
                "INSERT INTO " + TABLES.scores +
                " (session_id, challenge_type, player_name, player_contact, score, played_at)" +
                " VALUES (" + sessionId + ", '" + ct + "', '" + esc(playerName) + "', '" +
                esc(playerContact) + "', " + numScore + ", GETDATE())"
            );
        });
    }

    // Close the active session: capture its top 3 as winners, mark it completed,
    // then open a fresh active session. Mirrors the old reset_leaderboard action.
    function resetLeaderboard(challengeType) {
        var ct = esc(challengeType);
        return run(
            "SELECT TOP 1 session_id FROM " + TABLES.sessions +
            " WHERE challenge_type = '" + ct + "' AND status = 'active'" +
            " ORDER BY session_id DESC"
        ).then(function (rows) {
            var chain = $q.when();
            if (rows.length) {
                var sid = rows[0].session_id;
                // Capture top 3 scores of this session as ranked winners.
                chain = chain.then(function () {
                    return run(
                        "INSERT INTO " + TABLES.winners +
                        " (session_id, challenge_type, rank_position, player_name, player_contact, score, won_at)" +
                        " SELECT session_id, challenge_type," +
                        " ROW_NUMBER() OVER (ORDER BY score DESC, played_at ASC)," +
                        " player_name, player_contact, score, GETDATE()" +
                        " FROM (SELECT TOP 3 session_id, challenge_type, player_name," +
                        " player_contact, score, played_at FROM " + TABLES.scores +
                        " WHERE session_id = " + sid + " ORDER BY score DESC, played_at ASC) AS t"
                    );
                }).then(function () {
                    return run(
                        "UPDATE " + TABLES.sessions +
                        " SET status = 'completed', session_end_time = GETDATE()" +
                        " WHERE session_id = " + sid
                    );
                });
            }
            // Always open a new active session for the next round.
            return chain.then(function () {
                return run(
                    "INSERT INTO " + TABLES.sessions +
                    " (challenge_type, session_start_time, status)" +
                    " VALUES ('" + ct + "', GETDATE(), 'active')"
                );
            });
        });
    }

    // Update a single score row (admin score edit).
    function updateScore(scoreId, newScore) {
        var num = parseInt(newScore, 10) || 0;
        return run(
            "UPDATE " + TABLES.scores + " SET score = " + num +
            " WHERE score_id = " + (parseInt(scoreId, 10) || 0)
        );
    }

    // Total cups awarded so far = number of winner rows recorded.
    function getCupCount() {
        return run("SELECT COUNT(*) AS total_cups FROM " + TABLES.winners)
            .then(function (rows) {
                var total = rows.length ? (parseInt(rows[0].total_cups, 10) || 0) : 0;
                return {
                    total_cups: total,
                    remaining_cups: Math.max(0, 30 - total)
                };
            });
    }

    // Load every session with its nested scores and winners, for the admin page.
    function getAllData(challengeType) {
        var filter = (challengeType && challengeType !== 'all')
            ? " WHERE challenge_type = '" + esc(challengeType) + "'" : "";

        var sessionsSql =
            "SELECT session_id, challenge_type," +
            " CONVERT(varchar(33), session_start_time, 126) AS session_start_time," +
            " CONVERT(varchar(33), session_end_time, 126) AS session_end_time," +
            " status FROM " + TABLES.sessions + filter +
            " ORDER BY challenge_type, session_id DESC";

        var scoresSql =
            "SELECT score_id, session_id, player_name, player_contact, score," +
            " CONVERT(varchar(33), played_at, 126) AS played_at FROM " + TABLES.scores +
            filter + " ORDER BY score DESC, played_at ASC";

        var winnersSql =
            "SELECT session_id, rank_position, player_name, player_contact, score," +
            " CONVERT(varchar(33), won_at, 126) AS won_at FROM " + TABLES.winners +
            filter + " ORDER BY rank_position ASC";

        return $q.all({
            sessions: run(sessionsSql),
            scores: run(scoresSql),
            winners: run(winnersSql)
        }).then(function (res) {
            var sessions = res.sessions;
            sessions.forEach(function (session) {
                session.scores = res.scores.filter(function (s) {
                    return s.session_id === session.session_id;
                });
                session.total_players = session.scores.length;
                session.winners = (session.status === 'completed')
                    ? res.winners.filter(function (w) {
                        return w.session_id === session.session_id;
                    })
                    : [];
            });
            return sessions;
        });
    }

    // ---- Online QR registrations -------------------------------------------
    // Players self-register from their phone (qr.html). They appear on the
    // kiosk's "Online" player list until they have played (status -> 'played').
    var REG = 'moov_fit_registrations';

    // Register a player for a challenge (called from the mobile page).
    function registerPlayer(challengeType, playerName, playerContact) {
        return run(
            "INSERT INTO " + REG +
            " (challenge_type, player_name, player_contact, status, registered_at)" +
            " VALUES ('" + esc(challengeType) + "', '" + esc(playerName) + "', '" +
            esc(playerContact) + "', 'registered', GETDATE())"
        );
    }

    // Get players still waiting to play for a challenge.
    function getRegistrations(challengeType) {
        return run(
            "SELECT reg_id, player_name, player_contact," +
            " CONVERT(varchar(33), registered_at, 126) AS registered_at FROM " + REG +
            " WHERE challenge_type = '" + esc(challengeType) + "' AND status = 'registered'" +
            " ORDER BY registered_at ASC"
        );
    }

    // Count of players still waiting to play, per challenge.
    function getRegistrationCount(challengeType) {
        return run(
            "SELECT COUNT(*) AS c FROM " + REG +
            " WHERE challenge_type = '" + esc(challengeType) + "' AND status = 'registered'"
        ).then(function (rows) {
            return rows.length ? (parseInt(rows[0].c, 10) || 0) : 0;
        });
    }

    // Mark a registration as played so it drops off the waiting list.
    function markRegistrationPlayed(regId) {
        return run(
            "UPDATE " + REG + " SET status = 'played' WHERE reg_id = " +
            (parseInt(regId, 10) || 0)
        );
    }

    return {
        run: run,
        esc: esc,
        saveScore: saveScore,
        resetLeaderboard: resetLeaderboard,
        updateScore: updateScore,
        getCupCount: getCupCount,
        getAllData: getAllData,
        registerPlayer: registerPlayer,
        getRegistrations: getRegistrations,
        getRegistrationCount: getRegistrationCount,
        markRegistrationPlayed: markRegistrationPlayed
    };
});
