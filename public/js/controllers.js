/*jslint browser:true*/
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
  controller('AuthJoinCtrl', ['$scope', '$rootScope', '$http', '$window', '$routeParams',
    function ($scope, $rootScope, $http, $window, $routeParams) {
      if ($rootScope.me) {
        $window.history.back();
      }

      $scope.join = function () {
        $http.post('/api/auths/join', {
          username: $scope.user.name,
          nickname: $scope.user.nickname,
          email: $scope.user.email,
          password: $scope.user.password
        }).
          success(function (data) {
            $rootScope.me = data.me;
            $window.history.back();
          });
      };
    }]).
  controller('AuthLoginCtrl', ['$scope', '$rootScope', '$http', '$window', '$routeParams',
    function ($scope, $rootScope, $http, $window, $routeParams) {
      if ($rootScope.me) {
        $window.history.back();
      }

      $scope.login = function () {
        $http.post('/api/auths/login', {
          username: $scope.user.name,
          password: $scope.user.password
        }).
          success(function (data) {
            $rootScope.me = data.me;
            $window.history.back();
          }).
          error(function (data, status) {
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
  controller('ProblemListCtrl', ['$scope', '$rootScope', '$http',
    function ($scope, $rootScope, $http) {
      $http.get('/api/problems').
        success(function (data) {
          $rootScope.problems = data.problems;
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
