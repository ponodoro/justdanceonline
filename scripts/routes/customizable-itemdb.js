// CUSTOMIZABLE-ITEMDB
// A database of all avatars, skins and portrait borders.

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let itemdb = require("express").Router()

    // Local
    let basicFunc = require("../modules/basicFunc")

// --


// -- SESSION 
itemdb.get("/v1/items", (req, res) => {
    basicFunc.debugLog(`[ITEMDB - V1] ${res.profileData.nameOnPlatform} accessed ITEMS for ${req.header("x-skuid")}`)
    res.send({
        "__class": "OnlineCustomizableItemDb",
        "avatars": basicFunc.getLocalSetting("avatars"),
        "skins": basicFunc.getLocalSetting("skins"),
        "portraitBorders": basicFunc.getLocalSetting("portraitBorders")
    })
});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
itemdb.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = itemdb