"use strict";

angular.module("jd.services.songdb", [])

    .service("Songs", function($http) {
        var self = this

        self.songs = {
            songlist: null
        }

        $http.get("/private/songdb/v2/songs/nx.json",{headers:{"authorization": "ubi_v1","x-skuid":"jd2017-pc-ww","x-developer-acc":"adminJDCS-ACC1"}})
            .success(function(response) {
                self.songs.songlist = response
                self.songs.mapNames = Object.keys(response).sort()
            })
            .error(function(status) {

            })

        self.putSongs = function(data) {
            $http.put(apiUrl + "songs", data.songlist)
                .success(function() {
                    console.log("PUT succeeded")
                })
                .error(function(status) {
                    console.log("PUT failed: " + status)
                })
        }

        self.putSong = function(mapName, data) {
            $http.put(apiUrl + "songs/" + mapName, JSON.stringify(data))
                .success(function() {
                    console.log("PUT succeeded")
                })
                .error(function(status) {
                    console.log("PUT failed: " + status)
                })
        }

        self.deleteSong = function(mapName) {
            $http.delete(apiUrl + "songs/" + mapName)
                .success(function() {
                    console.log("Delete succeeded")
                })
                .error(function(status) {
                    console.log("Delete failed: " + status)
                })
        }
    })