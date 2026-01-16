var app = angular.module('FitnessApp', []);

app.controller('MainCtrl', function ($scope, $interval, $timeout) {
    console.log("Weekend Fitness Challenge - Game Started!");

    // Initial state
    $scope.currentView = 'home';
    $scope.selectedChallenge = null;
    $scope.playerName = '';
    $scope.playerContact = '';
    $scope.elapsedTime = 0;
    $scope.remainingTime = 0;
    $scope.finalScore = 0;
    $scope.timerInterval = null;
    $scope.leaderboardData = [];

    // Challenge definitions with configurable countdown durations
    $scope.challenges = {
        pushup: {
            id: 'pushup',
            name: 'PUSHUP CHALLENGE',
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
            name: 'QUICK REACTION CHALLENGE',
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
        $scope.currentView = 'registration';
    };

    $scope.beginChallenge = function () {
        if (!$scope.playerName || $scope.playerName.trim() === '') {
            alert('Please enter player name');
            return;
        }

        $scope.currentView = 'active' + capitalizeFirst($scope.selectedChallenge.id);
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

    $scope.submitScore = function () {
        if (!$scope.finalScore || $scope.finalScore <= 0) {
            alert('Please enter a valid score');
            return;
        }

        // Save to leaderboard
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
            for (var challengeId in $scope.challenges) {
                var leaderboardKey = 'leaderboard_' + challengeId;
                localStorage.removeItem(leaderboardKey);
            }
            alert('All leaderboards have been reset');
        }
    };

    $scope.resetSingleLeaderboard = function (challengeId) {
        if (confirm('Are you sure you want to reset the ' + $scope.challenges[challengeId].name + ' leaderboard?')) {
            var leaderboardKey = 'leaderboard_' + challengeId;
            localStorage.removeItem(leaderboardKey);
            alert($scope.challenges[challengeId].name + ' leaderboard has been reset');
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
            $scope.timerInterval = $interval(function () {
                $scope.elapsedTime++;
            }, 1000);
        } else if ($scope.selectedChallenge.type === 'countdown') {
            $scope.remainingTime = $scope.selectedChallenge.duration;
            $scope.finalScore = 0;
            $scope.timerInterval = $interval(function () {
                $scope.remainingTime--;
                if ($scope.remainingTime <= 0) {
                    $scope.endChallenge();
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
        $scope.elapsedTime = 0;
        $scope.remainingTime = 0;
        $scope.finalScore = 0;
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
