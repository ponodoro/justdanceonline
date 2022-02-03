// CAROUSEL
// Listing all available content such as maps, settings etc.

require('dotenv').config();

// -- Modules

    // Global
    const fs = require("fs")
    const axios = require("axios");
    const express = require("express")
    const carousel = express.Router()

    // Local
    const basicFunc = require("../modules/basicFunc")
    const Profile = require("../models/profile")

// --
carousel.use(express.json())
const mapsSorted = []; // Array out of route so it does not have to be updated on each user requested.


// -- Functions

  // getPage returns actionList depending on page.
  function getPage(page) {
    switch(page) {
        case "party":
            return "partyMap"
        case "sweat":
            return "sweatMap"
        case "partycoop": 
            return "partyMapCoop"
        case "create-playlist":
            return "create-playlist"
        case "create-challenge":
            return "create-challenge"
        case "kids": 
            return "kidsMap"
        default: 
            return "partyMap"
    }
  }

  // getTopSongs returns a list of top played songs.
  function getTopSongs() {
    let sortable = Object.entries(basicFunc.getSetting("topplayedsongs")) // Read top played songs setting
        // Sort by entry number
        .sort(([,a],[,b]) => b-a) 
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    let tops = []
    for (let i = 0; i < 11; i++){ tops.push(Object.keys(sortable)[i]) } // Push the top 10 (11 because it starts by 0) entries
    return tops
  }

  // getRecommendations returns recommendeds for carousel.
  recommendedSongs = [];
  function setRecommendations() {
    // If recommendedSongs is empty, push songs to it, if it's not, return it directly.
    if (recommendedSongs.length == 0) {
      recommendedSongs = basicFunc.getJdcsConfig().arrays.recommendedSongs // Append the forced recommendations.
      // Push random recommendations from mapsSorted.
      for (var i = 0; i < 10; i++) {
        // If the random map is not in forced recommendations, push it. If it is, it will be skiped.
        let randomNumber = Math.floor(Math.random() * mapsSorted.length)
        if (!recommendedSongs.includes(mapsSorted[randomNumber])) {
          recommendedSongs.push((mapsSorted[randomNumber].split("////")[1]));
        }
      }
    }
    return basicFunc.sortSongArray(recommendedSongs)
  }
  
  // getComponent returns components for Item.
  function getComponent(type, mapName) {
    switch(type) {

      // JD_CarouselContentComponent_Song (main map component)
      case "JD_CarouselContentComponent_Song":
        JD_CarouselContentComponent_Song = [{
              __class: "JD_CarouselContentComponent_Song",
              mapName: mapName
        }]
        // If the song got new tag, enable isNewSong
        if (basicFunc.getJdcsConfig().arrays.recommendedSongs.includes(mapName)){
          JD_CarouselContentComponent_Song[0]["isNewSong"] = true
        }
        return JD_CarouselContentComponent_Song

      // JD_CarouselContentComponent_Shuffle (shuffle component)
      case "JD_CarouselContentComponent_Shuffle":
        JD_CarouselContentComponent_Shuffle = [{
          "__class": "JD_CarouselContentComponent_Shuffle"
        }]
        return JD_CarouselContentComponent_Shuffle
    }
  }


// --

