var app = angular.module('AdminApp', []);

app.controller('AdminCtrl', function ($scope, $http, $interval) {
    console.log("Admin Dashboard Loaded");

    // API Configuration
    var API_URL = './server/api.php';

    // State
    $scope.loading = true;
    $scope.error = null;
    $scope.allSessions = [];
    $scope.filteredSessions = [];
    $scope.groupedSessions = {};
    $scope.currentFilter = 'all';

    $scope.go_game = function (){
        window.location.href = "./index.html";
    };

    // Challenge Labels
    var challengeLabels = {
        'pushup': 'PUSH-UP CHALLENGE',
        'plank': 'PLANK CHALLENGE',
        'basketball': 'BASKETBALL CHALLENGE',
        'football': 'FOOTBALL CHALLENGE',
        'quickreaction': 'REACTION CHALLENGE'
    };

    // Load all data from API
    $scope.loadData = function () {
        $scope.loading = true;
        $scope.error = null;

        $http.get(API_URL + '?action=get_all_data&challenge_type=' + $scope.currentFilter)
            .then(function (response) {
                if (response.data.success) {
                    $scope.allSessions = response.data.sessions;
                    $scope.filterChallenge($scope.currentFilter);
                } else {
                    $scope.error = 'Failed to load data';
                }
                $scope.loading = false;
            })
            .catch(function (error) {
                console.error('Error loading data:', error);
                $scope.error = 'Error connecting to database. Please check your PHP server and MySQL connection.';
                $scope.loading = false;
            });
    };

    // Filter by challenge type
    $scope.filterChallenge = function (challengeType) {
        $scope.currentFilter = challengeType;

        if (challengeType === 'all') {
            $scope.filteredSessions = $scope.allSessions;
        } else {
            $scope.filteredSessions = $scope.allSessions.filter(function (session) {
                return session.challenge_type === challengeType;
            });
        }

        // Group sessions by challenge type
        $scope.groupedSessions = {};
        $scope.filteredSessions.forEach(function (session) {
            if (!$scope.groupedSessions[session.challenge_type]) {
                $scope.groupedSessions[session.challenge_type] = [];
            }
            $scope.groupedSessions[session.challenge_type].push(session);
        });

        // Reload data if filter changed
        if (challengeType !== 'all') {
            $scope.loadData();
        }
    };

    // Get challenge label
    $scope.getChallengeLabel = function (challengeType) {
        return challengeLabels[challengeType] || challengeType.toUpperCase();
    };

    // Format date
    $scope.formatDate = function (dateString) {
        if (!dateString) return '-';
        var date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format date and time
    $scope.formatDateTime = function (dateString) {
        if (!dateString) return '-';
        var date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Edit score functions
    $scope.editScore = function (score, challengeType) {
        score.editing = true;
        score.newScore = score.score;
        score.originalScore = score.score;
        score.challengeType = challengeType;
    };

    $scope.saveScore = function (score, challengeType, sessionId) {
        if (!score.newScore || score.newScore <= 0) {
            alert('Please enter a valid score');
            return;
        }

        // Send update to server
        $http.post(API_URL + '?action=update_score', {
            score_id: score.score_id,
            new_score: score.newScore
        }).then(function (response) {
            if (response.data.success) {
                score.score = score.newScore;
                score.editing = false;

                // Update localStorage leaderboard
                $scope.syncLeaderboard(challengeType, sessionId);

                alert('Score updated successfully and leaderboard synced!');
                $scope.loadData(); // Reload data to show updated leaderboard
            } else {
                alert('Failed to update score');
            }
        }).catch(function (error) {
            console.error('Error updating score:', error);
            alert('Error updating score. Please try again.');
        });
    };

    // Sync localStorage leaderboard with database
    $scope.syncLeaderboard = function (challengeType, sessionId) {
        // Get the session data
        var session = null;
        for (var type in $scope.groupedSessions) {
            var sessions = $scope.groupedSessions[type];
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].session_id === sessionId) {
                    session = sessions[i];
                    break;
                }
            }
            if (session) break;
        }

        if (!session || !session.scores) {
            console.error('Session not found for leaderboard sync');
            return;
        }

        // Build leaderboard from session scores
        var leaderboard = [];
        for (var i = 0; i < session.scores.length; i++) {
            leaderboard.push({
                name: session.scores[i].player_name,
                score: parseInt(session.scores[i].score),
                timestamp: new Date(session.scores[i].played_at).getTime()
            });
        }

        // Sort by score (descending)
        leaderboard.sort(function (a, b) {
            return b.score - a.score;
        });

        // Update localStorage
        var leaderboardKey = 'leaderboard_' + challengeType;
        localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));

        console.log('Leaderboard synced for ' + challengeType, leaderboard);
    };

    $scope.cancelEdit = function (score) {
        score.editing = false;
        score.newScore = score.originalScore;
    };

    // Auto-refresh data every 30 seconds
    $interval(function () {
        $scope.loadData();
    }, 30000);

    // Initial load
    $scope.loadData();
});
