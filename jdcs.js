// Just Dance Best Source Code (version 2.5)
// This file was created on April 24, 2021 10:23 PM

// -- Modules

  // Global
  const express = require("express"),
    app = express(),
    axios = require("axios"),
    mongoose = require("mongoose"),
    chalk = require("chalk"),
    expressip = require('express-ip'), 
    md5Dir = require("md5-dir") 
    fs = require("fs")

  // Local
  const basicFunc = require("./scripts/modules/basicFunc")
  
// --


// -- Mongoose DB connection
if (process.env.connect_to_mongodb === "true") {
  mongoose.connect("mongodb://localhost/jdbestDatabase", {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
  const db = mongoose.connection
  db.on("error", (error) => {
    console.error(error)
  })
  db.on("open", () => {
    basicFunc.debugLog("[mongoDB] Connected to database /jdbestDatabase")
  })
}
else basicFunc.debugLog("[mongoDB] Can't connect to database since connect_to_mongodb is false.", "yellow")
// -- 


// -- JDCS
// The main module of the game. It is responsible for creating modules, configurations,
// maintaining the game state, as well as handling most of the server communication.
// Stable stuff goes into .env while configurations that can change at any moment are stored in here.
  let jdcs = {
    port: process.env.port, // Server port
    server_url: "jdcs-prod.justdancebest.tk",
    server_protocol: "https",
    serverLanguage: "en", // Default language of the server
    // Server status codes
    statusCodes: {
      banned: 401,
      invalidticket: 401,
      invalidskuid: 400,
      missingheader: 403,
      missingdata: 400,
      servererror: 500,
      notfound: 404
    },
    // Server URLs
    urls: {
      // JMCS JDU servers
      jmcs: {
        prod: "jmcs-prod.just-dance.com",
        uat: "jmcs-uat.just-dance.com",
        lt: "jmcs-lt.just-dance.com",
        cert: "jmcs-cert.just-dance.com",
        staging: "jmcs-staging.just-dance.com"
      },
      jmcschn: {
        prod: "prod-ws.jdcn.ubisoft.cn"
      },
      // UbiServices
      ubiservices: {
        prod: "public-ubiservices.ubi.com",
        uat: "uat-ubiservices.uplaypc.ubisoft.cn",
        lt: "lt-public-ubiservices.ubi.com",
        cert: "cert2-public-ubiservices.ubi.com",
        staging: "public-ubiservices.ubi.com"
      },
      // JDSkylight, custom CDN
      jdskylight: {
        prod: "public-cdn.justdancebest.tk"
      },
      jdbest_cdn: {
        url: "jdbest-cdn.justdancebest.tk"
      }
    },
    // Ticket Platform Types
    platformTypes: {
      orbis: "psn",
      ps4: "psn",
      xone: "xbl",
      wiiu: "wiiu",
      pc: "uplay",
      nx: "switch"
    },
    // Sessions
    sessions: {
      mapsFolderMD5: md5Dir.sync(process.env.maps_folder), // MD5 of maps folder.
      sessionTimeLimit: 1200000, // The time limit of user's inactive time.
      content_auth_expiration: 3600 // 1 hour. 
    },
    // Tickets
    tickets: {
      jmcs: "", // Global JMCS is currently disabled due to our accounts getting disabled.
      jmcsCHN: basicFunc.generateJmcsTicket("jmcschn") // Generate China ticket to access JMCS China.
    },
    // Other
    skus: basicFunc.getSetting("skus"), // All available skuIds
    envs: ["prod", "dev"] // All available server environments
  }
  exports.jdcs = jdcs // Export server settings for other scripts.
// --



// -- MIDDLEWARES
app.use(expressip().getIpInfoMiddleware) // Receiving user information by IP.
app.use(express.static("static")) // Make static folder public for access.
app.use(express.json())
// --


// Create required files that are ignored in environment file.
if (!fs.existsSync("./settings/jd/jd_topPlayedSongs.json")) {
  fs.writeFileSync("./settings/jd/jd_topPlayedSongs.json", JSON.stringify({}))
}



// CurrentUsers is an object for keeping all players that are connected.
let currentUsers = {
  players: {},
  userCount: 0
};
exports.currentUsers = currentUsers


// - authenticateJMCS is used for checking user's headers to see if they are valid on JMCS.
// This is useful to avoid stealing files outside the game.
const authenticateJDCS = function async(req, res, next) {
  
  // Read required headers.
  const authorization = req.header("authorization");
  const skuId = req.header("x-skuid");
  const userAgent = req.header("user-agent");

  // Server boosters JSON file.
  let serverBoostersJSON = basicFunc.getSetting("serverBoosters")
	
  

  // -- Update userCount of currentUsers
  currentUsers.userCount = Object.keys(currentUsers.players).length


  // -- If the skuId got isDev tag in skus or x-developer-acc (the header that bypasses all checks) header exists, pass the user without any check and set req.isDev
  if (skuId && jdcs.skus[skuId] && jdcs.skus[skuId]["isDev"] || req.header("x-developer-acc")) {
    res.profileData = {
      nameOnPlatform: req.ipInfo.ip, // Assign dev Ip as nameOnPlatform.
      sid: "dev"
    }
    basicFunc.debugLog(`[authenticateJDCS] Dev access received ${req.originalUrl}, ${req.header("x-skuid")}`)
    basicFunc.writeLog("dev", `${new Date().toISOString()} ${req.ipInfo.ip} ${req.originalUrl} ${req.header("x-skuid")} ${JSON.stringify(req.body)}\n\n`)
    req.isDev = true
    next()
  }
  // --


  // -- If authorization is missing.
  else if (!authorization) {
    res.set("WWW-Authenticate", "Ubi_v1") // Set response WWW-Authenticate header.
    return res.sendStatus(basicFunc.getStatusCode("missingHeader")) // Send missingHeader status back.
  }
  // If skuId is missing.
  else if (!skuId) {
    return res.sendStatus(basicFunc.getStatusCode("missingHeader")) // Send missingHeader status back.
  }
  // --
  
  
  // INIT
  // If all required data is given, pass the user for security and data check.
  // If the user passes, add them to currentUsers. If user is in currentUsers already, it does not
  // Check anything, the functions at the end will check their info and update them.
  // Developers do not pass this check.
  if (authorization && skuId && !req.isDev) {
    
    // Decode Ubi_v1 ticket to read user's session ID, if the result is null, send invalidTicket status.
    let ubiV1header = basicFunc.getUbiV1Header(authorization)
    if (ubiV1header == null) { // If ubiV1 header is null or invalid, don't pass the user.
      basicFunc.writeLog("unauthorized", `${new Date().toISOString()} ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}${req.originalUrl} ${req.header("x-skuid")} ${JSON.stringify(req.body)}\n[INVALID TICKET]\n`)
      basicFunc.debugLog(`[authenticateJDCS] Invalid ticket, not passing.`)
      return res.sendStatus(basicFunc.getStatusCode("invalidTicket")); 
    }
    
    
    // checkSkuId is a function that checks if client's skuId is valid or not, if skuId is invalid, it doesn't pass the client.
    function checkSkuId(skuId) {
      if (jdcs.skus[skuId] && ubiV1header.aid === jdcs.skus[skuId].appId) return true
      else {
        //basicFunc.debugLog(`[authenticateJDCS] User's skuId does not exist or appId does not equal skuId appId.`)
        return false
      }
    }
    

    // checkPlatformType returns the required platformType by reading skuId.
    function checkPlatformType(platformType) {
      if (process.env.checkPlatformType === "true") {
        if (platformType === jdcs.platformTypes[skuId.split("-")[1]]) return true
      }
      else return true
    }

    

    // createSessions checks the client's information, requests UbiServices data and adds them to currentUsers object.
    async function createSessions(sessionId) {
      
      // Do GET on /v3/profiles/sessions on UbiServices to receive user's information.
      const ubiResponse = await basicFunc.makeRequest("ubiservices", "post", "/v3/profiles/sessions", {}, {
          "ubi-appid": "d03d28dd-4706-4808-ba6d-13f43ba62a11",
          "authorization": authorization.replace("Ubi_v1 ", "Ubi_v1 t="),
          "ubi-requestedplatformtype": jdcs.platformTypes[skuId.split("-")[1]]
      })
      // If data was received, check client's ticket platformType and continue.
      if (ubiResponse.data && checkPlatformType(ubiResponse.data.platformType)) {

          // ME
          // This route is for receiving client's country.
          const ubiMEResponse = await basicFunc.makeRequest("ubiservices", "get", "/v1/users/me", {}, {
            "ubi-appid": "d03d28dd-4706-4808-ba6d-13f43ba62a11",
            "authorization": authorization.replace("Ubi_v1 ", "Ubi_v1 t="),
            "ubi-requestedplatformtype": jdcs.platformTypes[skuId.split("-")[1]]
          })
          
          // BAN CHECK
          // If user's profileId or userId is banned from the server, don't pass them.
          if (basicFunc.checkBanned(ubiResponse.data.userId) || basicFunc.checkBanned(ubiResponse.data.profileId)) { // If the profileId exists in banned users
            basicFunc.writeLog("banned", `${new Date().toISOString()} ${ubiResponse.data.nameOnPlatform} ${req.header("x-skuid")} ${JSON.stringify(req.body)}\n[BANNED USER ACCESS]\n`)
            // basicFunc.debugLog(`[authenticateJDCS - createSessions] ${ubiResponse.data.nameOnPlatform} is banned.`, "red")
            return res.status(basicFunc.getStatusCode("banned")).send()
          }
        

          // ADDING USER TO SESSIONS
          // If user is not banned, continue.
          else {
            // basicFunc.debugLog(`[authenticateJDCS - createSessions] ${ubiResponse.data.nameOnPlatform} was added to sessions.`) HAD TO DISABLE THIS CUZ IT WAS ANNOYING
            
            // If player's ME response gives "User not found" or they don't have a country, set default country as US.
            if (!ubiMEResponse.data || !ubiMEResponse.data.country) {
              ubiMEResponse.data = {}; 
              ubiMEResponse.data.country = "US";
            }

            // If user is not in sessions, continue
            if (!currentUsers.players[sessionId]) {
              currentUsers.players[sessionId] = {
                nameOnPlatform: ubiResponse.data.nameOnPlatform, // uplay Username
                clientIpCountry: ubiMEResponse.data.country, // Country from ME
                uid: ubiResponse.data.userId, // userId
                pid: ubiResponse.data.profileId, // profileId
                sid: sessionId, // sessionId
                skuId: skuId, // Current skuId
                epoch: Date.now(), // Epoch to keep them connected with the server.
                serverBooster: false // If the user is a server booster, this will be true.
              }

              // If the user is a server booster, turn serverBooster to true.
              if (serverBoostersJSON[ubiResponse.data.userId] || serverBoostersJSON[ubiResponse.data.profileId]) {
                currentUsers.players[sessionId].serverBooster = true
              }
              
              basicFunc.debugLog(`[authenticateJDCS - NEW PLAYER] ${ubiResponse.data.nameOnPlatform} from ${ubiMEResponse.data.country} entered JDCS from ${req.header("x-skuid")}`)
              // Duplicate sessions of client and set as res.profileData for access everywhere.
              res.profileData = Object.create(currentUsers.players[sessionId])
              next() // Pass the user.
            }
          }
      }
      
      // If there was an issue with UbiServices response, don't pass the user.
      else {
        basicFunc.writeLog("unauthorized", `${new Date().toISOString()} ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}${req.originalUrl} ${req.header("x-skuid")} ${JSON.stringify(req.body)}\n[NO PROFILE OR PLATFORMTYPE MATCH]\n`)
        return res.sendStatus(basicFunc.getStatusCode("invalidTicket"));
      }
    }
    
    
    // updateSessionId updates given key/value inside client's session object.
    function updateSessionId(sessionId, update) {
      // basicFunc.debugLog(`[authenticateJDCS - updateUserSession] Updated user in-game, old epoch was ${currentUsers.players[sessionId].epoch} and the new one is ${Date.now()}`, "blue")
   
      switch(update) {
        // Epoch
        case "epoch":
          currentUsers.players[sessionId].epoch = Date.now()
      }
      // Update global response profileData for access everywhere.
      res.profileData = currentUsers.players[sessionId]
      return;
    }
    
    
    // deleteSessionId deletes given sessionId from currentUsers.
    function deleteSessionId(sessionId) {
      basicFunc.debugLog(`[authenticateJDCS- deleteSessionId] Removed expired user ${currentUsers.players[sessionId]["sid"]}`, "yellow")
      delete currentUsers.players[sessionId] // Delete sessionId
      return;
    }
    
    
    // -- EXECUTING THE FUNCTIONS
    
    
    // If user's sessionId does not exist in players object create sessions.
    if (!currentUsers.players[ubiV1header.sid]) {
      if (checkSkuId(skuId)) { // If skuId exists
        createSessions(ubiV1header.sid) // Create session
      } else return res.sendStatus(basicFunc.getStatusCode("invalidSkuId"));
    }
    
    // If user's sessionId is already in the object and skuId equals header skuId, update their data.
    else if (currentUsers.players[ubiV1header.sid] && currentUsers.players[ubiV1header.sid].skuId === skuId) {
      // If user's epoch has not passed the timeLimit, update their epoch.
      if (Date.now() - currentUsers.players[ubiV1header.sid].epoch < jdcs["sessions"]["sessionTimeLimit"]) {
        updateSessionId(ubiV1header.sid, "epoch") // Update epoch
        next()
      }
    }
    
    // --
    
    else {
      return res.sendStatus(basicFunc.getStatusCode("missingData"))
    }

    
    // Read each sessionId and delete ones that passed the timeLimit, tag:COULDBEIMPROVED
    Object.keys(currentUsers.players).forEach(sessionId => {
      if (Date.now() - currentUsers.players[sessionId]["epoch"] > jdcs["sessions"]["sessionTimeLimit"]) {
        deleteSessionId(sessionId) // Delete sessionId.
        // If a client's session was removed and they send request at the same time it was removed, create a new session.
        if (ubiV1header.sid === sessionId) createSessions(sessionId)
      }
    })
    
  } 
  // --
};

// -- ROUTES

  // -- ALIASDB
  // A database of all available aliases / titles.
  app.use("/aliasdb/", authenticateJDCS, require("./scripts/routes/aliasdb"))
  // --

  // -- AVATARDB
  // A database of all available avatars.
  app.use("/avatardb/", authenticateJDCS, require("./scripts/routes/avatardb"))
  // --

  // -- CAROUSEL
  // Listing all available content such as maps, settings etc.
  app.use("/carousel/", authenticateJDCS, require("./scripts/routes/carousel"))
  // --
  
  // -- COM-VIDEO
  // Unknown route, tag:INFO
  app.use("/com-video/", authenticateJDCS, require("./scripts/routes/com-video"))
  // --

  // -- COMMUNITY-REMIX
  // Community remix configuration.
  app.use("/community-remix/", authenticateJDCS, require("./scripts/routes/community-remix"))
  // --

  // -- CONSTANT-PROVIDER
  // Configuration for such settings in-game.
  app.use("/constant-provider/", authenticateJDCS, require("./scripts/routes/constant-provider"))
  // --

  // -- CONTENT-AUTHORIZATION
  // Return specific map's video url data
  app.use("/content-authorization/", authenticateJDCS, require("./scripts/routes/content-authorization"))
  // --

  // -- CUSTOMIZABLE-ITEMDB
  // A database of all avatars, skins and portrait borders.
  app.use("/customizable-itemdb/", authenticateJDCS, require("./scripts/routes/customizable-itemdb"))
  // --

  // -- DANCE-MACHINE
  // A database of all available blocks for JDM.
  app.use("/dance-machine/", authenticateJDCS, require("./scripts/routes/dance-machine"))
  // --

  // -- DEBUG
  // Debug options and developer configuration, also used in adminPanel. Only access-able if isDev is enabled.
  app.use("/debug", authenticateJDCS, function (req, res, next) {
    if (req.isDev) {
      next()
    } else return res.sendStatus(basicFunc.getStatusCode("missingHeader"))
  }, require("./scripts/routes/debug"));
  // --

  // -- LEADERBOARD
  // List score data for songs worldwide for players.
  app.use("/leaderboard/", authenticateJDCS, require("./scripts/routes/leaderboard"))
  // --
  
  // -- PACKAGES
  // Packages is used for listing all skupackages for songs.
  app.use("/packages/", authenticateJDCS, require("./scripts/routes/packages"))
  // --

  // -- PLAYLISTDB
  // Playlist Database
  app.use("/playlistdb/", authenticateJDCS, require("./scripts/routes/playlistdb"))
  // --

  // -- PRIVATE
  // Private access to DB from JD19 and above.
  app.use("/private/", require("./scripts/routes/private"))
  // --

  // -- PROFILES
  // User profile database
  app.use("/profile/", authenticateJDCS, require("./scripts/routes/profile"))
  // --

  // -- QUESTDB
  // A database of all available quests.
  app.use("/questdb/", require("./scripts/routes/questdb"))
  // --

  // -- SESSION-QUEST
  // Session quest for JD18 and above online quests.
  app.use("/session-quest/", authenticateJDCS, require("./scripts/routes/session-quest"))
  // --

  // -- SONGDB
  // Song database is used for listing all songs' information such as artist, title, assets url and such.
  app.use("/songdb/", authenticateJDCS, require("./scripts/routes/songdb"))
  // --

  // -- STATUS
  // Server status and pinging.
  app.use("/status/", require("./scripts/routes/status"))
  // --

  // -- SUBSCRIPTION
  // PLayer's JDU subscription data.
  app.use("/subscription/", authenticateJDCS, require("./scripts/routes/subscription"))
  // --

  // -- WDF
  // World Dance Floor API
  app.use("/wdf/", authenticateJDCS, require("./scripts/routes/wdf"))
  // --



// --

// Send other routes that we do not have as 404 with empty response.
app.all("/*", (req, res) => {
  return res.status(404).send()
});

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
app.use(function (err, req, res, next) {
  if (err) {
    basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    return res.sendStatus(basicFunc.getStatusCode("serverError"))
  }
})
// --

const listener = app.listen(jdcs.port, function() {
  console.log(
    chalk.blue(`---------- JUST DANCE BEST SERVER (JDCS) ----------\n`),
    `${chalk.blue("Version")}: ${process.env.server_version} ${chalk.blue("Port")}: ${listener.address().port} ${chalk.blue("Environment")}: ${process.env.NODE_ENV}\n`,
    `Server was started successfully.\n`

    );
});


// REPEATING FUNCTIONS
// This is a list of all functions that should be called each x sec/min/hr.

	// JMCS-CHN Ticket Generation
	// Call ticket generation every 1.5 hour since it expires.
	setInterval(function(){
		debugLog(`[generateJmcsTicketCHN] Ticket for JMCS CHN was called after 1 hour(s).`)
		jdcs.tickets.jmcsCHN = basicFunc.generateJmcsTicket("jmcschn")
	}, 3600000);