"use strict";

angular.module("jd.services.envs", [])

    .service("Envs", function($http) {
        var self = this;

        self.envs = []

        $http
            .get('/debug/v1/envs',{headers:{"x-skuid":"jdcs-admin"}})
            .success(function(response) {
                self.envs = response.filter(function(env) {
                    return env !== "local" && env !== "test";
                });
            });
    })