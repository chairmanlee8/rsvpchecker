// index.js -- scripts for index.haml

// global access_token (null for no login)
var rawData = {};

function facebook_login() {
	FB.login(function(response) {
		if (response.authResponse) {
			// connected
			access_token = String(response.authResponse.accessToken);
			$("#facebook-warning").hide(350);
		} else {
			// cancelled
		}
	});
}

$("#results-nav button").click(function ()
{
	$("#results-nav button").removeClass("active");
	$(this).addClass("active");
	$(".results").slideUp(250);
	$("#results-" + $(this).data("link")).slideDown(250);
});

$("#process").click(function ()
{
	if(!access_token) return false;

	// Local variables
	var eventId = null;

	// Global variables
	rawData = {};

	// Get the event ID
	try {
		eventId = /\d+/.exec($("input[name=eventLink]").val())[0];
	}
	catch (e) {
		alert(e);
		return false;
	}

	// Now load data
	try {
		$("#results").hide(250);
		$("#results-nav").fadeOut(250);
		$(".jumbotron .actionable").hide(250);
		$(".jumbotron .working").show(250);

		var fields = ["gender", "picture"];

		RSVP.loadEvent(eventId, access_token, rawData).done(function () {
			$.when(RSVP.loadUserFields(rawData["attending"], access_token, fields),
				   RSVP.loadUserFields(rawData["noreply"], access_token, fields),
				   RSVP.loadUserFields(rawData["maybe"], access_token, fields),
				   RSVP.loadUserFields(rawData["declined"], access_token, fields))
				.done(function () 
				{
					// Perform collation
					var retObj = RSVP.createGenderReport(rawData);

					for(var att in retObj) {
						for(var gen in retObj[att]) {
							if(gen == "total") continue;
							var perc = (retObj[att]["total"] > 0) ? (Math.round(100 * retObj[att][gen] / retObj[att]["total"])+"&#37;") : "n/a";
							$("#" + gen + "-" + att).html("<b>" + retObj[att][gen] + "</b> (" + perc + ")");
						}
					}

					$(".jumbotron .working").hide(250);
					$(".jumbotron .actionable").show(250);
					$("#results-nav").fadeIn(250);
					$($("#results-nav button").get(0)).click();
				});
		});
	}
	catch (e) {
		console.log(e);
		return false;
	}

	return false;
});

// Filter attendees
var filterAttendees = (function () {
	var delayTimer = null;
	return function () {
		if(delayTimer) clearTimeout(delayTimer);

		delayTimer = setTimeout(function () {
			var filterString = $("#guestlist-filter").val().toLowerCase();
			var filterResults = [];

			if(!rawData.hasOwnProperty("attending")) return;

			$.each(rawData["attending"], function (idx, obj) {
				if(obj && obj.hasOwnProperty("name")) {
					if(obj["name"].toLowerCase().indexOf(filterString) > -1) {
						filterResults.push(idx);
					}
				}
			});

			// Add to guestlist
			$("#guest-container").html('');
			for(var i = 0; i < Math.min(filterResults.length, 10); i++)
			{
				var obj = rawData["attending"][filterResults[i]];
				var elem = $("<div>")
					.addClass("panel")
					.append($("<img>").attr("src", obj["picture"]["data"]["url"]))
					.append($("<div>").html(obj["name"]));

				$("#guest-container").append(elem);
			}
		}, 500);
	}
})();

$("#guestlist-filter").keyup(filterAttendees);