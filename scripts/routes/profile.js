// PROFILES 
// User profile database

require('dotenv').config();

// -- Modules

  // Global
  const axios = require("axios")
  const uuid = require('uuid');
  const fs = require('fs');
  const bodyParser = require('body-parser');
  const expressip = require('express-ip');
  const profileDb = require("express").Router()

  // Local
  let basicFunc = require("../modules/basicFunc")
  const Profile = require("../models/profile")
  const Leaderboard = require("../models/leaderboard")
  
// --


// -- MIDDLEWARES

    // -- developerAccess 
    // This is for passing the player if their isDev is true.
    const developerAccess = function(req, res, next) {
        if (req.isDev) next()
        else return res.sendStatus(403)
    }
    profileDb.use(bodyParser.json()) // Parsing body.
    profileDb.use(expressip().getIpInfoMiddleware) // Receiving user information by IP.
// --


// --- ROUTES ---


// -- PROFILES 
// User database route.
profileDb.route(/^\/(v[12]+)\/profiles$/i) // Regex, only allow v1 and v2.

    // GET
    // This is for requesting a certain profileId.
    .get(async function(req, res) {
            // If body is broken or does not exist, send bad request.
            if (!req.query.profileIds) return res.sendStatus(basicFunc.getStatusCode("missingData"))

            // Find profile by PID
            const profile = await Profile.findOne({ $or: [{ profileId: req.query.profileIds }, { userId: req.query.profileIds }] })

            // If profile does not exist, send isExisting as false.
            if (profile == null) { 
                basicFunc.debugLog(`[PROFILES - NULL PROFILE] ${res.profileData.nameOnPlatform} requested non-existing profile ${req.query.profileIds}`, "yellow")
                return res.send([{
                    "profileId": req.query.profileIds,
                    "isExisting": false
                }])
            }
            // If profile exists, send it.
            if (profile) {
                basicFunc.debugLog(`[PROFILES - GET PROFILE] ${res.profileData.nameOnPlatform} requested profile ${req.query.profileIds}`)
                const profileObj = profile.toJSON(); // Convert profile to JSON.
                delete profileObj["_id"] && delete profileObj["userId"] // Delete _id and userId from final JSON.
                res.json([profileObj]) 
            }
    })

    // POST
    // This is for updating/creating user's data.
    .post(async function (req, res) {

            // If body is broken or does not exist, send bad request.
            if (Object.keys(req.body).length === 0 || typeof req.body !== "object") return res.sendStatus(basicFunc.getStatusCode("missingData"))

            // Set getProfile
            const profile = await Profile.findOne({ $or: [{ profileId: res.profileData.pid }, { userId: res.profileData.uid }] })

            if (!profile) {
                try {
                    console.log(basicFunc.getCountryByCode(res.profileData.clientIpCountry))
                    basicFunc.debugLog(`[PROFILES - NEW PROFILE] ${req.body.nickname} created an account.`)
                    const newProfile = new Profile({
                        "name": res.profileData.nameOnPlatform,
                        "nickname": req.body.nickname || res.profileData.nameOnPlatform,
                        "avatar": req.body.avatar || 1,
                        "country": req.body.country || basicFunc.getCountryByCode(res.profileData.clientIpCountry)[0]?.CountryId || 1,
                        "skin": req.body.skin || 1,
                        "jdPoints": req.body.jdPoints || 1,
                        "diamondPoints": req.body.diamondPoints || 1,
                        "progression": req.body.progression || {},
                        "history": req.body.history || {},
                        "favorites": req.body.favorites || [],
                        "scores": req.body.scores || {},
                        "unlockedAvatars": req.body.unlockedAvatars || [],
                        "unlockedSkins": req.body.unlockedAvatars || [],
                        "wdfRank": req.body.wdfRank || 0,
                        "stars": req.body.stars || 0,
                        "unlocks": req.body.unlocks || 0,
                        "songsPlayed": req.body.songsPlayed || 0,
                        "platformId": req.body.platformId || "",
                        "profileId": res.profileData.pid,
                        "userId": res.profileData.uid
                    })
                    await newProfile.save()
                    res.send("")
                } catch (err) {
                    console.log(err)
                    res.status(basicFunc.getStatusCode("serverError")).json({ message:err.message })
                }
            }
            
            // If profile exists.
            if (profile) {
                try {
                    basicFunc.debugLog(`[PROFILES - UPDATING PROFILE] ${req.body.nickname} updated their profile.`)
                    for (const key in req.body) {
                        
                        if (key === "name" || key === "profileId" || key === "_id" || key === "userId") continue

                        profile[key] = req.body[key];
                        profile.markModified(key)
                    }
                    await profile.save() // Save the updated profile.
                    res.send("") // Send status 200.
                } catch (err) {
                    res.status(basicFunc.getStatusCode("serverError")).json({ message:err.message })
                }
            }
    })

