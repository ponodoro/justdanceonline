// CONTENT-AUTHORIZATION 
// Return specific map's video url data

require('dotenv').config();

// -- Modules

  // Global
  const fs = require("fs"),
    axios = require("axios"),
    contentAuth = require("express").Router(),
    crypto = require("crypto")

  // Local
  let basicFunc = require("../modules/basicFunc")
  
// --

// --- ROUTES ---

// -- MAIN
// Return back specific map's data 
contentAuth.get("/v1/maps/:mapName", (req, res, next) => {

  let mapName = req.params.mapName


  // We check if the mapName is available for given skuId.
  // If it is, we pass to server requests but if it's not, we give 404.
  if (!basicFunc.isMapAvailable(mapName, req.header("x-skuid"))) {
    return res.sendStatus(404)
  }

  // We check if the mapName got a local video JSON in videos folder.
  // If it does, we send it without server requests.
  if (fs.existsSync(`./videos/${mapName}.json`)) {
    basicFunc.debugLog(`[contentAuthorization] ${res.profileData.nameOnPlatform} requested ${mapName} from local.`)
    return res.send(require(`../../videos/${mapName}.json`))
  }

  // We update topPlayedSongs list.
  function tps() {
    // Add count to topPlayedSongs.
    let topPlayedSongs = basicFunc.getSetting("topplayedsongs")
    // If map does not exist in TPS, add it.
    if (!topPlayedSongs[mapName]) {
      topPlayedSongs[mapName] = 1
    }
    // If map already exists, add 1 to the count.
    else if (topPlayedSongs[mapName]) {
      topPlayedSongs[mapName] += 1
    }
    // Write topPlayedSongs back.
    basicFunc.writeSetting("topplayedsongs", JSON.stringify(topPlayedSongs,null,2))
  }
  tps()

  // -----------------------------
  // SERVER REQUESTS
  // -----------------------------


  // -- Create an auth query cookie for JDBEST-CDN and create urls.
  function jdbestCDN() {
    let urls = {},
    cdn_url = basicFunc.getJdcs().urls["jdbest_cdn"]["url"]

    // Check if the OGG audio file exists in the CDN.
    // If it does, continue the process but if it doesn't
    // Throw an error.
    axios.post(`https://${cdn_url}/api/v1/file-exists`, {
      data: {"path": `/private/map/${mapName}/${mapName}.ogg`}
    })
    .then(response => {

      // An object of all available files for content-authorization.
      // We use normal webms for HD webms.
      const available_files = {
        [`${mapName}_ULTRA.webm`]: `${mapName}_HIGH.webm`,
        [`${mapName}_HIGH.webm`]: `${mapName}_HIGH.webm`,
        [`${mapName}_MID.webm`]: `${mapName}_MID.webm`,
        [`${mapName}_LOW.webm`]: `${mapName}_LOW.webm`,
        [`${mapName}_ULTRA.hd.webm`]: `${mapName}_HIGH.webm`,
        [`${mapName}_HIGH.hd.webm`]: `${mapName}_HIGH.webm`,
        [`${mapName}_MID.hd.webm`]: `${mapName}_MID.webm`,
        [`${mapName}_LOW.hd.webm`]: `${mapName}_LOW.webm`,
        [`${mapName}.ogg`]: `${mapName}.ogg`
      }
      
      
      // --------------------------------------------
      // Cookie creation
      // --------------------------------------------
      // Create exp, acl and HMAC for auth query.
    
      // Expiration
        const exp = `exp=${Math.floor(new Date().getTime() / 1000) + basicFunc.getJdcs().sessions["content_auth_expiration"]}` // 1 hour.
      // ACL
        const acl = `acl=/private/map/${mapName}/*`
    
      // HMAC
        const hmac_key = process.env.jdbest_cdn_hmac_key
        const hmac = crypto.createHmac('sha256', hmac_key)
          // Our HMAC is ${exp}~${acl}
          .update(`${exp}~${acl}`)
          .digest('hex');
      
      // --------------------------------------------
      
      
      // Loop over the list of all available files 
      // and create a key for them in urls object.
      Object.keys(available_files).forEach(file => {
        let url_obj = {
          protocol: "https://",
          server_url: cdn_url,
          file_folder: `/private/map/${mapName}/`,
          file: available_files[file],
          auth: `?auth=${exp}~${acl}~hmac=${hmac}`
        }
        
        // Create a key and combine key values of url_obj
        let jmcs_path = `jmcs://jd-contents/${mapName}/${file}`
        urls[jmcs_path] = Object.values(url_obj).reduce((accumulator, currentValue) => accumulator + currentValue)
      })
      
      
      // Send the final ContentAuthorizationEntry response.
      return({
          __class: "ContentAuthorizationEntry",
          duration: 300,
          changelist: 509807,
          urls: urls
      })
  
    }).catch(error =>{
      return false
    })
    
  
  }
  // --

  
  if (jdbestCDN()) {
    basicFunc.debugLog(`[contentAuthorization] ${res.profileData.nameOnPlatform} requested ${mapName} from JDBEST CDN.`)
    return res.send(jdbestCDN())
  }
  // If CDN throws an error, do a request to JMCS-CHN.
  else {
    axios.get(`https://prod-ws.jdcn.ubisoft.cn/content-authorization/v1/maps/${mapName}`, {
      headers: {
        "X-SkuId": "jd2020-ps4-cn",
        "Authorization": `Ubi_v1 ${basicFunc.getPreTicket("jmcschn")}`
      }
    })
    .then(response => {
      basicFunc.debugLog(`[contentAuthorization] ${res.profileData.nameOnPlatform} requested ${mapName} from JMCS CHN.`)
      res.send(response.data) // If JMCS China was received, send it.
    })
    .catch(error => {
      res.sendStatus(400)
    })
  }

  // -----------------------------



})
// --


// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
contentAuth.use(function (err, req, res, next) {
  if (err) {
    return res.sendStatus(basicFunc.getStatusCode("serverError"))
    basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
  }
})
// --

module.exports = contentAuth