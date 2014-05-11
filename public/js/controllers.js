/*global angular */
'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', ['$scope', '$rootScope', '$http',
    function ($scope, $rootScope, $http) {
      $http.get('/api/users').
        success(function (data) {
          $rootScope.users = data.users;
        });

      $http.get('/api/problems').
        success(function (data) {
          $rootScope.problems = data.problems;
        });

    }]).
  controller('AuthJoinCtrl', ['$scope', '$rootScope', '$http', '$routeParams',
    function ($scope, $rootScope, $http, $routeParams) {

      $scope.join = function () {
        $http.post('/api/auths/join', {
          username: $scope.user.name,
          password: $scope.user.password
        }).
          success(function (data) {
            $rootScope.me = data.user;
          });
      };
    }]).
  controller('AuthLoginCtrl', ['$scope', '$rootScope', '$http', '$routeParams',
    function ($scope, $rootScope, $http, $routeParams) {

      $scope.login = function () {
        $http.post('/api/auths/login', {
          username: $scope.user.name,
          password: $scope.user.password
        }).
          success(function (data) {
            $rootScope.me = data.user;
          });
      };
    }]).
  controller('UserListCtrl', ['$scope', '$rootScope', '$http',
    function ($scope, $rootScope, $http) {
      $http.get('/api/users').
        success(function (data) {
          $rootScope.users = data.users;
        });
    }]).
  controller('UserShowCtrl', ['$scope', '$http', '$routeParams',
    function ($scope, $http, $routeParams) {
      var userId = $routeParams.id;

      $http.get('/api/user/' + userId).
        success(function (data) {
          $scope.user = data.user;
        });
    }]).
  controller('ProblemListCtrl', ['$scope', '$http',
    function ($scope, $http) {
      $http.get('/api/problems').
        success(function (data) {
          $scope.problems = data.problems;
        });
    }]).
  controller('ProblemShowCtrl', ['$scope', '$http', '$routeParams', '$sce',
    function ($scope, $http, $routeParams, $sce) {
      var problemId = $routeParams.id;

      $http.get('/api/problem/' + problemId).
        success(function (data) {
          $scope.problem = data.problem;
          $scope.problemContents = $sce.trustAsHtml(data.contents.problem_content);
        });
    }]).
  controller('SubmissionListCtrl', ['$scope', '$http',
    function ($scope, $http) {
      $http.get('/api/submissions').
        success(function (data) {
          $scope.submissions = data.submissions;
        });
    }]).
  controller('SubmissionShowCtrl', ['$scope', '$http', '$routeParams',
    function ($scope, $http, $routeParams) {
      var submissionId = $routeParams.id;

      $http.get('/api/submission/' + submissionId).
        success(function (data) {
          $scope.submission = data.submission;
        });
    }]);