// -- 

// -- MAP-ENDED
// Add requested map to user's profile, if it exists in our songdb.
profileDb.post(/^\/(v[12]+)\/map-ended$/i, async (req, res) => {

    // Set getProfile
    const profile = await Profile.findOne({ profileId: res.profileData.pid })
            
    if (profile == null) {
        return res.sendStatus(403)
    }
    
    if (req.body.length !== 0 && Array.isArray(req.body)) {
        let mapName = req.body[0]["mapName"]
        let score = req.body[0]["score"]

        // Check if codename exists in the database
        if (!fs.existsSync(`./maps/${mapName}.json`)) return res.sendStatus(404)

        // If score is higher than 13333, return 400.
        if (score > 13333) return res.sendStatus(400)

        // - applyToProfile
        // This is for applying user's score to their profile scores data.
        function applyToProfile() {
            // If scores object does not exist, create it.
            if (!profile.scores) profile.scores = {}
            // If mapName does not exist in scores object, create it.
            if (!profile.scores[mapName]) {
                profile.scores[mapName] = {
                    highest: req.body[0]["score"],
                    isCoopHighscore: false,
                    timesPlayed: 1,
                    lastTimestamp: Date.now()
                }
            }
            // If song exists, continue.
            else if (profile.scores[mapName]) {
                // If new score higher than previous one, update it.
                if (score > profile.scores[mapName]["highest"]) {
                    profile.scores[mapName].highest = score
                }
                // Add 1 to timesPlayed.
                profile.scores[mapName].timesPlayed += 1
                profile.scores[mapName].lastTimestamp = Date.now() // Last time the song was played.

            }

            profile.markModified('scores')
        }

        // - applyToLeaderboard
        // This is for applying user's score to the leaderboard.
        async function applyToLeaderboard() {
            // If profile already got leaderboard for a song and score is not higher, it shouldn't be applied. 
            // This procedure below avoids it.
            leaderboard = await Leaderboard.find({ __class: "LeaderboardEntry_Online", mapName: mapName, profileId: res.profileData.pid })
            if (leaderboard == null || leaderboard.length == 0) {
                basicFunc.debugLog(`[MAP-ENDED - applyToLeaderboard] ${profile.nickname} entered leaderboard of ${mapName} with score ${score}`)
                const lb = new Leaderboard({
                    "__class": "LeaderboardEntry_Online", 
                    "profileId": res.profileData.pid,
                    "score": score,
                    "name": profile.name,
                    "nickname": profile.nickname,
                    "avatar": profile.avatar,
                    "country": profile.country,
                    "platformId": profile.platformId,
                    "alias": profile.alias,
                    "aliasGender": profile.aliasGender,
                    "jdPoints": profile.jdPoints,
                    "portraitBorder": profile.portraitBorder,
                    "mapName": mapName,
                    "timeStamp": Date.now()
                })
                await lb.save()
                return true
            }
            if (leaderboard[0] && leaderboard[0].score < req.body[0]["score"]) {
                basicFunc.debugLog(`[MAP-ENDED - applyToLeaderboard] ${profile.nickname} updated leaderboard score of ${mapName} with ${score}`)
                
                // Delete the previous leaderboard.
                Leaderboard.deleteMany({ __class: "LeaderboardEntry_Online", mapName: mapName, profileId: res.profileData.pid }).then(function(){}).catch(function(error){});
                
                // Create a new leaderboard with updated score.
                const updatedLeaderboard = new Leaderboard({
                    "__class": "LeaderboardEntry_Online", 
                    "profileId": res.profileData.pid,
                    "score": score,
                    "name": profile.name,
                    "nickname": profile.nickname,
                    "avatar": profile.avatar,
                    "country": profile.country,
                    "platformId": profile.platformId,
                    "alias": profile.alias,
                    "aliasGender": profile.aliasGender,
                    "jdPoints": profile.jdPoints,
                    "portraitBorder": profile.portraitBorder,
                    "mapName": mapName,
                    "timeStamp": Date.now()
                })
                await updatedLeaderboard.save()
                return true
            }
            else return;

        }

        // - applyToDOTW
        // This is for applying user's score to dancer of the week if they are on Just Dance 2019.
        async function applyToDOTW() {
            // If profile already got leaderboard for a song and score is not higher, it shouldn't be applied. 
            // This procedure below avoids it.
            dotw = await Leaderboard.find({ __class: "DancerOfTheWeek", mapName: mapName, profileId: res.profileData.pid })
            if (dotw == null || dotw.length == 0) {
                basicFunc.debugLog(`[MAP-ENDED - applyToDOTW] ${profile.nickname} entered DOTW of ${mapName} with score ${score}`)
                const dotwNew = new Leaderboard({
                    "__class": "DancerOfTheWeek", 
                    "score": score,
                    "profileId": res.profileData.pid,
                    "gameVersion": req.header("x-skuid").split("-")[0],
                    "name": profile.name,
                    "nickname": profile.nickname,
                    "avatar": profile.avatar,
                    "country": profile.country,
                    "platformId": profile.platformId,
                    "alias": profile.alias,
                    "aliasGender": profile.aliasGender,
                    "jdPoints": profile.jdPoints,
                    "portraitBorder": profile.portraitBorder,
                    "mapName": mapName,
                    "timeStamp": Date.now()
                })
                await dotwNew.save()
                return true
            }
            if (dotw[0] && dotw[0].score < req.body[0]["score"]) {
                basicFunc.debugLog(`[MAP-ENDED - applyToDOTW] ${profile.nickname} updated DOTW score of ${mapName} with ${score}`)
                Leaderboard.deleteMany({ __class: "DancerOfTheWeek", mapName: mapName, profileId: res.profileData.pid }).then(function(){}).catch(function(error){});
                
                const updatedDOTW = new Leaderboard({
                    "__class": "DancerOfTheWeek", 
                    "score": score,
                    "profileId": res.profileData.pid,
                    "gameVersion": req.header("x-skuid").split("-")[0],
                    "name": profile.name,
                    "nickname": profile.nickname,
                    "avatar": profile.avatar,
                    "country": profile.country,
                    "platformId": profile.platformId,
                    "alias": profile.alias,
                    "aliasGender": profile.aliasGender,
                    "jdPoints": profile.jdPoints,
                    "portraitBorder": profile.portraitBorder,
                    "mapName": mapName,
                    "timeStamp": Date.now()
                })
                await updatedDOTW.save()
                return true
            }
            else return;

        }

        applyToProfile()
        if (req.header("x-skuid") !== "jd2019-nx-all") applyToLeaderboard() // If skuId is not JD2019NX. 
        else if (req.header("x-skuid") === "jd2019-nx-all") applyToDOTW() // If skuId is JD2019NX.

        const updatedProfile = await profile.save() // Save the updated profile.
        res.send("") // Send status 200.
    } else return res.sendStatus(400)

});
// --

// -- FILTER-PLAYERS
// This is for filtering given profileId array and send back the profileIds that exists in our database.
profileDb.post(/^\/(v[12]+)\/filter-players$/i, async (req, res) => {

    // let arrayToFilter = req.body // Body.
    // let filteredArray = [] // Empty array, if there's no matches it will send an empty array.
    // if (arrayToFilter.length !== 0 && Array.isArray(req.body)) { // If body is an array and it's not empty.
    //     for(profile in arrayToFilter) { // For each profileId in array...
    //         if (await Profile.find({ profileId: arrayToFilter[profile] })) { // Checking database
    //             filteredArray.push(arrayToFilter[profile]) // Pushing the final profileIds to filteredArray.
    //         }
    //     }
    //     res.send(filteredArray)
    // } else res.sendStatus(400) // else, send 400

    res.send([]) // Send an empty array, for now...

});
// --

// -- COUNTRY
// This is required for JD2019NX.
profileDb.get(/^\/(v[12]+)\/country$/i, async (req, res) => {
    // Set profile
    const profile = await Profile.findOne({ $or: [{ profileId: res.profileData.pid }, { userId: res.profileData.uid }] })
    if (profile == null) {
        return res.sendStatus(400)
    }
    res.send({
        country: basicFunc.getCountryById(profile.country)[0]?.Id || "US" // Get player's country code by country id.
    })
})
// --

