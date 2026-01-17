var app = angular.module('GiftApp', []);

app.controller('GiftCtrl', function ($scope, $http, $interval, $timeout) {
    // API Configuration
    var API_URL = './server/api.php';

    // Initial state
    $scope.loading = true;
    $scope.error = null;
    $scope.cupStats = {
        total_cups: 0,
        remaining_cups: 30
    };
    $scope.lastUpdated = null;

    // Load cup count from database
    $scope.loadCupCount = function () {
        $scope.loading = true;
        $scope.error = null;

        $http.get(API_URL + '?action=get_cup_count')
            .then(function (response) {
                $scope.loading = false;
                if (response.data.success) {
                    $scope.cupStats = {
                        total_cups: response.data.total_cups,
                        remaining_cups: response.data.remaining_cups
                    };
                    $scope.lastUpdated = new Date().toLocaleString();
                } else {
                    $scope.error = 'Failed to load cup count data';
                }
            })
            .catch(function (error) {
                $scope.loading = false;
                $scope.error = 'Error connecting to server. Please check your connection.';
                console.error('Error loading cup count:', error);
            });
    };

    // Manual refresh
    $scope.refreshData = function () {
        $scope.loadCupCount();
    };

    // Auto-refresh data every 30 seconds
    $interval(function () {
        $scope.loadCupCount();
    }, 30000);

    // Initial load
    $scope.loadCupCount();
});
