// COM-VIDEO
// Unknown route, tag:INFO

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let com = require("express").Router()

    // Local
    let basicFunc = require("../modules/basicFunc")

// --


// -- COM-VIDEO
com.get("/v1/com-videos-fullscreen", (req, res) => {
    res.send([])
});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
com.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = com