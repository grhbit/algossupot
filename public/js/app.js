/*global angular */
'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'ngRoute',
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.directives'
]).
  config(function ($routeProvider, $locationProvider) {
    $routeProvider.
      when('/join', {
        templateUrl: '/auths/join',
      }).
      when('/login', {
        templateUrl: '/auths/login',
        controller: 'AuthLoginCtrl'
      }).
      when('/users', {
        templateUrl: '/users/list',
        controller: 'UserListCtrl'
      }).
      when('/users/:id', {
        templateUrl: '/users/show',
        controller: 'UserShowCtrl'
      }).
      when('/problems', {
        templateUrl: '/problems/list',
        controller: 'ProblemListCtrl'
      }).
      when('/problems/:id', {
        templateUrl: '/problems/show',
        controller: 'ProblemShowCtrl'
      }).
      when('/submissions', {
        templateUrl: '/submissions/list',
        controller: 'SubmissionListCtrl'
      }).
      when('/submissions/:id', {
        templateUrl: '/submissions/show',
        controller: 'SubmissionShowCtrl'
      }).
      otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
  });
