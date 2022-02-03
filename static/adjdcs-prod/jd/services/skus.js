"use strict";

angular.module("jd.services.skus", [])

    .service("Skus", function($http) {
        var self = this;

        self.skus = {}
        self.skuIds = []

        $http
            .get('/debug/v1/skus',{headers:{"x-skuid":"jdcs-admin"}})
            .success(function(response) {
                self.skus = response
                self.skuIds = Object.keys(response)
            });
    })