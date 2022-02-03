// Aliasdb
// A database of all available aliases / titles.

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let aliasdb = require("express").Router()

    // Local
    let basicFunc = require("../modules/basicFunc")

// --


// -- Aliases
aliasdb.get("/v1/aliases", (req, res) => {

    basicFunc.debugLog(`[ALIASDB - V1] ${res.profileData.nameOnPlatform} accessed aliases for ${req.header("x-skuid")}`)
    res.send({
        "__class": "OnlineAliasDb",
        "aliases": basicFunc.getLocalSetting("aliases")
    })
});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
aliasdb.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = aliasdb