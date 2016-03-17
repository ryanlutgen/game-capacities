var http = require('http');

var totalSpace = 256 * 1024 * 1024;
var appids = [365590, 440, 8930];
var gameInfo = [];

//key = appid, value = space required in kb
var spaceRequired = {};
var numberProcessed = 0;

//the steam API has no way of retrieving hardware requirements from what I can tell, so here is a hack to extract it
//from the store page.
for (var index = 0; index < appids.length; index++) {
    (function(i) {
        var appid = appids[i];
        http.get('http://store.steampowered.com/api/appdetails?appids=' + appid, function (response) {
            var responseStr = "";
            response.on('data', function (chunk) {
                responseStr += chunk;
            });

            response.on('end', function () {
                numberProcessed++;
                gameInfo.push(JSON.parse(responseStr)[appid].data);
                if (numberProcessed === appids.length) {
                    parseResponse(gameInfo);
                }
            });
        }).on('error', function (e) {
            console.log('Got error: ' + e.message);
        });
    })(index);
}

function parseResponse(games) {
    for (var i = 0; i < games.length; i++) {
        var response = games[i];
        var recommended = response.pc_requirements.recommended;
        //steam has two conventions for listing free HDD space required, so try matching the more recent convention first
        //then fall back to the other that's been used
        var space = recommended.match(/(\d)+\s(GB|MB)\s(available\sspace)/gi);
        var gb = /(gb)/gi.test(recommended);
        if (space) {
            getNumberReq(space.toString(), response.steam_appid, gb);
        }
        else {
            space = recommended.match(/(\d)+\s(GB|MB)\s(free)/gi);
            if (space) {
                getNumberReq(space.toString(), response.steam_appid, gb);
            }
        }

    }
}

function getNumberReq(reqString, appid, gb) {
    var numberReq = reqString.match(/(\d)+/g).toString() * 1024;
    spaceRequired[appid] = (gb ? numberReq * 1024 : numberReq);
}