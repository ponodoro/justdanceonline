// QUESTDB
// A database of all available quests.

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let questdb = require("express").Router()

    // Local
    let basicFunc = require("../modules/basicFunc")

// --


// -- Quests
questdb.get("/v1/quests", (req, res) => {
    
    res.send({
        __class: "OnlineQuestDb",
        quests: basicFunc.getLocalSetting("quests")
    })

});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
questdb.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = questdb