"use strict";

angular.module("jd.scripts", [])

    .controller("ScriptsCtrl", function($scope, Countries, Envs, Languages, Scripts, Sillyname, Skus, Songs) {
        var toastrTitle = 'Scripts';

        $scope.countries = Countries.data;
        $scope.countryCodes = Object.keys(Countries.data);
        $scope.Envs = Envs;
        $scope.languages = Languages.data;
        $scope.languageCodes = Object.keys(Languages.data);
        $scope.Scripts = Scripts;
        $scope.Skus = Skus;
        $scope.Songs = Songs;

        $scope.resetForm = function() {
            $scope.data = {};

            if ($scope.selectedScript) {
                if ($scope.selectedScript.parameters)
                    $scope.selectedScript.parameters.forEach(function(parameter) {
                        if (parameter.sillyname)
                            $scope.data[parameter.id] = Sillyname.generateStupidName();
                        else if (parameter.control === "checkbox")
                            $scope.data[parameter.id] = !!parameter.checked;
                        else
                            $scope.data[parameter.id] = parameter.value;
                    });
            }
        };

        $scope.selectScript = function(selectedScriptId) {
            $scope.selectedScriptId = selectedScriptId;
            $scope.selectedScript = Scripts.scripts[selectedScriptId];
            $scope.resetForm();
        };

        $scope.clearData = function(parameter) {
            delete $scope.data[parameter.id];
        };

        $scope.submit = function() {
            $scope.response = null;
            $scope.status = null;

            var pendingToast = toastr.info('Executing...', toastrTitle);
            Scripts.execute($scope.selectedScriptId, $scope.data)
                .success(function(response, status) {
                    toastr.clear(pendingToast);
                    var message;
                    try {
                        message = response.join(", ").substr(0, 100);
                    } catch (err) {
                        message = response;
                    }
                    toastr.success(message || 'Executed', toastrTitle);
                    $scope.response = JSON.stringify(response, null, 2);
                    $scope.status = status;
                    console.log(arguments);
                })
                .error(function(response, status) {
                    toastr.clear(pendingToast);
                    try {
                        response = JSON.parse(response);
                    } catch (err) {}
                    toastr.error(response || 'Error', toastrTitle);
                    $scope.response = JSON.stringify(response, null, 2);
                    $scope.status = status;
                    console.error(arguments);
                });
        };

        $scope.statusClassName = function(status) {
            if (status >= 200 && status < 300)
                return "alert alert-success";
            if (status < 400)
                return "alert alert-info";
            if (status < 500)
                return "alert alert-warning";
            return "alert alert-danger";
        };

        $scope.copied = function() {
            toastr.success('Copied', toastrTitle);
        }
    })