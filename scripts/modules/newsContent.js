'use strict';

exports.getNewsMap = function (newsPageData, lang) {
    let newsMap = {
        "artist": newsPageData.artist_translation.lang ? newsPageData.artist_translation.lang : newsPageData.artist,
        "assets": newsPageData.newsAssets,
        "audioPreviewData": `{\"__class\":\"MusicTrackData\",\"structure\":{\"__class\":\"MusicTrackStructure\",\"markers\":[0,29387,58775,88163,117551,146938,176326,205714,235102,264489,293877,323265,352653,382040,411428,440816,470204,499591,528979,558367,587755,617142,646530,675918,705306,734693,764081,793469,822857,852244,881632,911020,940408,969795,999183,1028571,1057959,1087346,1116734,1146122,1175510,1204897,1234285,1263673,1293061,1322449,1351836,1381224,1410612],\"signatures\":[{\"__class\":\"MusicSignature\",\"marker\":0,\"beats\":4}],\"startBeat\":-2,\"endBeat\":300,\"fadeStartBeat\":0,\"useFadeStartBeat\":false,\"fadeEndBeat\":0,\"useFadeEndBeat\":false,\"videoStartTime\":0,\"previewEntry\":0,\"previewLoopStart\":0,\"previewLoopEnd\":48,\"volume\":0,\"fadeInDuration\":0,\"fadeInType\":0,\"fadeOutDuration\":0,\"fadeOutType\":0},\"path\":\"\",\"url\":\"jmcs://jd-contents/${newsPageData.mapName}/${newsPageData.mapName}_AudioPreview.ogg\"}`,
        "coachCount": 1,
        "credits": newsPageData.credits_translation.lang ? newsPageData.credits_translation.lang : newsPageData.credits,
        "difficulty": 1,
        "doubleScoringType": -1,
        "jdmAttributes": [],
        "lyricsColor": "FF0000FF",
        "lyricsType": 0,
        "mainCoach": -1,
        "mapLength": 200,
        "mapName": newsPageData.mapName,
        "mapPreviewMpd": "",
        "mode": 1,
        "originalJDVersion": 2010,
        "packages": {
            "mapContent": `${newsPageData.mapName}_newsContent`
        },
        "parentMapName": newsPageData.mapName,
        "skuIds": [],
        "songColors": newsPageData.newsColors,
        "status": 1,
        "sweatDifficulty": 1,
        "tags": ["Main"],
        "title": newsPageData.title_translation.lang ? newsPageData.title_translation.lang : newsPageData.title,
        "urls": {
            [`jmcs://jd-contents/${newsPageData.mapName}/${newsPageData.mapName}_AudioPreview.ogg`]: ""
        },
        "serverChangelist": 1
  }    
  return newsMap
}