// WDF
// World Dance Floor API

require('dotenv').config();

// -- Modules

    // Global
    const axios = require("axios")
    const fs = require('fs');
    const wdf = require("express").Router()
    // Local
    let basicFunc = require("../modules/basicFunc")
    const wdfPlayer = require("../models/wdf-players")
    const Profile = require("../models/profile")

// -- 

// -- Settings
let wdfConfig = JSON.parse(fs.readFileSync("./settings/wdf/wdf_config.json"))

async function getUserProfile(auth,skuId,type) {
    try {
    const ubiRequest = await axios.get("https://public-ubiservices.ubi.com/v3/profiles/me", {
          headers: {
            "Authorization": auth.replace("Ubi_v1 ", "Ubi_v1 t="),
            "Ubi-AppId": "71a93f8c-7b00-47ca-a2de-7dbf8de5a5d3",
            "Host": "public-ubiservices.ubi.com"
          }
        })
    if (type === "jmcs") {
        if (ubiRequest.data) {
          // If US request was successful, do GET on JMCS to receive user's nickname, level etc.
          const jmcsRequest = await axios.get(`https://jmcs-prod.just-dance.com/profile/v2/profiles?profileIds=${ubiRequest.data.profileId}`, {
            headers: {
            "Authorization": auth.replace("Ubi_v1 t=", "Ubi_v1 "),
            "X-SkuId": getRealSku(skuId)
            }
          })
        return jmcsRequest.data
      }
    }
    else if (type === "profileId") {
      if (ubiRequest.data) {
        return ubiRequest.data.profileId
      }
    }
    else if (type === "userId") {
        if (ubiRequest.data) {
          return ubiRequest.data.userId
        }
    }
    else if (type === "nameOnPlatform") {
        if (ubiRequest.data) {
          return ubiRequest.data.nameOnPlatform
        }
    }
  } catch(error) {
      console.log(error)
    return false
  }
}

async function getProfile(req, res, next) {
    let profile
    if (req.header("authorization") && await getUserProfile(req.header("authorization"),req.header("x-skuid"),"profileId")) {
        try {
            profile = await Profile.findOne({ profileId: await getUserProfile(req.header("authorization"),req.header("x-skuid"),"profileId") })
            if (profile == null) res.profile = null;
            else res.profile = profile
            next()
        } catch (err) {
            console.log(err)
            return res.sendStatus(500)
        }
    } else {

        res.sendStatus(400)
    }
}

let userArray = {
    players: {},
    userCount: 0
};

wdf.route("/v1/rooms/:room/:type")

    
    .get(getProfile, async (req, res) => {
        let reqType = req.params.type
        // Current Connected Users (CCU) is for giving the number of players to the client.
        if (reqType === "ccu") {
            return res.send("")
        }
        if (reqType === "session") {
            try {
                const sessions = await wdfPlayer.find({})
                return res.json(sessions)
            }
            catch (err) {
                return res.status(500).json({message:err.message})
            }
        }
    })
    .post(getProfile, async(req, res) => {
        let reqType = req.params.type
        if (reqType === "session-delete-all") {
            await wdfPlayer.deleteMany({}); 
            return res.sendStatus(200)
        }
        if (reqType === "session") {
            // Search all users by pid..
            let checkUser = await wdfPlayer.find({ pid: await getUserProfile(req.header("authorization"),req.header("x-skuid"),"profileId") })
            
            // If user does not exist in WDF players...
            if (checkUser == null || checkUser.length == 0) {
                console.log("Player created SESSIONS")
                const newPlayer = new wdfPlayer({
                    "__class": "RecapEntry",
                    "name": res.profile.name,
                    "avatar": res.profile.avatar,
                    "country": res.profile.country,
                    "skin": res.profile.skin,
                    "platform": req.header("x-skuid").split("-")[1],
                    "portraitBorder": res.profile.portraitBorder || 0,
                    "jdPoints": res.profile.jdPoints,
                    "tournamentBadge": false,
                    "isSubscribed": false,
                    "nameSuffix": 0,
                    "pid": await getUserProfile(req.header("authorization"),req.header("x-skuid"),"profileId"),
                    "score": 0
                })
                await newPlayer.save()
            }
            return res.send("OK")
        }
        if (reqType === "screens") {
            res.send({__class:"ScreenList", "screens":[]})
        }

    })
    .delete(getProfile, async(req, res) => {
        let reqType = req.params.type
        if (reqType === "session") {
            // Search all users by pid..
            let checkUser = await wdfPlayer.find({ pid: await getUserProfile(req.header("authorization"),req.header("x-skuid"),"profileId") })
            
            // If user does not exist in WDF players...
            if (checkUser == null || checkUser.length == 0) {
                return res.sendStatus(403)
            }
            // If user exists, delete it
            else if (checkUser) {
                wdfPlayer.deleteMany({ pid: await getUserProfile(req.header("authorization"),req.header("x-skuid"),"profileId") }).then(function(){
                    console.log("Player deleted SESSIONS"); // Success
                }).catch(function(error){
                    console.log(error); // Failure
                });
                return res.send("OK")
            }
        }
    })

// -- assign-room is used for giving the client the main room to connect to.
wdf.post("/v1/assign-room", (req, res) => {
    res.send("")
    // res.send({
    //     "room": ""
    // })
})

// - server-time is used for giving the client current server time.
wdf.get("/v1/server-time", (req, res) => {
    res.send("" + Number(String(Date.now()).slice(0, 10)))
})

// - online-bosses is used for 2016-2017-2018 for in-game bosses database.
wdf.get("/v1/online-bosses", (req, res) => {
    res.send(basicFunc.getLocalSetting("online-bosses"))
})

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
wdf.use(function (err, req, res, next) {
    if (err) {
      res.sendStatus(basicFunc.getStatusCode("serverError"))
      basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = wdf