carousel.post("/*/pages/:page", async(req, res) => {

  // Page name
  const page = req.params.page
  // Client language, uses serverLanguage as default.
  let lang;
  if (req.header("accept-language")) {
	  lang = (req.header("accept-language")).split(",")[1].split(";")[0] || basicFunc.getJdcs().serverLanguage
  } else {
	  lang = basicFunc.getJdcs().serverLanguage
  }

  basicFunc.debugLog(`[CAROUSEL - ${page}] ${res.profileData.nameOnPlatform} accessed CAROUSEL for ${req.header("x-skuid")}`)
  
  // Check local page first, if it exists send it.
  if (fs.existsSync(`./local_settings/pages/${page}.json`)) {
    res.send(JSON.parse(fs.readFileSync(`./local_settings/pages/${page}.json`)))
  }

  // If it does not exist locally, pass the page to our carousel creation function.
  else {

    // Party / Sweat / PartyCoop / Create-Challenge / Create-Playlist 
    // These pages below accesses regular carousel with maps but with different actionList.

	switch (page.toLowerCase()) {
		case "party":
		case "sweat":
		case "partycoop":
		case "create-challenge":
		case "create-playlist":
		  const party = {
			__class: "JD_CarouselContent",
			categories: JSON.parse(fs.readFileSync("./local_settings/carousel/categories.json")),
			actionLists: JSON.parse(fs.readFileSync("./local_settings/carousel/actionLists.json")),
			songItemLists: JSON.parse(fs.readFileSync("./local_settings/carousel/songItemLists.json"))
		  }

		  const mapFolder = fs.readdirSync(process.env.maps_folder)
		  // If mapsSorted length is 0, which means there are no maps sorted, sort and push.
		  if (mapsSorted.length == 0) {
			// Loop over mapFolder.
			mapFolder.forEach(map => {
			  // Sort mapFolder maps by pushing their title and codename to mapListSorted array.
			  let mapDetails = JSON.parse(fs.readFileSync(`${process.env.maps_folder}/${map}`))
			  mapsSorted.push(`${mapDetails.title}////${map.split(".")[0]}////${mapDetails.artist}////Just Dance ${mapDetails.originalJDVersion}`)
			})
		  }
		  mapsSorted.sort() // Sort the mapFolder for A-Z.
		  setRecommendations() // Set recommendations.

		  const categories = party.categories
		  
		  // CATEGORIES 
		  // Loop over sorted maps and such to push items.


		  // 0 - Main category, push all songs.
		  mapsSorted.forEach(mapName => {
			categories[0].items.push({
			  "__class": "Item",
			  "isc": "grp_cover",
			  "act": "ui_component_base",
			  "components": getComponent("JD_CarouselContentComponent_Song", mapName.split("////")[1]),
			  "actionList": getPage(page)
			})
		  })

		  
		  // 1 - Recommended, push all recommendations.
		  recommendedSongs.forEach(mapName => {
			categories[1].items.push({
			  "__class": "Item",
			  "isc": "grp_cover",
			  "act": "ui_component_base",
			  "components": getComponent("JD_CarouselContentComponent_Song", mapName),
			  "actionList": getPage(page)
			})
		  })

		  // 2 - Top Played Songs
		  getTopSongs().forEach(mapName => {
			categories[2].items.push({
			  "__class": "Item",
			  "isc": "grp_cover",
			  "act": "ui_component_base",
			  "components": getComponent("JD_CarouselContentComponent_Song", mapName),
			  "actionList": getPage(page)
			})
		  })

		  // Add category only for server-boosters.
		  // If the map is server-booster-only and the user isn't a server booster, skip it.
		  if (res.profileData.serverBooster) {
			// Read sbCategory from local settings and push it to the main categories.
			let sbCategory = JSON.parse(fs.readFileSync("./local_settings/carousel/serverBoosters.json"))
			categories.push(sbCategory)
		  }


		  // - FILTERING
		  // This process below will push maps depending on the filter object.
		  
		  // - Loop all over categories to see which ones got filter.
		  categories.forEach(category => {

			// - Loop over mapsSorted.
			mapsSorted.forEach(mapName => {
			  // Read each map's file.
			  mapFile = JSON.parse(fs.readFileSync(`${process.env.maps_folder}/${mapName.split("////")[1]}.json`))
			  // If filter type equals song's type, push it
			  if (category.filter && category.filter[category.filter.type] == mapFile[category.filter.type]) {
				  category.items.push({
					"__class": "Item",
					"isc": "grp_cover",
					"act": "ui_component_base",
					"components": getComponent("JD_CarouselContentComponent_Song", mapName.split("////")[1]),
					"actionList": getPage(page)
				  })
				}
			})
			// -
		  })
		  // -


		  // - Themed playlists
		  // Add themed playlists at start.
		  const themedPlaylists = basicFunc.getSetting("themedPlaylists").map(({ title, songs=[] }) => ({
			"__class": "Category",
			"title": title,
			"act": "ui_carousel",
			"isc": "grp_row",
			"items": basicFunc.sortSongArray(songs).map(song => ({
				"__class": "Item",
				"isc": "grp_cover",
				"act": "ui_component_base",
				"components": getComponent("JD_CarouselContentComponent_Song", song.split("////")[1]),
				"actionList": getPage(page)
				})) 
			})
		  );
		  for(let i = 0; i < themedPlaylists.length; i++) {
			party.categories.splice(3 + i, 0, themedPlaylists[i])
		  }
		  // -


		  // - Search feature
		  categories.splice(3, 0, basicFunc.getLocalSetting("search"))
		  if (req.body && req.body.searchString && req.body.searchString.length > 0) {
			basicFunc.debugLog(`[CAROUSEL - ${page}] ${res.profileData.nameOnPlatform} searched ${req.body.searchString}`)
			// Add search result category.
			party.categories.splice(4, 0, {
				"__class": "Category",
				"title": "[icon:SEARCH_RESULT] " + req.body.searchString.trim(),
				"items": [],
				"isc": "grp_row",
				"act": "ui_carousel"
			});
			// Find given search string by looping through songlist.
			mapsSorted.filter(songs => songs.toLowerCase().includes(req.body.searchString.trim().toLowerCase())).sort().forEach(mapName => {
				// If title or artist includes the search string, push it to the created search button.
				categories[4].items.push({
				"__class": "Item",
				"isc": "grp_cover",
				"act": "ui_component_base",
				"components": getComponent("JD_CarouselContentComponent_Song", mapName.split("////")[1]),
				"actionList": getPage(page)
				})
			})
		  }
		  // -


		  // - Shuffle
		  // This is for shuffle function. 
		  // JD2016 does not have shuffle function, push this for only non-JD16 skuIds.
		  if (!req.header("x-skuid").includes("jd2016")) {
			categories.forEach(category => {
				// If category got noShuffle tag, push shuffle.
				if (!category.noShuffle && category.items.length > 0) {
					category.items.push({
						"__class": "Item",
						"isc": "grp_shuffle",
						"act": "ui_component_base",
						"components": getComponent("JD_CarouselContentComponent_Shuffle"),
						"endPos": 3,
						"actionList": "NonStop"
					})
				}
			})
		  }
		  // -


		  // - News Page
		  // This is for adding our custom newsPage to the songDB to show it in game.
		  party.categories[0].items.unshift({
			"__class": "Item",
			"isc": "grp_cover",
			"act": "ui_component_base",
			"components": [{
				"__class": "JD_CarouselContentComponent_Song",
				"mapName": basicFunc.getSetting("newspage").mapName
			}],
				"actionList": basicFunc.getSetting("newspage").actionType
		  })
		  // -

	  
				  
		  // - Favorites
		  // This reads user's profile JSON and creates favorites category.
		  const userProfile = await Profile.findOne({ $or: [{ profileId: res.profileData.pid }, { userId: res.profileData.uid }] })
		
		  // If profile, favorites exists and favorites length is greater than 0
		  if (userProfile && userProfile["favorites"] && userProfile["favorites"].length > 0) {
			basicFunc.debugLog(`[CAROUSEL - ${page}] ${res.profileData.nameOnPlatform} favorites are: ${userProfile["favorites"]}`)
			// Push favorites Category
			categories.push(basicFunc.getLocalSetting("favorites"))
			userProfile["favorites"].forEach(favoriteMapName => {
				// Loop over all maps and push at the last category of categories.
				categories[categories.length - 1].items.push({
				__class: "Item",
				isc: "grp_cover",
				act: "ui_component_base",
				components: getComponent("JD_CarouselContentComponent_Song", favoriteMapName),
				actionList: getPage(page)
				})
			})
		  }
		  // -



		  // FINAL CONFIGS
		  // This process below will set localisation titles, remove filtering and some other tags.
		  party.categories = categories.map(category => {
			
			// Deleting developer keys/values
			delete category.noShuffle && delete category.filter

			// Set language titles only if the title is a object.
			return {
				...category,
				// Set title's localisation if "en" (default language exists.)
				title: category.title[basicFunc.getJdcs().serverLanguage] ? category.title[lang] || category.title[basicFunc.getJdcs().serverLanguage] : category.title
			}
		  })

		  // Send final carousel.
		  res.send(party);
		  break;

		// upsell-videos
		case "upsell-videos":
			const upsell = JSON.parse(fs.readFileSync("./local_settings/pages/upsell-videos.json"))
			basicFunc.getJdcsConfig().arrays.recommendedSongs.forEach(song => {
			  upsell.categories[2].items.push({
				"__class": "Item",
				"isc": "grp_cover",
				"act": "ui_component_base",
				"components": [{
						"__class": "JD_CarouselContentComponent_Song",
						"mapName": song
					}, {
						"__class": "JD_CarouselContentComponent_Metadata",
						"recommendationSource": "4"
					}
				],
				"actionList": "_None"
				});
			})
			return res.send(upsell)

		}
	}
})

carousel.post("/v2/packages", (req, res) => {
  res.send({
    __class: "PackageIds",
    packageIds: []
  })
})

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
carousel.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = carousel
