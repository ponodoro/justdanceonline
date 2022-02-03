// MODULE

// Database Function
// This is for returning database data back to the server.
// This file was created on April 30, 2021 16:33

// -- Modules
    // Global
    require('dotenv').config();
    const fs = require("fs"),
      axios = require("axios"),
      chalk = require("chalk"),
      parser = require('accept-language-parser')

    // Local
    const basicFunc = require("../modules/basicFunc")
    const mapFolder = fs.readdirSync(`${process.env.maps_folder}`)
    const newsContent = require("./newsContent")
// --


// -- getSongDB
// Return song database depending on skuId
function getSongDB(skuId, version = "v1", newsPage = false, lang, userObj) {

	// SkuIds who are allowed to access v2 
	let v2AllowedskuIds = ["jd2019-wiiu-noe", "jd2019-wiiu-noa", "jd2019-nx-all"]

    songdbFinal = {} // Assign the main songdb.

    // Loop over each map in mapFolder
    for (const map in mapFolder) {
		
      // Get given mapName's JSON.
      let mapsFile = basicFunc.getMapJson(mapFolder[map].split(".json")[0])
      let mapName = mapsFile.mapName

      // If mapName mapType isn't in allowedMapTypes array, skip it.
      const allowedMapTypes = basicFunc.getJdcsConfig()["arrays"]["allowedMapTypes"]
      if (!allowedMapTypes.includes(mapsFile.mapType) || !mapsFile.mapType) {
        continue;
      }
	  
      // If required stuff below does not exist in the map, skip it and don't add it in final songDB.
      if (mapsFile == null || !mapsFile.mapPreviewMpd || !mapsFile.assets || !mapsFile.urls || !mapsFile.skupackages || !mapsFile.skupackages[basicFunc.getSkuIdPlatform(skuId)] || mapsFile.skupackages[basicFunc.getSkuIdPlatform(skuId)] && mapsFile.skupackages[basicFunc.getSkuIdPlatform(skuId)].url && mapsFile.skupackages[basicFunc.getSkuIdPlatform(skuId)].url.length < 0 || Object.keys(mapsFile.assets).length === 0) {
		    continue;
	    }

      // If the map is server-booster-only and the user isn't a server booster, skip it.
      if (mapsFile.serverBoosterOnly && userObj && !userObj.serverBooster) {
        continue;
      }
	  
      // If db version is v2, skip all JDU exclusives and only keep custom maps.
      if (version === "v2") {
		  
        // If skuId is NX
        if (skuId.includes("nx")) {
          if (mapsFile.mapType !== "custom") {
            continue
          }
        }
        
        // If skuId is WiiU
        if (skuId.includes("wiiu")) {
          
          let asset = mapsFile["assets"]["default"]["coverImageUrl"]
          
          if (asset.includes("ps4") && asset.includes("ggp") && asset.includes("nx")) {
            continue
          }
          
        }
		  }
      
      // Assign song's all keys together for songDB.
      songdbFinal[mapName] = {
        artist: mapsFile.artist,

        // If client's platform got assets object, set it as assets. If it doesn't, set default object as assets.
        assets: mapsFile["assets"][basicFunc.getSkuIdPlatform(skuId)] || mapsFile["assets"]["default"] || {},
        audioPreviewData: mapsFile.audioPreviewData, // AudioPreviewData is for setting audio beats.
        coachCount: mapsFile.coachCount, // Number of coaches.
        credits: "Just Dance Best is an online mod made by Just Dance Alliance. We are not affiliated with Ubisoft nor own any rights over their copyrighted content and trademark. " + mapsFile.credits,
        difficulty: mapsFile.difficulty, // Difficulty
        doubleScoringType: -1, 
        jdmAttributes: [],
        lyricsColor: mapsFile.lyricsColor, // Lyric color
        lyricsType: mapsFile.lyricsType, // Lyric type, can be karaoke or default.
        mainCoach: -1,
        mapLength: mapsFile.mapLength, // Length of the map, for WDF.
        mapName: mapName, // mapName

        // mapPreviewMpd is for keeping data of all available videoPreview JMCS urls.
        mapPreviewMpd: mapsFile.mapPreviewMpd || mapsFile.mapPreviewMpd.videoEncoding.vp9 || mapsFile.mapPreviewMpd.videoEncoding.vp8 || "",
        
        mode: mapsFile.mode || 6, // Classic, locked or on-stage.
        originalJDVersion: mapsFile.originalJDVersion, // Original JD Version

        // Path to the skuPackage.
        packages: {
          mapContent: `${mapName}_mapContent`
        },
        parentMapName: mapsFile.parentMapName, // parent's mapName. Used for ALTs.
        skuIds: mapsFile.skuIds || [], // All available skuIds.
        songColors: mapsFile.songColors || {
          songColor_1A: "444444FF",
          songColor_1B: "111111FF",
          songColor_2A: "AAAAAAFF",
          songColor_2B: "777777FF"
        }, // Song colors. Use defaults if there's none.
        status: mapsFile.status || 3, // Locked, uplay exclusive or else.
        sweatDifficulty: mapsFile.sweatDifficulty, // Sweat difficulty.
        tags: mapsFile.tags || ["Main"], // All available tags.
        title: mapsFile.title, // Song title
        urls: mapsFile.urls, // AudioPreview and VideoPreview URLs.
        serverChangelist: 455481
      }

      // Do some final assignments.

      // Assign customTypeName for maps who got customTypeNameId.
      if (mapsFile.customTypeNameId) {

        let customTypeNameId = mapsFile.customTypeNameId // ID of the customTypeName.
        let songdbLocalisation = basicFunc.getSetting("songdbLocalisation") // Get songdbLocalisation from settings.
        let userLanguage = parser.parse(lang)[0] ? parser.parse(lang)[0].code.toLowerCase() : "en" // Parse user's accept-language header and get their language.

        // Check if the CTNID exists in songdbLocalisation.
        if (songdbLocalisation[customTypeNameId]) {

          // If user's language exists, set it as customTypeName.
          if (songdbLocalisation[customTypeNameId][userLanguage])
            songdbFinal[mapName].customTypeName = songdbLocalisation[customTypeNameId][userLanguage]

          // If user's language does not exist, use EN for default.
          else
            songdbFinal[mapName].customTypeName = songdbLocalisation[customTypeNameId]["en"]
        }
      }
      
      // If the map does not have customTypeNameId but has customTypeName
      // Set customTypeName as itself.
      if (mapsFile.customTypeName && !mapsFile.customTypeNameId) {
        songdbFinal[mapName].customTypeName = mapsFile.customTypeName
      }
      

      // Remove "subscribedSong" and "freeSong" tags. Had to do filter since "delete" replaces with null.
      songdbFinal[mapName]["tags"] = songdbFinal[mapName]["tags"].filter(
          item => item !== "subscribedSong" && item !== "freeSong"
      )

      // -- NEWS PAGE
      // This is for adding our custom newsPage to the songDB to show it in game.
      if (lang && !v2AllowedskuIds.includes(skuId)) {
        songdbFinal[`${basicFunc.getSetting("newspage").mapName}`] = newsContent.getNewsMap(basicFunc.getSetting("newspage"), lang.split(",")[1])
      }
    }
    return songdbFinal // Return the final songDB.
}
// -- 


// -- getSongData
// Return given mapName data back if its available for skuId.
function getSongData(mapName, skuId) {
    if (!basicFunc.isMapAvailable(mapName, skuId)) return null
    else return getMapJson(mapName)
}
// -- 



// -- getSkuPackageDB
// Return package database depending on skuId
function getSkuPackageDB(skuId) {

}
// --

// -- getSkuPackageData
// Return given mapName package back if its available for skuId.
function getSkuPackageData(mapName, skuId) {
    if (!basicFunc.isMapAvailable(mapName, skuId)) return null
    else return getMapJson(mapName)["skupackages"][basicFunc.getSkuIdPlatform(skuId)]
}
// --

module.exports = {
    getSongDB,
    getSkuPackageDB,
    getSongData,
    getSkuPackageData
}