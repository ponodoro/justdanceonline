// COMMUNITY-REMIX
// Community remix configuration.

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let cmu = require("express").Router()

    let basicFunc = require("../modules/basicFunc")

// --

// -- ACTIVE-CONTEST
// An object of active CMU maps.
cmu.get("/v1/active-contest", (req, res) => {
    
    // If community remix is available, send the map.
    if (basicFunc.getJdcsConfig().CommunityRemixContest.isAvailable) {
        return res.send({
            __class: "CommunityRemixContest",
            mapName: basicFunc.getJdcsConfig().CommunityRemixContest.mapName,
            id: basicFunc.getJdcsConfig().CommunityRemixContest.id
        })
    }
    // If it's not, send empty object.
    else {
        return res.send({})
    }

});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
cmu.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = cmu