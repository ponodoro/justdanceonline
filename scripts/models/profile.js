const mongoose = require("mongoose");
const uuid = require('uuid');

const profileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        default: "Player"
    },
    avatar: {
        type: Number,
        required: true
    },
    country: {
        type: Number,
        required: true
    },
    skin: {
        type: Number,
        default: 0
    },
    jdPoints: {
        type: Number,
        default: 0
    },
    diamondPoints: {
        type: Number,
        default: 0
    },
    progression: {
        CONTEXT_ADVENTURE_2017: {
            type: Number
        },
        CONTEXT_DANCE_MACHINE_2017: {
            type: Number
        },
        CONTEXT_FAMILY_2017: {
            type: Number
        },
        CONTEXT_JDTV_2017: {
            type: Number
        },
        CONTEXT_ONLINE_2017: {
            type: Number
        },
        CONTEXT_SWEAT_2017: {
            type: Number
        },
        CONTEXT_UPLAY_2017: {
            type: Number
        },
        CONTEXT_WDF_2017: {
            type: Number
        }
    },
    history: { 
        type: mongoose.Schema.Types.Mixed, 
        default: {} 
    },
    favorites: {
        type: Array
    },
    unlockedAvatars: {
        type: Array,
        default: 0
    },
    unlockedSkins: {
        type: Array,
        default: 0
    },
    wdfRank: {
        type: Number,
        default: 0,
        required: true
    },
    stars: {
        type: Number,
        default: 0,
        required: true
    },
    unlocks: {
        type: Number,
        default: 0,
        required: true
    },
    songsPlayed: {
        type: Number,
        default: 0,
        required: true
    },
    platformId: {
        type: String,
        default: ""
    },
    scores: { 
        type: mongoose.Schema.Types.Mixed, 
        default: {} 
    },
    profileId: {
        type: String,
        default: uuid.v4(),
        unique: true
    },
    userId: {
        type: String,
        default: uuid.v4(),
        unique: true
    }
}, {
    minimize: false,
    versionKey: false
})
module.exports = mongoose.model("Profile", profileSchema)