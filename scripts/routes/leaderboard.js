// LEADERBOARD 
// List score data for songs worldwide for players.

require('dotenv').config();
// -- Modules

    // Global
    const axios = require("axios")
    const uuid = require('uuid');
    const fs = require('fs');
    const bodyParser = require('body-parser');
    const ldboard = require("express").Router()

    // Local
    const Leaderboard = require("../models/leaderboard")
// --

// -- MIDDLEWARES

    // -- developerAccess 
    // This is for passing the player if their isDev is true.
    const developerAccess = function(req, res, next) {
        if (req.isDev) next()
        else return res.sendStatus(403)
    }
// --


// --- ROUTES ---


// -- WORLD
// Send all leaderboard entries for given mapName.
ldboard.get("/v1/maps/:mapName/:type", async (req, res) => {
    
    // Search for all LeaderboardEntry_Online entries.

    // If count query exists
    if (req.query.count && req.query.count > 0) all_leaderboard = await Leaderboard.find({ __class: "LeaderboardEntry_Online", mapName: req.params.mapName }).sort({ score: -1 }).limit(parseInt(req.query.count))
    // If count query does not exist
    else all_leaderboard = await Leaderboard.find({ __class: "LeaderboardEntry_Online", mapName: req.params.mapName }).sort({ score: -1 })    

    // -- World 
    // All available leaderboards.
    if (req.params.type === "world") {
        if (all_leaderboard == null) {
            return res.send({
                "__class": "LeaderboardList",
                "entries": []
            })
        }
        if (all_leaderboard) {
            res.json({
                "__class": "LeaderboardList",
                "entries": all_leaderboard.map((entry, index) => {entry.rank = index + 1; return entry})
            })
        }
    }
    // --

    // -- Friends
    // Not known, we don't know how to get "friends" profileIds.
    else if (req.params.type === "friends") {
        // to be updated
        res.send({
            "__class": "LeaderboardList",
            "entries": []
        })
    }
    // --

    // -- Dancer of The Week
    // JD19 and above, dancer of the week.
    else if (req.params.type === "dancer-of-the-week" && req.header("x-skuid") === "jd2019-nx-all") {
        
        // Find all available DancerOfTheWeek entries.
        all_dotw = await Leaderboard.find({ __class: "DancerOfTheWeek", mapName: req.params.mapName }).sort({ score: -1 }).limit(1)
        
        // If DOTW doesn't exist for the mapName, send empty DancerOfTheWeek.
        if (all_dotw == null || all_dotw.length == 0) {
            res.send({
                "__class": "DancerOfTheWeek"
            })
        }
        
        // If DOTW exists for the mapName, send it.
        if (all_dotw) {
            res.json((all_dotw.map((entry, index) => {entry.rank = index + 1; return entry}))[0])
        }
    }
    else res.sendStatus(403)
});
// --


// -- COUNTRIES
// Send all leaderboard entries for given mapName to client by country.
ldboard.get("/v1/maps/:mapName/countries/:country", async (req, res) => {

    // This checks if country is number, Schema requires it to be number.
    // typeof req.params.country still returns as string, even with parseInt()
    if (/^-?[\d.]+(?:e-?\d+)?$/.test(req.params.country)) {
        // If count query exists
        if (req.query.count && req.query.count > 0) country_leaderboard = await Leaderboard.find({ __class: "LeaderboardEntry_Online", mapName: req.params.mapName, country: req.params.country }).sort({ score: -1 }).limit(parseInt(req.query.count))
        // If count query does not exist
        else country_leaderboard = await Leaderboard.find({ __class: "LeaderboardEntry_Online", mapName: req.params.mapName, country: req.params.country }).sort({ score: -1 })
        
        // If leaderboard is empty, send empty entries.
        if (country_leaderboard == null) {
            return res.send({
                "__class": "LeaderboardList",
                "entries": []
            })
        }

        // If leaderboard is full, send all entries.
        if (country_leaderboard) {
            res.json({
                "__class": "LeaderboardList",
                "entries": country_leaderboard.map((entry, index) => {entry.rank = index + 1; return entry})
            })
        }
    } else res.sendStatus(400)

});
// --

// Getting all users.
ldboard.post("/v1/create-fake-ld/:mapName", developerAccess, async (req, res) => {
    try {
        const lb = new Leaderboard({
            "__class": "LeaderboardEntry_Online",
            "profileId": uuid.v4(),
            "score": Math.floor(Math.random() * 13334) + 0,
            "name": "JDBEST Bot Entry " + Math.floor(Math.random() * 13334) + 0,
            "avatar": 1,
            "country": 2,
            "platformId": "e3",
            "alias": 0,
            "aliasGender": 0,
            "jdPoints": 0,
            "portraitBorder": 0,
            "mapName": req.params.mapName
        })
        const newLeaderboard = await lb.save()
        res.send(newLeaderboard)
    }
    catch (err) {
        res.status(500).json({message:err.message})
    }
});

// Getting all users.
ldboard.get("/", developerAccess, async (req, res) => {
    try {
        const profiles = await Leaderboard.find({})
        res.json(profiles)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
});

// Deleting all users.
ldboard.delete("/", developerAccess, async (req, res) => {
    try {
        const profiles = await Leaderboard.deleteMany({})
        res.json(profiles)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
});

// Deleting all users.
ldboard.delete("/deletebyPIDorUID/:type/:userOrPlayerId", developerAccess, async (req, res) => {
    try {
        const profiles = await Leaderboard.deleteMany({ "__class": req.params.type, "profileId": req.params.userOrPlayerId })
        res.json(profiles)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
});

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
ldboard.use(function (err, req, res, next) {
    if (err) {
      res.sendStatus(basicFunc.getStatusCode("serverError"))
      basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})
// --

module.exports = ldboard