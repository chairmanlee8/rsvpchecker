// Main app.js file. Guaranteed to be at the head of the app.js file.
// Defines the RSVP module.

var RSVP = {};

// loadEvent : this function loads all the participants in an event and returns a JSON object with that data
// return value JSON:
// {
//      "attending": [obj],
//      "noreply": [obj],
//      "maybe": [obj],
//      "declined": [obj]
// }
RSVP.loadEvent = function(eventId, access_token, outData)
{
    var dAtt = $.Deferred(),
        dNor = $.Deferred(),
        dMay = $.Deferred(),
        dDec = $.Deferred(),
        dAll = $.Deferred(),
        baseUri = "https://graph.facebook.com/" + eventId + "/",
        baseTail = "?access_token=" + access_token;

    outData["attending"] = [];
    outData["noreply"] = [];
    outData["maybe"] = [];
    outData["declined"] = [];

    function _load(uriBase, uriTail, inData, dfd) 
    {
        $.get(uriBase + uriTail, function(response)
        {
            if(response.data.length > 0) {
                inData.push.apply(inData, response.data);
                _load(uriBase, baseTail + "&after=" + response.paging.cursors.after, inData, dfd);
            } else {
                dfd.resolve();
            }
        }, "json");

        return dfd;
    }

    return $.when(_load(baseUri + "attending", baseTail, outData["attending"], dAtt),
                  _load(baseUri + "noreply", baseTail, outData["noreply"], dNor),
                  _load(baseUri + "maybe", baseTail, outData["maybe"], dMay),
                  _load(baseUri + "declined", baseTail, outData["declined"], dDec));
}

// Takes an array of users ({"id"} minimum) and loads their gender.
RSVP.loadUserGender = function(data, access_token)
{
    var batchJSON = [],
        dfd = $.Deferred();

    // FB Batch Request builder
    for(var i in data) {
        batchJSON.push({
            "method": "GET",
            "relative_url": data[i]["id"] + "?fields=gender"
        });
    }

    $.post("https://graph.facebook.com/", {"access_token": access_token, "batch": JSON.stringify(batchJSON)}, function (rdata) 
    {
        // Process response
        for(var i in data) {
            // Should be same indices in batchJSON as data
            if(rdata[i] && rdata[i].code == "200") {
                var obj = JSON.parse(rdata[i].body);
                data[i]["gender"] = obj["gender"];
            }
        }

        dfd.resolve();
    }, "json");

    return dfd.promise();
}

// Report function
// Takes in data["att"] = [objs]
// Returns data["att"] = {"male": count, "female": count, "other": count, "total": total}
RSVP.createGenderReport = function(data)
{
    var retObj = {};

    for(var att in data) {
        var mcount = 0,
            fcount = 0,
            ocount = 0;

        for(var i in data[att]) {
            // Tally up
            if(!data[att][i].hasOwnProperty("gender")) {
                ocount++;
            } else {
                if(data[att][i]["gender"] == "male") { mcount++; }
                else if(data[att][i]["gender"] == "female") { fcount++; }
                else { ocount++; }
            }
        }

        retObj[att] = {"male": mcount, "female": fcount, "other": ocount, "total": (mcount+fcount+ocount)};
    }

    return retObj;
}