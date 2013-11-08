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

// Takes an array of users ({"id"} minimum) and loads the fields requested.
RSVP.loadUserFields = function(data, access_token, fields)
{
    var _load = function(lo, hi)
    {
        var batchJSON = [];

        for(var i = lo; i < hi; i++) {
            batchJSON.push({
                "method": "GET",
                "relative_url": data[i]["id"] + "?fields=" + fields.join()
            });
        }

        return $.post("https://graph.facebook.com/", {"access_token": access_token, "batch": JSON.stringify(batchJSON)}, 
            function (rdata) 
            {
                // Process response
                for(var j in rdata) {
                    // Should be same indices in batchJSON as data
                    if(rdata[j] && rdata[j].code == "200") {
                        var obj = JSON.parse(rdata[j].body);
                        var tobj = data[Number(lo)+Number(j)];

                        for(var f in fields) {
                            tobj[fields[f]] = obj[fields[f]];
                        }
                    }
                }
            }, 
        "json");
    }
    
    var dfds = [];

    for(var i = 0; i < data.length; i += 50) 
    {
        dfds.push(_load(i, Math.min(i+50, data.length)));
    }

    return $.when.apply($, dfds);
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