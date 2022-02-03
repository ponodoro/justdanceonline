// SUBSCRIPTION
// PLayer's JDU subscription data.

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let subscription = require("express").Router()

    let basicFunc = require("../modules/basicFunc")

// --

// -- REFRESH
// Update player's JDU subscription.
subscription.post("/v1/refresh", (req, res) => {
    
    res.send({
		"validity": true,
		"errorCode": "",
		"timeLeft": 4979101,
		"expiryTimeStamp": "2021-07-14T12:07:20.000Z",
		"platformId": "52569151-952e-4c80-bf75-b3fe38b474a1",
		"trialActivated": false,
		"consoleHasTrial": true,
		"trialTimeLeft": 4979102,
		"trialDuration": "90",
		"trialIsActive": true,
		"needEshopLink": false,
		"autoRefresh": true
	})

});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
subscription.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = subscription