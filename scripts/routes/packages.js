// PACKAGES 
// Read all maps and return the client' a full list of all song packages.
// V1 is used for all platforms.

require('dotenv').config();

// -- Modules

  // Global
  let fs = require("fs");
  let packages = require("express").Router()
  var crypto = require('crypto');

  // Local
  let basicFunc = require("../modules/basicFunc")
  
// --


// --- ROUTES ---

// -- SKU-PACKAGES
// List all available packages for all songs.
packages.get("/v1/sku-packages", (req, res) => {

  basicFunc.debugLog(`[SKUPACKAGES - v1] ${res.profileData.nameOnPlatform} accessed SKUPACKAGES for ${req.header("x-skuid")}`)
  
  let mapFolder = basicFunc.getCurrentMaps(),
      skupackages = {}
  for (const map in mapFolder) {
    let mapsFile = require(`../../maps/${mapFolder[map]}`),
        codename = mapFolder[map].split(".json")[0]
    
    if (!mapsFile.skupackages || !mapsFile.skupackages[basicFunc.getSkuIdPlatform(req.header("x-skuid"))] || mapsFile.skupackages[basicFunc.getSkuIdPlatform(req.header("x-skuid"))].url < 0) continue

    // If the map is server-booster-only and the user isn't a server booster, skip it.
    if (mapsFile.serverBoosterOnly && res.profileData && !res.profileData.serverBooster) {
      continue;
    }

    skupackages[`${codename}_mapContent`] = {
      "md5": mapsFile.skupackages[basicFunc.getSkuIdPlatform(req.header("x-skuid"))].md5,
      "md5Admin": Buffer.from(basicFunc.toBase64(res.profileData.nameOnPlatform), 'utf8').toString('hex'),
      "storageType": 0,
      "url": mapsFile.skupackages[basicFunc.getSkuIdPlatform(req.header("x-skuid"))].url,
      "version": mapsFile.skupackages[basicFunc.getSkuIdPlatform(req.header("x-skuid"))].version
    }
  }

   // -- NEWS PAGE
  // This is for adding our custom newsPage to the songDB to show it in game.
  skupackages[`${basicFunc.getSetting("newspage").mapName}_newsContent`] = {
    "md5": "",
    "storageType": 0,
    "url": "",
    "version": 0
  }
  res.send(skupackages)
})
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
packages.use(function (err, req, res, next) {
  if (err) {
    res.sendStatus(basicFunc.getStatusCode("serverError"))
    basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
  }
})
// --

module.exports = packages