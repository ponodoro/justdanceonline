// SESSION-QUEST
// Session quest for JD18 and above online quests.

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let session = require("express").Router()

    // Local
    let basicFunc = require("../modules/basicFunc")

// --


// -- SESSION 
session.get("/v1", (req, res) => {
    res.send({
        "__class": "SessionQuestService::QuestData",
        "newReleases": []
    })
});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
session.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = session