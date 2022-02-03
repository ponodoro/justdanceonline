// STATUS 
// Server status and pinging.

require('dotenv').config();

// -- Modules

  // Global
  let fs = require("fs");
  let status = require("express").Router()

  // Local
  let basicFunc = require("../modules/basicFunc")
  const Profile = require("../models/profile")
  let mainSettings = JSON.parse(fs.readFileSync("./settings/jdcs_Configuration.json"))
  let mainServer = require(`../../${process.env.server_js}`)

  
// --



// -- MIDDLEWARES

    // -- developerAccess 
    // This is for passing the player if their isDev is true.
    const developerAccess = function(req, res, next) {
        if (req.isDev) next()
        else return res.sendStatus(403)
    }
// --

// Ping
status.get("/v1/ping", (req, res) => {
     res.send("")
});

// Ping-info
// Current data and status of the server
status.get("/v1/ping-info", async (req, res) => {
    res.send({
		currentMapCount: basicFunc.getCurrentMaps().length,
        currentUserCount: basicFunc.getCCU().userCount,
		totalUserCount: await Profile.countDocuments({}).exec()
    })
});

// CCU-Data
// All current players in CCU.
status.get("/v1/ccu-data", async (req, res) => {
    res.send(basicFunc.getCCU())
});

// Top-played-songs
// A list of top most played songs.
status.get("/v1/top-played-songs", async (req, res) => {
    let sortable = Object.entries(basicFunc.getSetting("topplayedsongs"))
	// Read top played songs setting
        // Sort by entry number
        .sort(([,a],[,b]) => b-a) 
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
	if (sortable.length == 0) {
		return res.send(`There are no top played songs.`)
	}
    let tops = []
     // Push the top 10 (11 because it starts by 0) entries
    for (let i = 0; i < 11; i++) {
		if (fs.existsSync(`${process.env.maps_folder}/${Object.keys(sortable)[i + 2]}.json`)) {
			let mapDetails = JSON.parse(fs.readFileSync(`${process.env.maps_folder}/${Object.keys(sortable)[i + 2]}.json`))
			tops.push(`${i + 1}. **${mapDetails.title}** has been played ${Object.values(sortable)[i + 2]} times.`) 
		} else {}
    }
	if (tops.length == 0) {
		return res.send(`There are no top played songs.`)
	}
    res.send(tops)
});

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
status.use(function (err, req, res, next) {
    if (err) {
      res.sendStatus(basicFunc.getStatusCode("serverError"))
      basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = status