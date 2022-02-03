// SONGDB 
// Read all maps and return the client' a full list of all songs available for their platform.
// V1 is used for all platforms except JD2019 and above.
// V2 is used for JD2019 and above, it does not give a full list of songs at first, it gives local songs and then a URL to full songs.

require('dotenv').config();

// -- Modules

  // Global
  let fs = require("fs");
  let songdb = require("express").Router()
  let md5Dir = require("md5-dir")

  // Local
  let dbFunc = require("../modules/dbFunc")
  let basicFunc = require("../modules/basicFunc")
  
// --

// --- ROUTES ---

// -- SONGS
// List all available songs!
songdb.get("/:version/songs", (req, res, next) => {

  let skuId = req.header("x-skuid")
  let version = req.params.version
  
  // SkuIds who are allowed to access v2 
  let v2AllowedskuIds = ["jd2019-wiiu-noe", "jd2019-wiiu-noa", "jd2019-nx-all"]
  
  basicFunc.debugLog(`[SONGDB - ${version}] ${res.profileData.nameOnPlatform} accessed SONGDB for ${skuId}`)

  // Version V1
  // V1 is used for all platforms except JD2019 and above.
  if (version === "v1" && !v2AllowedskuIds.includes(skuId)) {
    return res.send(
      dbFunc.getSongDB(
        skuId, // skuId of the client
        "v1", // Version of the songDB
        true, // News page
        req.header("accept-language"), // Client language
        res.profileData // UserObj
      )
    )
  }

  // Version v2
  // V2 is used for JD2019 and above, it does not give a full list of songs at first, it gives local songs and then a URL to full songs.
  // Its only available to download if client's SID exists.
  else if (version === "v2" && v2AllowedskuIds.includes(skuId)) {
	 
    const mapsHash = md5Dir.sync(process.env.maps_folder) // MD5 of the maps folder.
	
    return res.send({
      requestSpecificMaps: basicFunc.getLocalSetting("specificMaps"), // List of songs that can be displayed
      songdbUrl: `${basicFunc.getJdcs().server_protocol}://${basicFunc.getJdcs().server_url}/private/v1/songdb?md5=${mapsHash}&skuId=${skuId}&sid=${basicFunc.toBase64(res.profileData.sid)}`, // Local songDB
      localisationUrl: `${basicFunc.getJdcs().server_protocol}://${basicFunc.getJdcs().server_url}/private/v1/localisation?md5=${mapsHash}&skuId=${skuId}&sid=${basicFunc.toBase64(res.profileData.sid)}`, // LocalisationDB
      localTracks: basicFunc.getJdcsConfig()["config"]["localTracks"] // Local tracks
    })
  }

  else return res.sendStatus(basicFunc.getStatusCode("notfound"))
})
// --


// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
songdb.use(function (err, req, res, next) {
  if (err) {
    console.log(err)
    basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${skuId} \n${err}\n\n`)
    return res.sendStatus(basicFunc.getStatusCode("serverError"))
  }
})
// --

module.exports = songdb