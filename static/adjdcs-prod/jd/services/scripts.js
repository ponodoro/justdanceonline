"use strict";

angular.module("jd.services.scripts", [])

    .service("Scripts", function($http, $rootScope) {
        var self = this

        self.scripts = {}
        self.scriptIds = []

        $http
            .get('/debug/v1/scripts', {
                headers:{"x-skuid":"jdcs-admin"}
            })
            .success(function(response) {
                self.scripts = response
                self.scriptIds = Object.keys(response).sort()
            })

        self.execute = function(scriptId, data) {
            return $http.post('/debug/v1/scripts/' + scriptId, data, {
                headers: {
                    'x-developer-acc': "adminJDCS-ACC1"
                }
            })
        }
    })