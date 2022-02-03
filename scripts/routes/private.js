// CONSTANT-PROVIDER
// Configuration for such settings in-game.

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let private = require("express").Router()


    // Local
    let dbFunc = require("../modules/dbFunc")
    let basicFunc = require("../modules/basicFunc")

// --

// - authenticatePrivate is used for checking given queries for accessing private data.
const authenticatePrivate = function async(req, res, next) {
    // Read required headers.
    const md5 = req.query.md5;
    const skuId = req.query.skuId;
    const isDev = req.query.dev
    const sid = basicFunc.fromBase64(req.query.sid)

    // List of allowed skuIds.
    let allowedSkus = ["jd2019-wiiu-noe", "jd2019-wiiu-noa", "jd2019-nx-all"]

    // If any of these credientals do not exist and client is not a dev, send missingData.
    if (!md5 || !skuId && !isDev) {
        return res.sendStatus(basicFunc.getStatusCode("missingData"))
    }

    // If client got dev query, pass with no check.
    if (isDev) {
        next()
    }

    // checkHmac is for checking if given hmac is valid or not.
    function checkHmac(Hmac) {
        const mapsHash = basicFunc.getJdcs()["sessions"]["mapsFolderMD5"] // MD5 of the maps folder.
        if (Hmac === mapsHash) return true
        else return false
    }

    // If hmac is valid and client's sid exists, pass the client.
    if (checkHmac(md5) && allowedSkus.includes(skuId) && basicFunc.getCCU().players[sid] && basicFunc.getCCU().players[sid].sid) {
        res.sid = sid
        next()
    }
    // If hmac is invalid, send missingData.
    else res.status(basicFunc.getStatusCode("missingData")).send()

}


// -- SONGDB
// Song database for JD19 and above
private.get("/v1/songdb", authenticatePrivate, (req, res) => {
    const skuId = req.query.skuId;

    basicFunc.debugLog(`[PRIVATE - SONGDB] ${basicFunc.getCCU().players[res.sid].nameOnPlatform} accessed LOCAL SONGDB for ${skuId}`)
    return res.send(dbFunc.getSongDB(skuId, "v2"))

});
// --

// -- LOCALISATION
// Localisation database for JD19 and above
private.get("/v1/localisation", authenticatePrivate, (req, res) => {
    const skuId = req.query.skuId;

    basicFunc.debugLog(`[PRIVATE - LOCALISATION] ${basicFunc.getCCU().players[res.sid].nameOnPlatform} accessed LOCALISATION for ${skuId}`)
    return res.send(basicFunc.getLocalSetting("localisation"))

});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
private.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = private