// DEBUG 
// Debug options and developer configuration, also used in adminPanel. Only access-able if isDev is enabled.

require('dotenv').config();

// -- Modules

  // Global
  const fs = require("fs");
  const express = require("express")
  const debug = express.Router()
  const axios = require("axios")

  // Local
  let basicFunc = require("../modules/basicFunc")
  let skus = basicFunc.getSetting("skus")
  let serverModSt = fs.statSync(`./${process.env.server_js}.js`) // Read the server's status for status/info.
  
// --

// -- MIDDLEWARES
debug.use(express.json())
// --

// --- ROUTES ---


// -- SKUS
// All available skus for admin panel.
debug.get("/v1/skus", async (req, res) => {
  res.send(basicFunc.getSetting("skus"))
});
// --

// -- ENVS
// Server environments
debug.get("/v1/envs", async (req, res) => {
  res.send(basicFunc.getJdcs().envs)
});
// --

// -- INFO
// Server informationn
debug.get("/v1/info", async (req, res) => {
  res.send({
      "bootTime": serverModSt.mtime,
      "revision": process.env.server_version,
      "branch": serverModSt.dev,
      "deploymentTime": 0,
      "buildId": `${serverModSt.mtime}_${serverModSt.dev}`,
      "birthTime": serverModSt.birthtime
    })
});
// --

// -- Scripts (GET)
// Send a list of all available scripts.
debug.get("/v1/scripts", async (req, res) => {
    res.send(basicFunc.getSetting("ap_scripts"))
});
// --

