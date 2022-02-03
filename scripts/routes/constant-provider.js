// CONSTANT-PROVIDER
// Configuration for such settings in-game.

require('dotenv').config();

// -- Modules

    // Global
    let axios = require("axios");
    let constant = require("express").Router()

    // Local
    let basicFunc = require("../modules/basicFunc")

// --


// -- SKU-CONSTANTS 
// Game configurations.
constant.get("/v1/sku-constants", (req, res) => {
    res.send({
        "ChallengeMatch": {
            "CreateChallenge": {
                "wait_after_share": 5
            }
        },
        "Friends": {
            "FriendListService": {
                "refresh_interval": 120
            },
            "FriendsPresence": {
                "max_msg": 6,
                "refresh_time": 121
            },
            "FriendsUGC": {
                "max_msg": 5,
                "refresh_time": 120
            }
        },
        "Home": {
            "Fetch": {
                "during_session_tiles_count": 1,
                "new_session_tiles_count": 3,
                "played_maps_count": 2
            }
        },
        "Http": {
            "FileStreaming": {
                "slow_bit_rate_in_bps": 512000
            }
        },
        "JDVersion": {
            "Override": basicFunc.getJdcsConfig()["config"]["JDVersion"]
        },
        "Quest": {
            "minimumScore": {
                "value": 1000
            },
            "questOverride": {
                "value": []
            },
            "sessionCountUntilDiscoveryKill": {
                "value": 4
            },
            "sessionCountUntilFirstDiscoveryKill": {
                "value": 2
            },
            "sessionCountUntilQuestKill": {
                "value": 10
            }
        },
        "Recommendation": {
            "Fetch": {
                "retry_interval": 120
            }
        },
        "Subscription_Service": {
            "ECTokenFetch": {
                "retry_count": 3,
                "retry_interval": 598
            },
            "ServerRefresh": {
                "refresh_interval": 600,
                "retry_interval": 60,
                "retry_interval_s2s": 600
            }
        },
        "Unlockables": {
            "AAAMap": {
                "LockAAAMap2": 1,
                "considerLocking": 1,
                "map1": "1",
                "map2": "Thumbs"
            }
        },
        "WDF": {
            "Recap": {
                "recap_retry_interval": 2
            },
            "UpdateScore": {
                "update_failure_allowance": 10,
                "update_score_interval": 5
            }
        },
        "Wall": {
            "FriendsWall": {
                "max_msg": 7,
                "refresh_time": 122
            }
        }
    })
});
// --

// -- ERROR HANDLER
// This is for handling any server error and logging it for research purposes.
constant.use(function (err, req, res, next) {
    if (err) {
        console.log(err)
        res.sendStatus(basicFunc.getStatusCode("serverError"))
        basicFunc.writeLog("error", `${new Date().toISOString()} ${req.originalUrl} ${req.header("x-skuid")} \n${err}\n\n`)
    }
})

// --

module.exports = constant