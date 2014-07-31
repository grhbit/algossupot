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
      when('/user/:id', {
        templateUrl: '/users/show',
        controller: 'UserShowCtrl'
      }).
      when('/problems', {
        templateUrl: '/problems/list',
        controller: 'ProblemListCtrl'
      }).
      when('/problem/create', {
        templateUrl: '/problems/create',
        controller: 'ProblemCreateCtrl'
      }).
      when('/problem/:id', {
        templateUrl: '/problems/show',
        controller: 'ProblemShowCtrl'
      }).
      when('/problem/:id/submit', {
        templateUrl: '/submissions/create',
        controller: 'SubmissionCreateCtrl'
      }).
      when('/submissions', {
        templateUrl: '/submissions/list',
        controller: 'SubmissionListCtrl'
      }).
      when('/submission/:id', {
        templateUrl: '/submissions/show',
        controller: 'SubmissionShowCtrl'
      }).
      otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
  });
