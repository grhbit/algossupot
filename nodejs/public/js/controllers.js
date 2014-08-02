/*jslint browser:true, vars: true*/
/*global angular */
'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', ['$scope', '$rootScope', '$http', '$window', 'me',
    function ($scope, $rootScope, $http, $window, me) {
      $http.get('/api/users').
        success(function (data) {
          $rootScope.users = data;
        });

      $http.get('/api/problems').
        success(function (data) {
          $rootScope.problems = data;
        });

      $scope.signOut = function () {
        $http.post('/api/auths/logout').
          success(function () {
            me.setUser(null);
          }).
          error(function () {
            me.setUser(null);
          });
      };

      $scope.isAuthentication = function () {
        $scope.me = me.getUser();
        return me.isAuthentication();
      };

    }]).
  controller('AuthJoinCtrl', ['$scope', '$rootScope', '$http', '$window', '$routeParams', 'me',
    function ($scope, $rootScope, $http, $window, $routeParams, me) {
      if (me.isAuthentication()) {
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
            me.setUser(data);
            $window.history.back();
          });
      };
    }]).
  controller('AuthLoginCtrl', ['$scope', '$rootScope', '$http', '$window', '$location', 'me',
    function ($scope, $rootScope, $http, $window, $location, me) {
      if (me.isAuthentication()) {
        $window.history.back();
      }

      $scope.login = function () {
        $http.post('/api/auths/login', {
          username: $scope.user.name,
          password: $scope.user.password
        }).
          success(function (data) {
            me.setUser(data);
            $window.history.back();
          }).
          error(function (data, status) {
            $scope.user.password = null;
          });
      };
    }]).
  controller('UserListCtrl', ['$scope', '$rootScope', '$http',
    function ($scope, $rootScope, $http) {
      $http.get('/api/users').
        success(function (data) {
          $rootScope.users = data;
        });
    }]).
  controller('UserShowCtrl', ['$scope', '$rootScope', '$http', '$routeParams',
    function ($scope, $rootScope, $http, $routeParams) {
      var findById = function (id, callback) {
        var res = null;

        if (!$rootScope.users) {
          return callback(null);
        }

        $rootScope.users.forEach(function (user) {
          if (user.id === id) {
            res = user;
          }
        });
        callback(res);
      };

      var userId = $routeParams.id;

      findById(userId, function (user) {
        if (user) {
          $scope.user = user;
        } else {
          $http.get('/api/user/' + userId).
            success(function (data) {
              $scope.user = data;
            });
        }
      });

    }]).
  controller('ProblemListCtrl', ['$scope', '$rootScope', '$http', '$location',
    function ($scope, $rootScope, $http, $location) {
      $scope.go = function (problem) {
        $location.url('/problem/' + problem.id);
      };

      $http.get('/api/problems').
        success(function (data) {
          $rootScope.problems = data;
        });

    }]).
  controller('ProblemShowCtrl', ['$scope', '$http', '$routeParams', '$sce',
    function ($scope, $http, $routeParams, $sce) {
      var problemId = $routeParams.id;

      $http.get('/api/problem/' + problemId).
        success(function (data) {
          $scope.problem = data.problem;
          $scope.trustDescription = $sce.trustAsHtml(data.contents.description);
        });
    }]).
  controller('ProblemCreateCtrl', ['$scope', '$http', '$window',
    function ($scope, $http, $window) {

      $scope.submit = function () {
        $http.post('/api/problems', {
          problem: $scope.problem
        }).
          success(function (data) {
            $window.history.back();
          }).
          error(function (data) {
            alert(JSON.stringify(data.toString()));
          });
      };

    }]).
  controller('SubmissionListCtrl', ['$scope', '$http',
    function ($scope, $http) {
      $http.get('/api/submissions').
        success(function (data) {
          $scope.submissions = data;
        });
    }]).
  controller('SubmissionShowCtrl', ['$scope', '$http', '$routeParams',
    function ($scope, $http, $routeParams) {
      var submissionId = $routeParams.id;

      $http.get('/api/submission/' + submissionId).
        success(function (data) {
          $scope.submission = data;
        });
    }]).
  controller('SubmissionCreateCtrl', ['$scope', '$http', '$window', '$routeParams',
    function ($scope, $http, $window, $routeParams) {
      $("body").animate({scrollTop: 0}, "slow");

      $scope.submit = function () {
        var data = {
          problemId: $routeParams.id,
          submission: {
            language: $scope.submission.language,
            sourceCode: $scope.submission.sourceCode
          }
        };

        $http.post('/api/submissions', data).
          success(function (data) {
            $window.history.back();
          }).
          error(function (data) {
            alert(JSON.stringify(data));
          });
      };
    }]);