// -- FAVORITES
// This is for adding or removing favorites from user's data.
profileDb.route("/v1/favorites/maps/:mapName")

  // PUT 
  // Used for adding song to favorites array.
  .put(async function(req, res) {


    // Set getProfile
    const profile = await Profile.findOne({ $or: [{ profileId: res.profileData.pid }, { userId: res.profileData.uid }] })
            
    if (profile == null) {
        return res.sendStatus(403)
    }
    // If profile, favorites array and mapName param exists...
    if (profile && profile.favorites && req.params.mapName) {
        if (!profile.favorites.includes(req.params.mapName)) { // If song is already not in favorites...
            profile.favorites.push(req.params.mapName) // Push the song to array.
            profile.markModified("favorites") // Mark that favorites array was updated.
        } else res.sendStatus(400) // If song is already in favorites, send 400.
        await profile.save()
        return res.send("")
    }
    else return res.sendStatus(400)
  })

  // DELETE
  // Used for deleting song from favorites array.
  .delete(async function(req, res) {

    // Set getProfile
    const profile = await Profile.findOne({ $or: [{ profileId: res.profileData.pid }, { userId: res.profileData.uid }] })
            
    if (profile == null) return res.sendStatus(400) // If profile does not exist...
    
    // If profile, favorites array, mapName param exists and requested song is already in favorites...
    if (profile && profile.favorites && profile.favorites.includes(req.params.mapName) && req.params.mapName) {
        // BUG: i don't know why but delete function returns the deleted value as null in the array
        // so we had to use this filter function.
        var filteredArray = profile.favorites.filter(function(value, index, arr){ 
            return value !== req.params.mapName
        });
        profile.favorites = filteredArray // Set filtered array...
        profile.markModified("favorites") 
        
        await profile.save()
        res.send("")
        
    } else res.sendStatus(400)
})





// -- DEV ROUTES

// Creating a user.
profileDb.post("/create-profile", developerAccess, async (req, res) => {
    // Set profileId
    let profileId = basicFunc.getProfileBySID(req.header("authorization")).pid
    // Find profile by PID
    const profile = await Profile.find({ profileId: profileId })
    if (profile == null) {
        const profile = new Profile({
            "name": req.body.name,
            "nickname": req.body.nickname,
            "avatar": req.body.avatar,
            "country": req.body.country,
            "skin": req.body.skin,
            "jdPoints": req.body.jdPoints,
            "diamondPoints": req.body.diamondPoints,
            "progression": {},
            "history": {},
            "favorites": [],
            "unlockedAvatars": [],
            "unlockedSkins": [],
            "wdfRank": req.body.wdfRank,
            "stars": req.body.stars,
            "unlocks": req.body.unlocks,
            "songsPlayed": req.body.unlocks,
            "platformId": req.body.platformId,
            "profileId": res.profileData.pid
        })

        try {
            const newProfile = await profile.save()
            res.status(201).json(newProfile)
        }
        catch (err) {
            res.status(400).json({ message:err.message })
        }
    }
    else {
        res.status(409).json({ message: "Profile already exists." })
    }
});


// Getting all users.
profileDb.get("/", developerAccess, async (req, res) => {
    try {
        const profiles = await Profile.find()
        res.json(profiles)
    }
    catch (err) {
        res.status(500).json({message:err.message})
    }
});

// Deleting all users.
profileDb.delete("/", developerAccess,async (req, res) => {
    try {
        const profiles = await Profile.deleteMany({})
        res.json(profiles)
    }
    catch (err) {
        res.status(500).json({message:err.message})
    }
});

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
profileDb.use(function (err, req, res, next) {
    if (err) {
      res.sendStatus(basicFunc.getStatusCode("serverError"))
      basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})
// --

module.exports = profileDb