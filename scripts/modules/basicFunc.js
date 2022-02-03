
// MODULE

// BasicFunction
// This is a module where most server functions are located in.
// This file was created on April 25, 2021 00:38

// -- Modules

    // Global
    require('dotenv').config();
    let fs = require("fs")
    let axios = require("axios")
    let chalk = require("chalk")

    // Local
    let mainServer = require(`../../${process.env.server_js}`)
    const Profile = require("../models/profile")

// --

// -- DATA

  // makeRequest is for requesting data from Ubisoft servers and returning it back.
  const makeRequest = async function(type, method, route, body = {}, headers) {
    switch (type) {


      // -- UbiServices 
      case "ubiservices":
        try {
          headers["Host"] = getServerUrls("ubiservices")
          const response = await axios({
            method: method, // Request method
            url: `https://${getServerUrls("ubiservices")}${route}`, // URL
            headers: headers,
            data: body // If body exists
          })
          return response; // Return the data back
        } catch (error) {
          return error
        }
      // --


      // -- JMCS (Jean Mich Central Server)
      case "jmcs":
        try {
          const response = await axios({
            method: method, // Request method
            url: `https://${getServerUrls("jmcs")}${route}`, // URL
            headers: {
                Authorization: headers["authorization"],
                "X-SkuId": headers["x-skuid"]
            },
            data: body // If body exists
          });
          return response; // Return the data back
        } catch (error) {
          return error;
        }
      // --

      // -- JMCS CHINA
      case "jmcschn":
        try {
          const response = await axios({
            method: method, // Request method
            url: `https://${getServerUrls("jmcschn")}${route}`, // URL
            headers: {
              Authorization: `Ubi_v1 t=${getPreTicket("jmcschn")}`,
              "X-SkuId": "jd2020-ps4-cn"
            },
            data: body // If body exists
          });
          return response; // Return the data back
        } catch (error) {
          return error;
        }
      // --

      // -- JDSKYLIGHT-CDN
      case "jdskylight":
        try {
          const response = await axios({
            method: method, // Request method
            url: `https://${getServerUrls("jdskylight-cdn")}${route}`, // URL
            headers: {},
            data: body // If body exists
          });
          return response; // Return the data back
        } catch (error) {
          return null;
        }
      // --

    }
  };


  // getUserProfile is used for receiving user's profile data.
  const getUserProfile = async function(type,headers) {
    try {
      // "sessions" returns client's profileId, userId, nameOnPlatform and such
      const ubiRequest = await makeRequest("ubiservices", "post", "/v3/profiles/sessions", {}, {
        "authorization": headers.authorization.replace("Ubi_v1 ", "Ubi_v1 t="), // Add t= 
        "Ubi-AppId": "d03d28dd-4706-4808-ba6d-13f43ba62a11", // Default appId
        Host: getServerUrls("ubiservices") // Host header is required for UbiServices.
    })
      // If ubiRequest was successful, pass to switch
      if (ubiRequest.data) {

      switch (type) {
        // Client's JMCS user data
        case "jmcs": 
            const jmcsRequest = await makeRequest("jmcs", "get", `/profile/v2/profiles?profileIds=${ubiRequest.data.profileId}`, {}, headers)
            return jmcsRequest.data

        // Return client's "me" profileID
        case "profileId":
            return ubiRequest.data.profileId
        case "db": 
            return ""
        }

      }
    } 
    catch(error) {
      return error
    }
  }


  
// -- 




// -- CONFIGURATION

  // getJdcs is for returning JDCS configuration.
  const getJdcs = function() { 
    return mainServer.jdcs
  }

  // getCCU is for returning CurrentPlayers object.
  const getCCU = function() { 
    return mainServer.currentUsers
  }

  // getJdcsConfig is for returning JDCS settings configuration..
   const getJdcsConfig = function() { 
    return JSON.parse(fs.readFileSync("./settings/jdcs_Configuration.json"))
  }

  // getSetting is for reading setting JSONs under /settings folder and returning it back.
  const getSetting = function(setting) {
    return JSON.parse(fs.readFileSync("./settings/" + JSON.parse(fs.readFileSync("./settings/paths.json"))[setting]))
  }

  // getCountryById is for finding country object by given id.
  const getCountryById = function(id) {
    return getSetting("countries").filter(country => {
      return country.CountryId == id
    })
  }

  // getCountryByCode is for finding country object by given country code.
  const getCountryByCode = function(code) {
    return getSetting("countries").filter(country => {
      return country.Id == code 
    })
  }

  // writeSetting is for writing setting JSONs under /settings folder.
  const writeSetting = function(setting, data) {
    fs.writeFileSync("./settings/" + JSON.parse(fs.readFileSync("./settings/paths.json"))[setting], data)
    return;
  }

  // getLocalSetting is for reading local setting JSONs under local_files.
  const getLocalSetting = function(setting) {
    return JSON.parse(fs.readFileSync("./local_settings/" + JSON.parse(fs.readFileSync("./local_settings/paths.json"))[setting]))
  }

  // getServerUrls is for returning the right server URL depending on the environment.
  const getServerUrls = function(type) {
    if (getJdcs().urls[type][process.env.NODE_ENV]) return getJdcs().urls[type][process.env.NODE_ENV]
    else {
      return getJdcs().urls[type]
    }
  }
  
 // getSkuIdPlatform is for returning the correct platform for skuPackages.
  const getSkuIdPlatform = function(skuId) {
    
    let skus_obj = getSetting("skus")
    
    // If the skuId exists in skus_obj...
    if (skus_obj[skuId]) {

      // If the platform is PS4, we return ORBIS instead of PS4.
      if (skus_obj[skuId]["platform"] === "ps4")  return "orbis";
      else return skus_obj[skuId]["platform"]
    }
    else {
      return;
    }


  }


// --




// -- MAP DATA

  // getCurrentMaps returns a list of all available maps.
  const getCurrentMaps = function() {
    return fs.readdirSync(`${process.env.maps_folder}`).map(mapName => mapName.split(".json")[0])
  }

  // isMapAvailable checks if given mapName is available for given skuId.
  const isMapAvailable = function(mapName, skuId) {
    let mapFile = getMapJson(mapName)

    if (mapFile && mapFile.skupackages && mapFile.skupackages[getSkuIdPlatform(skuId)]) {
      return true
    } else {
      return false
    }
  }

  // isMapAvailable2 checks if given mapName is available in maps folder.
  const isMapAvailable2 = function(mapName) {
    let mapFile = getMapJson(mapName)
    if (mapFile) {
      return true
    } else {
      return false
    }
  }

  // sortSongArray is used sorting given song array by title and returning it to user.
  const sortSongArray = function(mapArray) {
    let sortedMapArray = [];
    mapArray.forEach(map => {
      if (fs.existsSync(`${process.env.maps_folder}/${map}.json`)) {
        let mapFile = JSON.parse(fs.readFileSync(`${process.env.maps_folder}/${map}.json`))
        sortedMapArray.push(`${mapFile.title}////${map}////${mapFile.artist}////Just Dance ${mapFile.originalJDVersion}`)
      }
    });
    sortedMapArray.sort()
    return sortedMapArray
  }

  // getMapJson returns given mapName's file.
  const getMapJson = function(mapName) {
    if (fs.existsSync(`${process.env.maps_folder}/${mapName}.json`)) return JSON.parse(fs.readFileSync(`${process.env.maps_folder}/${mapName}.json`))
    else return null
  }

  // getPreTicket returns previous ticket from tickets JSON.
  const getPreTicket = function(type) {
    return JSON.parse(fs.readFileSync("./tmp/tokens.json"))[type].ticket
  }

  // generateAssets generates default assets for custom songs.
  const generateAssets = function(mapName, coachCount) {
    // Main assets.
    let assets = {
      "banner_bkgImageUrl": `https://${getServerUrls("jdskylight")}/public/map/${mapName}/textures/${mapName}_banner_bkg.png`,
      "coach1ImageUrl": `https://${getServerUrls("jdskylight")}/public/map/${mapName}/textures/${mapName}_Coach_1.png`,
      "coverImageUrl": `https://${getServerUrls("jdskylight")}/public/map/${mapName}/textures/${mapName}_Cover_Generic.png`,
      "cover_smallImageUrl": `https://${getServerUrls("jdskylight")}/public/map/${mapName}/textures/${mapName}_Cover_Generic.png`,
      "expandCoachImageUrl": `https://${getServerUrls("jdskylight")}/public/map/${mapName}/textures/${mapName}_Cover_AlbumCoach.png`,
      "phoneCoach1ImageUrl": `https://${getServerUrls("jdskylight")}/public/map/${mapName}/textures/${mapName}_Coach_1.png`,
      "phoneCoverImageUrl": `https://${getServerUrls("jdskylight")}/public/map/${mapName}/textures/${mapName}_Cover_Generic.png`,
      "map_bkgImageUrl": `https://${getServerUrls("jdskylight")}/public/map/${mapName}/textures/${mapName}_map_bkg.png`
    }
    // Loop through coachCount and add coach assets.
    for(let i = 0; i < coachCount; i++) {
        assets[`coach${i+1}ImageUrl`] = `https://${getServerUrls("jdskylight")}/public/map/${mapName}/textures/${mapName}_Coach_${i+1}.png`
        assets[`phoneCoach${i+1}ImageUrl`]  = `https://${getServerUrls("jdskylight")}/public/map/${mapName}/textures/${mapName}_Coach_${i+1}.png`;
    }
    return assets
  }

  // getBeatsPreview turns full markers into 30 seconds preview markers.
  const getBeatsPreview = function(array) {
    let goal = 28900 // Find the closest number 30000ms
        array = JSON.parse(array).map(x => x / 48)
        var closest = array.reduce(function (prev, curr) {
        return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
    });
    return [array.slice(0, array.indexOf(closest)).map(x => x * 48)]
  } 


