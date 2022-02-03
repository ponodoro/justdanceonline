// PLAYLISTDB
// Playlist Database

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let playlistdb = require("express").Router()

    // Local
    let basicFunc = require("../modules/basicFunc")

// --


// -- Avatars
playlistdb.get("/v1/playlists", (req, res) => {

    basicFunc.debugLog(`[PLAYLISTDB - V1] ${res.profileData.nameOnPlatform} accessed PLAYLISTS for ${req.header("x-skuid")}`)
    res.send({
        "__class": "PlaylistDbResponse",
        "db": {}
    }
    )
});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
playlistdb.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = playlistdb