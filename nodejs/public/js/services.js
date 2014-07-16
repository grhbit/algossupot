/*jslint browser:true, eqeq:true, vars:true */
/*global angular */
'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.1').
  factory('users', function () {
    var users = [];
    var userService = {};

    userService.add = function (user) {
      users.push(user);
    };

    userService.list = function () {
      return users;
    };

    userService.find = function (id) {
      var result = null;
      users.forEach(function (user) {
        if (user.id === id) {
          result = user;
        }
      });

      return result;
    };

    return userService;
  }).
  factory('me', function ($rootScope) {
    var me = {
      user: null,
      isAuthentication: function () {
        return (me.user != null) && (me.user.username != null);
      },
      setUser: function (user) {
        me.user = user;
        sessionStorage.me = angular.toJson(user);
      },
      getUser: function () {
        me.user = angular.fromJson(sessionStorage.me);
        return me.user;
      }
    };

    return me;
  });