// --



// -- MODERATION

  // checkBanned is for checking if given UUID exists in moderation banned users JSON.
  const checkBanned = function(uuid) {
      if (getSetting("bannedUsers")[uuid]) return true // If user's uuid exists, send true
      else false // If it doesn't, send false.
  }

// --

let tokensGlobal;

// -- AUTHORIZATION

  // generateJmcsTicket is for creating JD authorization tickets to request data from JMCS.
  const generateJmcsTicket = function(type) {
    // If tokens does not exist, create an empty one.
    if (!fs.existsSync("./tmp/tokens.json")) {
      fs.writeFileSync("./tmp/tokens.json", JSON.stringify({ "jmcs": {}, "jmcschn": {"ticket": "", "timeStamp": 0} }))
    }

    // Read tokens.
    let tokensTMP = JSON.parse(fs.readFileSync("./tmp/tokens.json"))

    switch(type) {

      // JMCS
      case "jmcs":
        // If the previous ticket's timestamp has passed an hour, create a new ticket.
        if (Date.now() - tokensTMP.jmcs.timeStamp > 3600000) {
        axios.post("https://jdu-ticketgen.glitch.me/v3/profiles/sessions", {}, {
          headers: {
            "Ubi-AppId": getJdcsConfig().ticket.jmcsDefaultAppId, // Default JMCS appId, Just Dance 2021 PS4
            "env": "prod" // Environment
          }
        })
        .then(response => {
          // If we received ticket, save it and set timestamp.
          if(response.data.ticket) {
            debugLog(`[generateJmcsTicket] Ticket for JMCS was generated.`)
            // Set TMP ticket.
            tokensTMP.jmcs = {
              ticket: response.data.ticket,
              timeStamp: Date.now()
            } 
            fs.writeFileSync("./tmp/tokens.json", (JSON.stringify(tokensTMP,null,2))) // Write to file.
            return response.data.ticket // Return ticket.
          }
        })
        .catch(e => {
          debugLog(`[generateJmcsTicket - ERROR] Error occured with JMCS ticket.`, "yellow")
          return false
        })
      } else {
        // If previous token timestamp was changed in an hour, return the previous ticket.
        debugLog(`[generateJmcsTicket] Returned already existing ticket.`, "yellow", 2000)
        return tokensTMP.jmcs.token
      }

      // JMCSCHN
      case "jmcschn":
        // If the previous ticket's timestamp has passed an hour, create a new ticket.
        if (Date.now() - tokensTMP.jmcschn.timeStamp > 3600000) {
        axios.post("https://jdu-ticketgen.glitch.me/v3/profiles/sessions", {}, {
          headers: {
            "Ubi-AppId": getJdcsConfig().ticket.jmcsCHNDefaultAppId, // Default JMCS appId, Just Dance 2020 CHN PS4
            "env": "prod" // Environment
          }
        })
        .then(response => {
          // If we received ticket, save it and set timestamp.
          if(response.data.ticket) {
            debugLog(`[generateJmcsTicketCHN] Ticket for JMCS CHN was generated.`)
            // Set TMP ticket.
            tokensTMP.jmcschn = {
              ticket: response.data.ticket,
              timeStamp: Date.now()
            } 
            fs.writeFileSync("./tmp/tokens.json", (JSON.stringify(tokensTMP,null,2))) // Write to file.
            return response.data.ticket // Return ticket.
          }
        })
        .catch(e => {
          debugLog(`[generateJmcsTicketCHN - ERROR] Error occured with JMCS CHN ticket.`, "red")
          return false
        })
      } else {
        // If previous token timestamp was changed in an hour, return the previous ticket.
        debugLog(`[generateJmcsTicketCHN] Returned already existing ticket.`, "yellow", 2000)
        return tokensTMP.jmcschn.token
      }
    }
  }

  // getUbiV1Header is for decrypting Ubi_V1 ticket header and return the data back.
  const getUbiV1Header = function(ticket) {
      try {
        // If ticket includes t=, delete it and process
        if (ticket.split(" ")[1].includes("t=")) return JSON.parse(Buffer.from(ticket.split(" ")[1].substring(2).split(".")[0], 'base64').toString('utf-8'))
        else { // If ticket does not contain t=
          return JSON.parse(Buffer.from(ticket.split(" ")[1].split(".")[0], 'base64').toString('utf-8'))
        }
      }
      catch(error) {
          return null
      }
}
  
  // getStatusCode is for returning the right status code by reading JDCS config.
  const getStatusCode = function(type) {
    if (getJdcs().statusCodes[type.toLowerCase()]) return getJdcs().statusCodes[type.toLowerCase()] // If the statusCode exists
    else return getJdcs().statusCodes["serverError"] // If it doesn't return 500 as server error.
  }

