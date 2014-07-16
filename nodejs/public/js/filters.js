/*global angular */
'use strict';

/* Filters */

angular.module('myApp.filters', []).
  filter('loadUser', function ($rootScope) {
    return function (UserId) {
      if ($rootScope.users) {
        var result = {};
        $rootScope.users.forEach(function (user) {
          if (user.id === UserId) {
            result = user;
          }
        });

        return result;
      }
    };
  }).
  filter('loadProblem', function ($rootScope) {
    return function (ProblemId) {
      if ($rootScope.problems) {
        var result = {};
        $rootScope.problems.forEach(function (problem) {
          if (problem.id === ProblemId) {
            result = problem;
          }
        });

        return result;
      }
    };
  }).
  filter('submitState', function () {
    var sState = [
      'Pending',
      'Accepted',
      'Wrong Answer',
      'Compiling',
      'Compile Error',
      'Memory Limit Exceed',
      'Output Limit Exceed',
      'Time Limit Exceed',
      'Runtime Error',
      'Internal Error'
    ];

    return function (iState) {
      if (sState.length <= iState) {
        return '';
      }
      return sState[iState];
    };
  });
