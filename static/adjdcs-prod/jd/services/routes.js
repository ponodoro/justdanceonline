"use strict";

angular.module("jd.services.routes", [])

    .service("Routes", function($http) {
        var self = this

        self.data = {
            routes: null
        }

        $http.get("/debug/v1/routes",{headers:{"x-skuid":"jdcs-admin"}})
            .success(function(routes) {
                self.data.routes = routes
            })
            .error(function(status) {})
    })