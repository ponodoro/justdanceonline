"use strict";

angular.module("jd", [
        "ngClipboard",
        "ngRoute",
        "ngSanitize",
        "jd.home",
        "jd.routes",
        "jd.scripts",
        "jd.services.countries",
        "jd.services.envs",
        "jd.services.languages",
        "jd.services.routes",
        "jd.services.scripts",
        "jd.services.sillyname",
        "jd.services.skus",
        "jd.services.songdb",
    ])

    .config(["$routeProvider", "ngClipProvider", function($routeProvider, ngClipProvider) {
        $routeProvider.when("/home", {
            templateUrl: "/adjdcs-prod/jd/home/home.html",
            controller: "HomeCtrl"
        })
        $routeProvider.when("/routes", {
            templateUrl: "/adjdcs-prod/jd/routes/routes.html",
            controller: "RoutesCtrl"
        })
        $routeProvider.when("/scripts", {
            templateUrl: "/adjdcs-prod/jd/scripts/scripts.html",
            controller: "ScriptsCtrl"
        })
        $routeProvider.otherwise({
            redirectTo: "/home"
        })

        ngClipProvider.setPath("//cdnjs.cloudflare.com/ajax/libs/zeroclipboard/2.1.6/ZeroClipboard.swf");
    }])

    .controller("ApplicationCtrl", function($scope, $location, $http) {
        $scope.$on('$routeChangeSuccess', function() {
            $scope.currentRoute = $location.path()
        })

        $http
            .get('/debug/v1/info', {
                headers: {
                    'x-skuid': "jdcs-admin"
                }
            })
            .success(function(response) {
                $scope.info = response;
            });
    })