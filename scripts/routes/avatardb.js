// AVATARDB
// A database of all available avatars.

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let avatardb = require("express").Router()

    // Local
    let basicFunc = require("../modules/basicFunc")

// --


// -- Avatars
avatardb.get("/v1/avatars", (req, res) => {
    // Replace all _class with OnlineAvatar class.

    // Read avatars
    let avatars = basicFunc.getLocalSetting("avatars"),
        finalAvatarDB = {} // Create an object.
    Object.keys(avatars).forEach(item => { // Loop over all avatars
        avatars[item]["__class"] = "OnlineAvatar" // Change __class
        finalAvatarDB[item] = avatars[item] // Assign the item to the new object.
    })

    basicFunc.debugLog(`[AVATARDB - V1] ${res.profileData.nameOnPlatform} accessed AVATARDB for ${req.header("x-skuid")}`)
    res.send({
        "__class": "OnlineAvatarDb",
        "avatars": finalAvatarDB
    })
});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
avatardb.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = avatardb