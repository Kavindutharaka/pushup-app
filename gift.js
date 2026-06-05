var app = angular.module('GiftApp', ['MoovDB']);

app.controller('GiftCtrl', function ($scope, $http, $interval, $timeout, DB) {
    // Online storage is handled by the shared DB service (sup/db-service.js).

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

        DB.getCupCount()
            .then(function (stats) {
                $scope.loading = false;
                $scope.cupStats = {
                    total_cups: stats.total_cups,
                    remaining_cups: stats.remaining_cups
                };
                $scope.lastUpdated = new Date().toLocaleString();
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
