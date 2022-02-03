const mongoose = require("mongoose");
const uuid = require('uuid');
const fs = require("fs");

// -- Settings
let wdfConfig = JSON.parse(fs.readFileSync("./settings/wdf/wdf_config.json"))

    const wdfSchema = new mongoose.Schema({
        name: {
          type: String,
          required:true
        },
        avatar: {
          type: Number,
          required:true
        },
        country: {
          type: Number,
          required:true
        },
        skin: {
          type: Number,
          required:true
        },
        platform: {
          type: String,
          required:true
        },
        portraitBorder: {
          type: Number,
          required:true
        },
        jdPoints: {
          type: Number,
          required:true
        },
        tournamentBadge: {
          type: Boolean,
          default: false
        },
        isSubscribed: {
          type: Boolean,
          default: false
        },
        nameSuffix: {
          type: Number
        },
        __class: {
          type: String,
          default: "RecapEntry"
        },
        pid: {
          type: String,
          required:true
        },
        score: {
          type: Number,
          required:true
        }
      }, {
    minimize: false,
    versionKey: false
})
module.exports = mongoose.model("WDF", wdfSchema)