// -- Scripts (POST)
// Apply given scriptName!
debug.post("/v1/scripts/:scriptName", async (req, res) => {
  
  let scriptName = req.params.scriptName

  // -- Add song
  // Used for adding songs to the song database.
  if (scriptName === "add-songdb") {

    try {

      // Define body
      const body = {
        mapName: req.body["mapName"],
        mapType: req.body["mapType"],
        platform: req.body["platform"],
        title: req.body["title"],
        artist: req.body["artist"],
        coachCount: req.body["coachCount"],
        customtype: req.body["customtype"],
        beatsArray: req.body["beatsArray"],
        endBeat: req.body["endbeat"],
        difficulty: req.body["difficulty"],
        lyricscolor: req.body["lyricscolor"] || "FF0000",
        originaljdversion: req.body["originaljdversion"],
        skumd5: req.body["skumd5"],
        onea: req.body["onea"] || "444444",
        oneb: req.body["oneb"] || "111111",
        twoa: req.body["twoa"] || "AAAAAA",
        twob: req.body["twob"] || "777777"
      }

      // Required body keys
      const requiredKeys = ["mapName","mapType", "platform", "title","artist","coachCount","beatsArray","endbeat","originaljdversion","skumd5"]

      // If required keys are missing, send 400.
      for (const key of requiredKeys) {
        if (typeof req.body[key] === "undefined") 
        return res.status(400).json({
          __class: `jd-debug-${scriptName}`,
          message: `${key} is required and it's missing.`
        });
      }

      // Platform skuIds
      let platformSkus = {
        ps4: "ps4",
        orbis: "ps4",
        nx: "nx",
        pc: "pc"
      }


      // -- Check if song is available, if it is, check other stuff.
      if (basicFunc.isMapAvailable2(body.mapName)) {

        // If mapName already got a skupackage for given platform
        if (basicFunc.getMapJson(body.mapName).skupackages && basicFunc.getMapJson(body.mapName).skupackages[body.platform]) {
          return res.status(400).send({
            __class: `jd-debug-${scriptName}`,
            message: `${body.mapName} for ${body.platform} is already available in JDCS. Please edit the mapJson from edit-map script.`
          })
        }

        // If mapName does not have a sku for given platform, merge it.
        if (basicFunc.getMapJson(body.mapName).skupackages && !basicFunc.getMapJson(body.mapName).skupackages[body.platform]) {
          let mapFile = JSON.parse(fs.readFileSync(`${process.env.maps_folder}/${body.mapName}.json`)) // read mapFile
          // Merge new platform.
          mapFile.skupackages[body.platform] = {
            "md5": body.skumd5.split("_")[1], // sku MD5
            "storageType": 0, // S3 storageType
            "url": `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${platformSkus[body.platform]}/${body.skumd5}.zip`, // sku URL
            "version": 1 // sku Version
          }
          // Write the map to a file.
          fs.writeFileSync(
            `${process.env.maps_folder}/${body.mapName}.json`,
            JSON.stringify(mapFile, null, 2)
          )
          // Notify yunylBot for merge.
          axios.post(`http://54.37.74.200:2530/jdbest/song-added-qc/${body.mapName}`, {
            "title": `${body.title}`,
            "artist": `${body.artist}`,
            "platform": `${body.platform.toUpperCase()}`,
            "mapname": `${body.mapName}`,
            "type": "merged"
          })
          .then(response => {}).catch(e => {})
          // Send message.
          return res.status(200).send({
            __class: `jd-debug-${scriptName}`,
            message: `${body.mapName} was merged with ${body.platform}.`
          })
        }



        
      }
      // --


      
      // -- If song is not available, add it to database.
      else if (!basicFunc.isMapAvailable2(body.mapName)) {
      
      let mapObj = {
        artist: body.artist|| "Placeholder Artist", // Song artist
        // Asset urls
        assets: {},
        // AudioPreview configuration
        audioPreviewData: "",
        coachCount: body.coachCount, // Number of Coaches
        credits: "Just Dance Best is an online mod made by Just Dance Alliance. We are not affiliated with Ubisoft nor own any rights over their copyrighted content and trademark. All rights of the producer and other rightholders to the recorded work reserved. Unless otherwise authorized, the duplication, rental, loan, exchange or use of this video game for public performance, broadcasting and online distribution to the public are prohibited.",
        difficulty: body.difficulty, // Map difficulty
        doubleScoringType: -1,
        jdmAttributes: [],
        lyricsColor: body.lyricscolor + "FF", // Lyric color
        lyricsType: 0, // LyricsType is for configuring classic lyrics or karaoke lyrics.
        mainCoach: -1, // Coach offset, solos are _0 instead of _1 because of this.
        mapLength: parseInt(body.endBeat), // End beat of the map
        mapName: body.mapName, // mapName
        mapType: body.mapType, // mapType, custom or JDU.
        // MapPreviewData
        mapPreviewMpd: `<?xml version=\"1.0\"?>\r\n<MPD xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"urn:mpeg:DASH:schema:MPD:2011\" xsi:schemaLocation=\"urn:mpeg:DASH:schema:MPD:2011\" type=\"static\" mediaPresentationDuration=\"PT30S\" minBufferTime=\"PT1S\" profiles=\"urn:webm:dash:profile:webm-on-demand:2012\">\r\n\t<Period id=\"0\" start=\"PT0S\" duration=\"PT30S\">\r\n\t\t<AdaptationSet id=\"0\" mimeType=\"video/webm\" codecs=\"vp8\" lang=\"eng\" maxWidth=\"720\" maxHeight=\"370\" subsegmentAlignment=\"true\" subsegmentStartsWithSAP=\"1\" bitstreamSwitching=\"true\">\r\n\t\t\t<Representation id=\"0\" bandwidth=\"497536\">\r\n\t\t\t\t<BaseURL>jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_LOW.vp8.webm</BaseURL>\r\n\t\t\t\t<SegmentBase indexRange=\"619-1108\">\r\n\t\t\t\t\t<Initialization range=\"0-619\" />\r\n\t\t\t\t</SegmentBase>\r\n\t\t\t</Representation>\r\n\t\t\t<Representation id=\"1\" bandwidth=\"1486093\">\r\n\t\t\t\t<BaseURL>jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_MID.vp8.webm</BaseURL>\r\n\t\t\t\t<SegmentBase indexRange=\"616-1106\">\r\n\t\t\t\t\t<Initialization range=\"0-616\" />\r\n\t\t\t\t</SegmentBase>\r\n\t\t\t</Representation>\r\n\t\t\t<Representation id=\"2\" bandwidth=\"2964966\">\r\n\t\t\t\t<BaseURL>jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_HIGH.vp8.webm</BaseURL>\r\n\t\t\t\t<SegmentBase indexRange=\"616-1106\">\r\n\t\t\t\t\t<Initialization range=\"0-616\" />\r\n\t\t\t\t</SegmentBase>\r\n\t\t\t</Representation>\r\n\t\t\t<Representation id=\"3\" bandwidth=\"5891936\">\r\n\t\t\t\t<BaseURL>jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_ULTRA.vp8.webm</BaseURL>\r\n\t\t\t\t<SegmentBase indexRange=\"616-1113\">\r\n\t\t\t\t\t<Initialization range=\"0-616\" />\r\n\t\t\t\t</SegmentBase>\r\n\t\t\t</Representation>\r\n\t\t</AdaptationSet>\r\n\t</Period>\r\n</MPD>\r\n`,
        mode: 6, // Mode is for defining if the song should be locked, available to play etc.
        originalJDVersion: body.originaljdversion, // Original JD Version
        // Packages is for defending which sku the map should use in skupackages.
        packages: {
          mapContent: `${body.mapName}_mapContent`
        },
        parentMapName: body.mapName, // parentMapName is usually for definding an alternate's main mapName.
        // All available skuIds
        skuIds: [
          "jd2017-pc-ww"
        ],
        // Menu colors, 1A-1B are the big color and 2A-2B are banner colors. 
        // 1A and 2B are usually lighter when 1B and 2B are darker.
        songColors: {},
        status: 5, // Map Status
        sweatDifficulty: body.difficulty + 1, // sweatDifficulty is not known so just add 1 to difficulty.
        tags: ["Main"], // Tags
        title: body.title || "Placeholder Title", // Song title
        // Urls for audiopreview and videopreview
        urls: {
          [`jmcs://jd-contents/${body.mapName}/${body.mapName}_AudioPreview.ogg`]: `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${body.mapName}_AudioPreview.ogg`,
          [`jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_HIGH.vp8.webm`]: `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${body.mapName}_VideoPreview.webm`,
          [`jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_HIGH.vp9.webm`]: `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${body.mapName}_VideoPreview.webm`,
          [`jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_LOW.vp8.webm`]: `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${body.mapName}_VideoPreview.webm`,
          [`jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_LOW.vp9.webm`]: `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${body.mapName}_VideoPreview.webm`,
          [`jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_MID.vp8.webm`]: `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${body.mapName}_VideoPreview.webm`,
          [`jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_MID.vp9.webm`]: `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${body.mapName}_VideoPreview.webm`,
          [`jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_ULTRA.vp8.webm`]: `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${body.mapName}_VideoPreview.webm`,
          [`jmcs://jd-contents/${body.mapName}/${body.mapName}_MapPreviewNoSoundCrop_ULTRA.vp9.webm`]: `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${body.mapName}_VideoPreview.webm`
        },
        customTypeName: body.customtype,
        serverChangelist: 455481,
        // Skupackage URLS
        skupackages: {}
      }

      // Do some final assignments.


      // Assign assets.
        // If platform is orbis or pc, generate default assets.
        if (body.platform === "orbis" || body.platform === "pc") {
          mapObj.assets["default"] = basicFunc.generateAssets(body.mapName, body.coachCount)
        }
        // If platform is nx, generate default assets.
        else if (body.platform === "nx") {
          mapObj.assets["nx"] = basicFunc.generateAssets(body.mapName, body.coachCount)
        }


      // Assign audioPreviewData.
        mapObj.audioPreviewData = JSON.stringify({
          __class: "MusicTrackData",
          structure: {
              __class: "MusicTrackStructure",
              markers: basicFunc.getBeatsPreview(body.beatsArray)[0], // Generate 30 secs preview markers out of full markers.
              signatures: [{ 
                __class: 'MusicSignature', 
                marker: 0, 
                beats: 4 
              }],
              startBeat: 0,
              endBeat: body.endBeat,
              fadeStartBeat: 0,
              useFadeStartBeat: false,
              fadeEndBeat: 0,
              useFadeEndBeat: false,
              videoStartTime: 0,
              previewEntry: 0,
              previewLoopStart: 0,
              previewLoopEnd: basicFunc.getBeatsPreview(body.beatsArray)[0].length - 1, // markers length - 1
              volume: 0,
              fadeInDuration: 0,
              fadeInType: 0,
              fadeOutDuration: 0,
              fadeOutType: 0
          },
          path: "",
          url: `jmcs://jd-contents/${body.mapName}/${body.mapName}_AudioPreview.ogg` // AudioPreview local JMCS path
        })

      // Assign songColors. Could be better...
        // If menuColors include ",", convert it to RGB.
        if (body.onea.includes(",") || body.oneb.includes(",") || body.twoa.includes(",") || body.twob.includes(",")) {
          mapObj.songColors = {
            songColor_1A: (basicFunc._convertUbiToRGB((body.onea)).toUpperCase()) + "FF",
            songColor_1B: (basicFunc._convertUbiToRGB((body.oneb)).toUpperCase()) + "FF",
            songColor_2A: (basicFunc._convertUbiToRGB((body.twoa)).toUpperCase()) + "FF",
            songColor_2B: (basicFunc._convertUbiToRGB((body.twob)).toUpperCase()) + "FF"
          };
        }
        // If not, just pass the body colors.
        else {
          mapObj.songColors = {
            songColor_1A: (body.onea).toUpperCase() + "FF",
            songColor_1B: (body.oneb).toUpperCase() + "FF",
            songColor_2A: (body.twoa).toUpperCase() + "FF",
            songColor_2B: (body.twob).toUpperCase() + "FF"
          };
        }


      // Assign skupackages.
        mapObj.skupackages[body.platform] = {
          md5: body.skumd5.split("_")[1], // sku MD5
          storageType: 0, // S3 storageType
          url: `https://${basicFunc.getServerUrls("jdskylight")}/jdcs/maps/${body.mapName}/${platformSkus[body.platform]}/${body.skumd5}.zip`, // sku URL
          version: 1 // sku Version
        }
      

      // Write the map to a file.
      fs.writeFileSync(
        `${process.env.maps_folder}/${body.mapName}.json`,
        JSON.stringify(mapObj, null, 2)
      )

      // Notify yunylBot for new song.
      axios.post(`http://54.37.74.200:2530/jdbest/song-added-qc/${body.mapName}`, {
        "title": `${body.title}`,
        "artist": `${body.artist}`,
        "platform": `${body.platform.toUpperCase()}`,
        "mapname": `${body.mapName}`,
        "type": "newsong"
      })
      .then(response => {}).catch(e => {})

      // Send a message that the map was created.
      return res.status(201).send({
          __class: `jd-debug-${scriptName}`,
          message: `${body.mapName} was created successfully for ${body.platform}!`
        })
      }
      // --

    
    } 
    catch(error) {
      return res.status(500).send({
        __class: `jd-debug-${scriptName}`,
        message: error.message
      })
    }
  }
  // --


  // -- Ban user
  // Ban user by given credential.
  if (scriptName === "ban-player") {

    let bannedUsersJSON = basicFunc.getSetting("bannedUsers")


    // addToBannedList creates bannedUserObj.
    async function addToBannedList(profileArr, reason = "No reason given.", bannedBy) {

      if (profileArr.profiles.length > 0) {

        // Loop through all profiles in the array...
        profileArr.profiles.forEach(profile => {

          // Create bannedUserObj
          bannedUsersJSON[profile.profileId] = {
            "profileId": profile.profileId,
            "userId": profile.userId,
            "platformType": profile.platformType,
            "idOnPlatform": profile.idOnPlatform,
            "nameOnPlatform": profile.nameOnPlatform,
            "timestamp": Date.now(),
            "reason": reason,
            "bannedby": bannedBy
          }
          // If pid and uid aren't same, duplicate pid obj for uid.
          if (profile.profileId !== profile.userId) {
            bannedUsersJSON[profile.userId] = bannedUsersJSON[profile.profileId]
          }

        })

      }
      // Write final JSON.
      fs.writeFileSync("./settings/" + JSON.parse(fs.readFileSync("./settings/paths.json"))["bannedUsers"], JSON.stringify(bannedUsersJSON, null,2))
    }

    try {

      let body = {
        banningmethod: req.body.banningmethod,
        banvalue: req.body.banvalue,
        platformType: req.body.platformType,
        reason: req.body.reason,
        bannedBy: req.body.bannedBy
      }

      const requiredKeys = ["banningmethod", "banvalue", "platformType", "bannedBy"]
      const platformTypes = ["wiiu", "psn", "switch", "uplay"]

      // If required keys are missing, send 400.
      for (const key of requiredKeys) {
        if (typeof req.body[key] === "undefined") 
        return res.status(400).json({
          __class: `jd-debug-${scriptName}`,
          message: `${key} is required and it's missing.`
        });
      }

      // Ban user by their username on UbiServices
      if (body.banningmethod === "nameOnPlatform") {

        // If platformType is all, loop all platformTypes to ban given method for all platformTypes.
        if (body.platformType === "all") {

          // Loop all platformTypes
          for await (const platformType of platformTypes) {
            const ubiResponse = await basicFunc.makeRequest("ubiservices", "get", `/v2/profiles?nameOnPlatform=${body.banvalue}&platformType=${platformType}`, {}, {
              "ubi-appid": "d03d28dd-4706-4808-ba6d-13f43ba62a11",
              "authorization": `Ubi_v1 t=${basicFunc.getPreTicket("jmcschn")}`
            })

            if (ubiResponse.data) {
              
              addToBannedList(ubiResponse.data, body.reason, body.bannedBy)
            }
            else {
              return res.status(500).json({
                __class: `jd-debug-${scriptName}`,
                message: `UbiServices error: ${ubiResponse.response.data.message}`
              });
            }
          }

          basicFunc.debugLog(`[DEBUG SCRIPTS - BAN-PLAYER] Banned ${body.banvalue} on all platforms successfully.`)
          // Send final response after looping all platformTypes.
          return res.status(200).json({
            __class: `jd-debug-${scriptName}`,
            message: `Successfully banned ${body.banvalue} on all platforms.`
          });

        }

        // If platformType does not equal all platformTypes...
        if (body.platformType !== "all") {
          const ubiResponse = await basicFunc.makeRequest("ubiservices", "get", `/v2/profiles?nameOnPlatform=${body.banvalue}&platformType=${body.platformType}`, {}, {
            "ubi-appid": "d03d28dd-4706-4808-ba6d-13f43ba62a11",
            "authorization": `Ubi_v1 t=${basicFunc.getPreTicket("jmcschn")}`
          })

          if (ubiResponse.data) {

            // If profiles array is empty send a response
            if (ubiResponse.data.profiles.length === 0) {
              return res.status(400).json({
                __class: `jd-debug-${scriptName}`,
                message: `${body.banvalue} does not have any profile on ${body.platformType}.`
              });
            }

            basicFunc.debugLog(`[DEBUG SCRIPTS - BAN-PLAYER] Banned ${body.banvalue} on ${body.platformType} successfully.`)
            addToBannedList(ubiResponse.data, body.reason, body.bannedBy)
            // Send information response
            return res.status(200).json({
              __class: `jd-debug-${scriptName}`,
              message: `Successfully banned ${body.banvalue} on platform ${body.platformType}`
            });
          }
          else {
            return res.status(500).json({
              __class: `jd-debug-${scriptName}`,
              message: `UbiServices error: ${ubiResponse.response.data.message}`
            });
          }
        }
      }


      
      // Ban user by profileId or userId.
      if (body.banningmethod === "profileId" || body.banningmethod === "userId") {

        const ubiResponse = await basicFunc.makeRequest("ubiservices", "get", `/v2/profiles?${body.banningmethod}=${body.banvalue}`, {}, {
          "ubi-appid": "d03d28dd-4706-4808-ba6d-13f43ba62a11",
          "authorization": `Ubi_v1 t=${basicFunc.getPreTicket("jmcschn")}`
        })

        if (ubiResponse.data) {

          // If profiles array is empty send a response
          if (ubiResponse.data.profiles.length === 0) {
            return res.status(400).json({
              __class: `jd-debug-${scriptName}`,
              message: `${body.banvalue} does not have any profile on ${body.platformType}.`
            });
          }

          basicFunc.debugLog(`[DEBUG SCRIPTS - BAN-PLAYER] Banned ${body.banvalue} on ${body.platformType} successfully.`)
          addToBannedList(ubiResponse.data, body.reason, body.bannedBy)
          // Send information response
          return res.status(200).json({
            __class: `jd-debug-${scriptName}`,
            message: `Successfully banned ${body.banvalue} on platform ${body.platformType}`
          });

        }
        else {
          return res.status(500).json({
            __class: `jd-debug-${scriptName}`,
            message: `UbiServices error: ${ubiResponse.response.data.message}`
          });
        }

      }


    }
    catch(error) {
      return res.status(500).send({
        __class: `jd-debug-${scriptName}`,
        message: error.message
      })
    }


  }
  // --



  // -- Server boosters
  // Add server booster by credential.
  if (scriptName === "server-booster") {

    let serverBoostersJSON = basicFunc.getSetting("serverBoosters")


    // addToServerBoosterList creates serverBoosterObj.
    async function addToServerBoosterList(profileArr, addedby, discordid) {

      if (profileArr.profiles.length > 0) {

        // Loop through all profiles in the array...
        profileArr.profiles.forEach(profile => {

          // Create serverBoosterObj
          serverBoostersJSON[profile.profileId] = {
            "profileId": profile.profileId,
            "userId": profile.userId,
            "platformType": profile.platformType,
            "idOnPlatform": profile.idOnPlatform,
            "nameOnPlatform": profile.nameOnPlatform,
            "timestamp": Date.now(),
            "addedby": addedby,
			"discordid": discordid
          }

          // If pid and uid aren't same, duplicate pid obj for uid.
          if (profile.profileId !== profile.userId) {
            serverBoostersJSON[profile.userId] = serverBoostersJSON[profile.profileId]
          }

        })

      }
      // Write final JSON.
      fs.writeFileSync("./settings/" + JSON.parse(fs.readFileSync("./settings/paths.json"))["serverBoosters"], JSON.stringify(serverBoostersJSON, null,2))
    }

    try {

      let body = {
        findingmethod: req.body.findingmethod,
        findvalue: req.body.findvalue,
        platformType: req.body.platformType,
        reason: "",
        addedBy: req.body.addedBy,
		discordid: req.body.discordid
      }

      const requiredKeys = ["findingmethod", "findvalue", "platformType", "addedBy", "discordid"]
      const platformTypes = ["wiiu", "psn", "switch", "uplay"]

      // If required keys are missing, send 400.
      for (const key of requiredKeys) {
        if (typeof req.body[key] === "undefined") 
        return res.status(400).json({
          __class: `jd-debug-${scriptName}`,
          message: `${key} is required and it's missing.`
        });
      }

      // Add user by their username on UbiServices
      if (body.findingmethod === "nameOnPlatform") {

        // If platformType is all, loop all platformTypes to add given method for all platformTypes.
        if (body.platformType === "all") {

          // Loop all platformTypes
          for await (const platformType of platformTypes) {
            const ubiResponse = await basicFunc.makeRequest("ubiservices", "get", `/v2/profiles?nameOnPlatform=${body.findvalue}&platformType=${platformType}`, {}, {
              "ubi-appid": "d03d28dd-4706-4808-ba6d-13f43ba62a11",
              "authorization": `Ubi_v1 t=${basicFunc.getPreTicket("jmcschn")}`
            })

            if (ubiResponse.data) {
              
              addToServerBoosterList(ubiResponse.data, body.addedBy, body.discordid)
            }
            else {
              return res.status(500).json({
                __class: `jd-debug-${scriptName}`,
                message: `UbiServices error: ${ubiResponse.response.data.message}`
              });
            }
          }

          basicFunc.debugLog(`[DEBUG SCRIPTS - SERVER-BOOSTER] Added ${body.findvalue} on all platforms successfully.`)
          // Send final response after looping all platformTypes.
          return res.status(200).json({
            __class: `jd-debug-${scriptName}`,
            message: `Successfully added ${body.findvalue} on all platforms.`
          });

        }

        // If platformType does not equal all platformTypes...
        if (body.platformType !== "all") {
          const ubiResponse = await basicFunc.makeRequest("ubiservices", "get", `/v2/profiles?nameOnPlatform=${body.findvalue}&platformType=${body.platformType}`, {}, {
            "ubi-appid": "d03d28dd-4706-4808-ba6d-13f43ba62a11",
            "authorization": `Ubi_v1 t=${basicFunc.getPreTicket("jmcschn")}`
          })

          if (ubiResponse.data) {

            // If profiles array is empty send a response
            if (ubiResponse.data.profiles.length === 0) {
              return res.status(400).json({
                __class: `jd-debug-${scriptName}`,
                message: `${body.findvalue} does not have any profile on ${body.platformType}.`
              });
            }

            basicFunc.debugLog(`[DEBUG SCRIPTS - SERVER-BOOSTER] Added ${body.findvalue} on ${body.platformType} successfully.`)
            addToServerBoosterList(ubiResponse.data, body.addedBy, body.discordid)
            // Send information response
            return res.status(200).json({
              __class: `jd-debug-${scriptName}`,
              message: `Successfully added ${body.findvalue} on platform ${body.platformType}`
            });
          }
          else {
            return res.status(500).json({
              __class: `jd-debug-${scriptName}`,
              message: `UbiServices error: ${ubiResponse.response.data.message}`
            });
          }
        }
      }


      
      // Add user by profileId or userId.
      if (body.findingmethod === "profileId" || body.findingmethod === "userId") {

        const ubiResponse = await basicFunc.makeRequest("ubiservices", "get", `/v2/profiles?${body.findingmethod}=${body.findvalue}`, {}, {
          "ubi-appid": "d03d28dd-4706-4808-ba6d-13f43ba62a11",
          "authorization": `Ubi_v1 t=${basicFunc.getPreTicket("jmcschn")}`
        })

        if (ubiResponse.data) {

          // If profiles array is empty send a response
          if (ubiResponse.data.profiles.length === 0) {
            return res.status(400).json({
              __class: `jd-debug-${scriptName}`,
              message: `${body.findvalue} does not have any profile on ${body.platformType}.`
            });
          }

          basicFunc.debugLog(`[DEBUG SCRIPTS - SERVER-BOOSTER] Added ${body.findvalue} on ${body.platformType} successfully.`)
          addToServerBoosterList(ubiResponse.data, body.addedBy, body.discordid)
          // Send information response
          return res.status(200).json({
            __class: `jd-debug-${scriptName}`,
            message: `Successfully added ${body.findvalue} on platform ${body.platformType}`
          });

        }
        else {
          return res.status(500).json({
            __class: `jd-debug-${scriptName}`,
            message: `UbiServices error: ${ubiResponse.response.data.message}`
          });
        }

      }


    }
    catch(error) {
      return res.status(500).send({
        __class: `jd-debug-${scriptName}`,
        message: error.message
      })
    }


  }
  // --


	if (scriptName === "view-song") {
		try {
			return res.send(basicFunc.getMapJson(req.body.mapName))
		}
		catch(error) {
		  return res.status(500).send({
			__class: `jd-debug-${scriptName}`,
			message: error.message
		  })
		}
		
		
	}

})
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
debug.use(function (err, req, res, next) {
  if (err) {
    res.sendStatus(basicFunc.getStatusCode("serverError"))
    basicFunc.writeLog("error", `[DEBUG] ${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
  }
})
// --

module.exports = debug