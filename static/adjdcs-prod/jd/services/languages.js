"use strict";

angular.module("jd.services.languages", [])

    .service("Languages", function() {
        this.data = {
            "CN": "Chinese",
            "DA": "Danish",
            "DE": "German",
            "EN": "English",
            "ES": "Spanish",
            "FI": "Finnish",
            "FR": "French",
            "IT": "Italian",
            "JP": "Japanese",
            "KO": "Korean",
            "NO": "Norwegian",
            "NL": "Dutch",
            "PT-BR": "Brazilian Portuguese",
            "SV": "Swedish",
        };
    })