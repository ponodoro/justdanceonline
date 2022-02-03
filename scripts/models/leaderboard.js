const mongoose = require("mongoose");
const uuid = require('uuid');

const leaderboardSchema = new mongoose.Schema({
    __class: {
      type: String,
      required: true
    },
    profileId: {
      type: String,
      required: true
    },
    rank : {
      type: Number
    },
    score: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    avatar: {
      type: Number,
      required: true
    },
    country: {
      type: Number,
      required: true
    },
    platformId: {
      type: String
    },
    alias: {
      type: Number
    },
    aliasGender: {
      type: Number
    },
    jdPoints: {
      type: Number,
      required: true
    },
    portraitBorder: {
      type: Number
    },
    mapName: {
      type: String,
      required: true
    }
  }, {
    minimize: false,
    versionKey: false
})
module.exports = mongoose.model("Leaderboard", leaderboardSchema)