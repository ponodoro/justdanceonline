"use strict";

angular.module("jd.routes", [])

    .controller("RoutesCtrl", function($scope, Routes) {
        $scope.data = Routes.data

        $scope.highlightRouteName = function(name) {
            var fragments = name.split("/");

            for (var i = 0, n = fragments.length; i < n; ++i)
                if (fragments[i][0] === ":")
                    fragments[i] = "<strong>" + fragments[i] + "</strong>";

            return fragments.join("/");
        }
    })