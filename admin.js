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
    $scope.cupStats = {
        total_cups: 0,
        remaining_cups: 30
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

    // Load cup count from database
    $scope.loadCupCount = function () {
        $http.get(API_URL + '?action=get_cup_count')
            .then(function (response) {
                if (response.data.success) {
                    $scope.cupStats = {
                        total_cups: response.data.total_cups,
                        remaining_cups: response.data.remaining_cups
                    };
                }
            })
            .catch(function (error) {
                console.error('Error loading cup count:', error);
            });
    };

    // Auto-refresh data every 30 seconds
    $interval(function () {
        $scope.loadData();
        $scope.loadCupCount();
    }, 30000);

    // Initial load
    $scope.loadData();
    $scope.loadCupCount();
});
