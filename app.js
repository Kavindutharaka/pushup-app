var app = angular.module('FitnessApp', []);

app.controller('MainCtrl', function ($scope, $interval, $timeout, $http) {
    console.log("Weekend Fitness Challenge - Game Started!");

    // API Configuration
    var API_URL = './server/api.php';

    // Initial state
    $scope.currentView = 'home';
    $scope.selectedChallenge = null;
    $scope.gameMode = 'single'; // 'single' or 'multiplayer'
    $scope.playerName = '';
    $scope.playerContact = '';
    $scope.player2Name = '';
    $scope.player2Contact = '';
    $scope.elapsedTime = 0;
    $scope.remainingTime = 0;
    $scope.elapsedTime2 = 0; // For player 2 in plank multiplayer
    $scope.finalScore = 0;
    $scope.finalScore2 = 0; // For player 2
    $scope.player1Finished = false; // Track if player 1 finished
    $scope.player2Finished = false; // Track if player 2 finished
    $scope.timerInterval = null;
    $scope.timerInterval2 = null; // For player 2 in plank multiplayer
    $scope.leaderboardData = [];

    // Challenge definitions with configurable countdown durations
    $scope.challenges = {
        pushup: {
            id: 'pushup',
            name: 'PUSH-UP CHALLENGE',
            type: 'countdown',
            duration: 60,
            unit: 'pushups'
        },
        plank: {
            id: 'plank',
            name: 'PLANK CHALLENGE',
            type: 'countup',
            duration: null,
            unit: 'seconds'
        },
        basketball: {
            id: 'basketball',
            name: 'BASKETBALL CHALLENGE',
            type: 'countdown',
            duration: 60,
            unit: 'shots'
        },
        football: {
            id: 'football',
            name: 'FOOTBALL CHALLENGE',
            type: 'countdown',
            duration: 60,
            unit: 'shots'
        },
        quickreaction: {
            id: 'quickreaction',
            name: 'REACTION CHALLENGE',
            type: 'countdown',
            duration: 60,
            unit: 'catches'
        }
    };

    // Load custom durations from localStorage
    $scope.loadCustomDurations = function () {
        var savedDurations = localStorage.getItem('challenge_durations');
        if (savedDurations) {
            var durations = JSON.parse(savedDurations);
            for (var challengeId in durations) {
                if ($scope.challenges[challengeId] && $scope.challenges[challengeId].type === 'countdown') {
                    $scope.challenges[challengeId].duration = durations[challengeId];
                }
            }
        }
    };

    // Save custom durations to localStorage
    $scope.saveCustomDurations = function () {
        var durations = {};
        for (var challengeId in $scope.challenges) {
            if ($scope.challenges[challengeId].type === 'countdown') {
                durations[challengeId] = $scope.challenges[challengeId].duration;
            }
        }
        localStorage.setItem('challenge_durations', JSON.stringify(durations));
    };

    // Initialize durations
    $scope.loadCustomDurations();

    // Logo mapping function for challenge-specific logos
    $scope.getChallengeLogo = function () {
        if (!$scope.selectedChallenge) {
            return './img/logo.png';
        }

        var logoMap = {
            'pushup': './logo/pushup&plank.png',
            'plank': './logo/pushup&plank.png',
            'basketball': './logo/basketball.png',
            'football': './logo/football.png',
            'quickreaction': './logo/quick_reaction .png'
        };

        return logoMap[$scope.selectedChallenge.id] || './img/logo.png';
    };

    // Navigation functions
    $scope.goHome = function () {
        $scope.stopTimer();
        $scope.currentView = 'home';
        $scope.resetGameState();
    };

    $scope.selectChallenge = function (challengeId) {
        $scope.selectedChallenge = $scope.challenges[challengeId];
        $scope.currentView = 'challengeMenu';
    };

    $scope.startChallenge = function () {
        $scope.resetGameState();
        $scope.currentView = 'modeSelection';
    };

    $scope.selectMode = function (mode) {
        $scope.gameMode = mode;
        $scope.currentView = 'registration';
    };

    $scope.beginChallenge = function () {
        // Validate player 1
        if (!$scope.playerName || $scope.playerName.trim() === '') {
            alert('Please enter Player 1 name');
            return;
        }

        // Validate player 2 for multiplayer mode
        if ($scope.gameMode === 'multiplayer') {
            if (!$scope.player2Name || $scope.player2Name.trim() === '') {
                alert('Please enter Player 2 name');
                return;
            }
        }

        // Route to appropriate game screen
        if ($scope.gameMode === 'multiplayer') {
            $scope.currentView = 'activeMultiplayer' + capitalizeFirst($scope.selectedChallenge.id);
        } else {
            $scope.currentView = 'active' + capitalizeFirst($scope.selectedChallenge.id);
        }

        $scope.startTimer();
    };

    $scope.endChallenge = function () {
        $scope.stopTimer();

        // Set final score based on challenge type
        if ($scope.selectedChallenge.type === 'countup') {
            // For plank, the elapsed time IS the score
            $scope.finalScore = $scope.elapsedTime;
        } else if ($scope.selectedChallenge.type === 'countdown') {
            // For countdown challenges, reset finalScore for manual entry
            $scope.finalScore = 0;
        }

        $scope.currentView = 'result' + capitalizeFirst($scope.selectedChallenge.id);
    };

    // Multiplayer functions
    $scope.finishPlayer = function (playerNum) {
        if (playerNum === 1) {
            $scope.player1Finished = true;
        } else if (playerNum === 2) {
            $scope.player2Finished = true;
        }

        // When both players finish, move to result entry screen
        if ($scope.player1Finished && $scope.player2Finished) {
            $scope.stopTimer();
            $scope.finalScore = 0;
            $scope.finalScore2 = 0;
            $scope.currentView = 'resultMultiplayer' + capitalizeFirst($scope.selectedChallenge.id);
        }
    };

    $scope.stopPlankPlayer = function (playerNum) {
        if (playerNum === 1 && !$scope.player1Finished) {
            $scope.player1Finished = true;
            // Capture current time from main counter for Player 1
            $scope.finalScore = $scope.elapsedTime;
            // Main timer keeps running for Player 2
        } else if (playerNum === 2 && !$scope.player2Finished) {
            $scope.player2Finished = true;
            // Capture current time from main counter for Player 2
            $scope.finalScore2 = $scope.elapsedTime;
            // Main timer keeps running
        }

        // When both players stop, wait 2 seconds then move to result screen
        if ($scope.player1Finished && $scope.player2Finished) {
            $timeout(function () {
                $scope.stopTimer();
                $scope.currentView = 'resultMultiplayer' + capitalizeFirst($scope.selectedChallenge.id);
            }, 2000);
        }
    };

    $scope.submitMultiplayerScores = function () {
        // Validate scores for push-up (plank scores are auto-captured)
        if ($scope.selectedChallenge.type === 'countdown') {
            if (!$scope.finalScore || $scope.finalScore <= 0) {
                alert('Please enter a valid score for Player 1');
                return;
            }
            if (!$scope.finalScore2 || $scope.finalScore2 <= 0) {
                alert('Please enter a valid score for Player 2');
                return;
            }
        }

        $scope.stopTimer();

        // Add both players to leaderboard
        var leaderboardKey = 'leaderboard_' + $scope.selectedChallenge.id;
        var leaderboard = JSON.parse(localStorage.getItem(leaderboardKey) || '[]');

        leaderboard.push({
            name: $scope.playerName,
            score: $scope.finalScore,
            timestamp: new Date().getTime()
        });

        leaderboard.push({
            name: $scope.player2Name,
            score: $scope.finalScore2,
            timestamp: new Date().getTime()
        });

        leaderboard.sort(function (a, b) {
            return b.score - a.score;
        });

        localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));

        // Save both scores to database
        $http.post(API_URL + '?action=save_score', {
            challenge_type: $scope.selectedChallenge.id,
            player_name: $scope.playerName,
            player_contact: $scope.playerContact,
            score: $scope.finalScore
        }).then(function (response) {
            console.log('Player 1 score saved:', response.data);
        }).catch(function (error) {
            console.error('Error saving Player 1 score:', error);
        });

        $http.post(API_URL + '?action=save_score', {
            challenge_type: $scope.selectedChallenge.id,
            player_name: $scope.player2Name,
            player_contact: $scope.player2Contact,
            score: $scope.finalScore2
        }).then(function (response) {
            console.log('Player 2 score saved:', response.data);
        }).catch(function (error) {
            console.error('Error saving Player 2 score:', error);
        });

        // Show leaderboard
        $scope.showLeaderboard();
    };

    $scope.submitScore = function () {
        if (!$scope.finalScore || $scope.finalScore <= 0) {
            alert('Please enter a valid score');
            return;
        }

        // Save to database via API
        var scoreData = {
            challenge_type: $scope.selectedChallenge.id,
            player_name: $scope.playerName,
            player_contact: $scope.playerContact,
            score: parseInt($scope.finalScore)
        };

        $http.post(API_URL + '?action=save_score', scoreData)
            .then(function (response) {
                console.log('Score saved to database:', response.data);
            })
            .catch(function (error) {
                console.error('Error saving score:', error);
            });

        // Save to localStorage for immediate display
        var leaderboardKey = 'leaderboard_' + $scope.selectedChallenge.id;
        var leaderboard = JSON.parse(localStorage.getItem(leaderboardKey) || '[]');

        leaderboard.push({
            name: $scope.playerName,
            contact: $scope.playerContact,
            score: parseInt($scope.finalScore),
            date: new Date().toISOString()
        });

        localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));

        // Show leaderboard
        $scope.showLeaderboard();
    };

    $scope.showLeaderboard = function () {
        var leaderboardKey = 'leaderboard_' + $scope.selectedChallenge.id;
        $scope.leaderboardData = JSON.parse(localStorage.getItem(leaderboardKey) || '[]');
        $scope.currentView = 'leaderboard';
    };

    // Admin Panel Functions
    $scope.openAdminPanel = function () {
        $scope.currentView = 'admin';
    };

    $scope.resetAllLeaderboards = function () {
        if (confirm('Are you sure you want to reset ALL leaderboards? This cannot be undone!')) {
            var resetCount = 0;
            var totalChallenges = Object.keys($scope.challenges).length;

            // Reset each challenge
            for (var challengeId in $scope.challenges) {
                (function (id) {
                    // Send reset request to database
                    $http.post(API_URL + '?action=reset_leaderboard', { challenge_type: id })
                        .then(function (response) {
                            console.log('Reset ' + id + ':', response.data);
                            resetCount++;
                            if (resetCount === totalChallenges) {
                                alert('All leaderboards have been reset successfully!');
                            }
                        })
                        .catch(function (error) {
                            console.error('Error resetting ' + id + ':', error);
                        });

                    // Clear localStorage
                    var leaderboardKey = 'leaderboard_' + id;
                    localStorage.removeItem(leaderboardKey);
                })(challengeId);
            }
        }
    };

    $scope.resetSingleLeaderboard = function (challengeId) {
        if (confirm('Are you sure you want to reset the ' + $scope.challenges[challengeId].name + ' leaderboard?')) {
            var leaderboardKey = 'leaderboard_' + challengeId;

            // Send reset request to database (captures top 3 winners)
            $http.post(API_URL + '?action=reset_leaderboard', { challenge_type: challengeId })
                .then(function (response) {
                    console.log('Leaderboard reset in database:', response.data);
                    alert('Leaderboard reset successfully. Top 3 winners have been saved!');
                })
                .catch(function (error) {
                    console.error('Error resetting leaderboard:', error);
                    alert('Leaderboard reset locally, but database update failed');
                });

            // Clear localStorage
            localStorage.removeItem(leaderboardKey);
        }
    };

    $scope.updateChallengeDuration = function () {
        $scope.saveCustomDurations();
        alert('Challenge durations have been updated');
    };

    // Timer functions
    $scope.startTimer = function () {
        $scope.stopTimer(); // Clear any existing timer

        if ($scope.selectedChallenge.type === 'countup') {
            $scope.elapsedTime = 0;

            // For both single and multiplayer plank, use one main timer
            // Timer keeps running until both players stop (in multiplayer)
            $scope.timerInterval = $interval(function () {
                $scope.elapsedTime++;
            }, 1000);
        } else if ($scope.selectedChallenge.type === 'countdown') {
            $scope.remainingTime = $scope.selectedChallenge.duration;
            $scope.finalScore = 0;
            $scope.timerInterval = $interval(function () {
                $scope.remainingTime--;
                if ($scope.remainingTime <= 0) {
                    if ($scope.gameMode === 'multiplayer') {
                        // Don't auto-end for multiplayer, just stop timer
                        $scope.stopTimer();
                        alert('Time is up! Both players should finish and enter their scores.');
                    } else {
                        $scope.endChallenge();
                    }
                }
            }, 1000);
        } else if ($scope.selectedChallenge.type === 'manual') {
            $scope.finalScore = 0;
        }
    };

    $scope.stopTimer = function () {
        if ($scope.timerInterval) {
            $interval.cancel($scope.timerInterval);
            $scope.timerInterval = null;
        }
        if ($scope.timerInterval2) {
            $interval.cancel($scope.timerInterval2);
            $scope.timerInterval2 = null;
        }
    };

    $scope.incrementScore = function () {
        $scope.finalScore++;
    };

    // Format time as MM:SS
    $scope.formatTime = function (seconds) {
        var mins = Math.floor(seconds / 60);
        var secs = seconds % 60;
        return pad(mins, 2) + ':' + pad(secs, 2);
    };

    // Reset game state
    $scope.resetGameState = function () {
        $scope.playerName = '';
        $scope.playerContact = '';
        $scope.player2Name = '';
        $scope.player2Contact = '';
        $scope.elapsedTime = 0;
        $scope.elapsedTime2 = 0;
        $scope.remainingTime = 0;
        $scope.finalScore = 0;
        $scope.finalScore2 = 0;
        $scope.player1Finished = false;
        $scope.player2Finished = false;
    };

    // Helper functions
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function pad(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    // Clean up on destroy
    $scope.$on('$destroy', function () {
        $scope.stopTimer();
    });
});

// Custom filter for number formatting
app.filter('number', function () {
    return function (input, decimals) {
        if (isNaN(input)) return input;

        var num = parseInt(input);
        var str = num.toString();

        while (str.length < decimals) {
            str = '0' + str;
        }

        return str;
    };
});
