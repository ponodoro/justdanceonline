// DANCE-MACHINE
// A database of all available blocks for JDM.

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let fs = require("fs")
    let jdm = require("express").Router()

    // Local
    let basicFunc = require("../modules/basicFunc")

// --


// -- Blocks
jdm.get("/v1/blocks", (req, res) => {

  basicFunc.debugLog(`[BLOCKS - V1] ${res.profileData.nameOnPlatform} accessed BLOCKS for ${req.header("x-skuid")}`)
  // Read blocks folder
  let blockFolder = fs.readdirSync("./maps_blocks/"),
    blocksFinal = {} // Assign the main blocks.
  
  // Loop over each map in blockFolder
  for (const map in blockFolder) {
    let blocksFile = require(`../../maps_blocks/${blockFolder[map]}`),
        codename = blockFolder[map].split(".json")[0]
    
    // Assign blocks all keys together for blockDB.
    blocksFinal[codename] = blocksFile
  }
  // Send the final blockDB.
  res.send({
    "__class": "OnlineBlockDb",
    "blocks": blocksFinal
  }) 
});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
jdm.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = jdm