// --




// -- DATABASE

  // getProfile is for returning user's profile.
  const getProfile = async function (check) {
    try {
      return await Profile.findOne({ profileId: check.pid })
    } catch (error) {
      console.log("getProfile couldn't find error, the error was:: " + error)
      return null
    }
  }

// --




// -- OTHER

  // toBase64 converts given string to base64.
  const toBase64 = function(str) {
    return(Buffer.from(str, 'utf-8')).toString('base64');
  }

  // fromBase64 converts given base64 to string.
  const fromBase64 = function(str) {
    try {
      return Buffer.from(str, 'base64')
    }
    catch(error) {
      return null
    }
  }

  // debugLog is used for logging debug messages for developers, only works if debugging is enabled.
  // Coloring is green for default.
  const debugLog = function(msg, color = "green", timeout = 0) {
    if (process.env.dev_debug === "true") {
      setTimeout(function(){
        console.log(`${chalk[color](msg.match(/\[(.*?)\]/)[0])} ${msg.split("]")[1].substr(1)}`)
      },timeout);
      return;
    }
  }

  // writeLog is for writing server logs to files to keep up with the issues and such.
  const writeLog = function(type,message) {
    // someone plz improve this -yunyl
    if (!fs.existsSync(`./${process.env.log_folder}/${process.env.log_file}`)) fs.writeFileSync(`./${process.env.log_folder}/${process.env.log_file}`, "");
    if (!fs.existsSync(`./${process.env.log_folder}/${process.env.log_auth_file}`)) fs.writeFileSync(`./${process.env.log_folder}/${process.env.log_auth_file}`, "");
    if (!fs.existsSync(`./${process.env.log_folder}/${process.env.log_debug_file}`)) fs.writeFileSync(`./${process.env.log_folder}/${process.env.log_debug_file}`, "");
    if (!fs.existsSync(`./${process.env.log_folder}/${process.env.log_dev_file}`)) fs.writeFileSync(`./${process.env.log_folder}/${process.env.log_dev_file}`, "");
    
    switch(type) {
      case "error":
        fs.appendFileSync(`./${process.env.log_folder}/${process.env.log_file}`, `${message}`)
        return;
      case "unauthorized":
        fs.appendFileSync(`./${process.env.log_folder}/${process.env.log_auth_file}`, `${message}`)
        return;
      case "debug":
        fs.appendFileSync(`./${process.env.log_folder}/${process.env.log_debug_file}`, `${message}`)
        return;
      case "dev":
        fs.appendFileSync(`./${process.env.log_folder}/${process.env.log_dev_file}`, `${message}`)
        return;
    }
  }

  // rgbToHex converts red green and blue to hex.
  const rgbToHex = function(r, g, b) {
      return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  
  // convertUbiToRGB converts UbiArt colors back to RGB.
  const convertUbiToRGB = function(color) {
      let r;
      let g;
      let b;
      if (color.split(",")[1] == 1) {
          r = 1
      } else if (color.split(",")[1] !== 1) {
          r = parseInt(color.split(",")[1] * 255)
      }
      if (color.split(",")[2] == 1) {
          g = 1
      } else if (color.split(",")[2] !== 1) {
          g = parseInt(color.split(",")[2] * 255)
      }
      if (color.split(",")[3] == 1) {
          b = 1
      } else if (color.split(",")[3] !== 1) {
          b = parseInt(color.split(",")[3] * 255)
      }
      return (rgbToHex(r, g, b))
  }

// All available exports.
module.exports = {
  fromBase64,
  toBase64,
  debugLog,
  writeLog,
  rgbToHex,
  convertUbiToRGB,
  getStatusCode,
  getUbiV1Header,
  generateJmcsTicket,
  checkBanned,
  getProfile,
  getBeatsPreview,
  generateAssets,
  getPreTicket,
  getMapJson,
  isMapAvailable,
  isMapAvailable2,
  getCurrentMaps,
  getSkuIdPlatform,
  getServerUrls,
  getLocalSetting,
  getSetting,
  getJdcsConfig,
  getCCU,
  getJdcs,
  getCountryById,
  getCountryByCode,
  getUserProfile,
  writeSetting,
  makeRequest,
  sortSongArray
}

// -- 
