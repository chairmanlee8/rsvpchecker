// index.js -- scripts for index.haml
// global access_token (null for no login)

function facebook_login() {
	FB.login(function(response) 
	{
		if (response.authResponse) {
			// connected
			access_token = String(response.authResponse.accessToken);
			$("#facebook-warning").hide(350);
		} else {
			// cancelled
		}
	});
}

$("#process").click(function ()
{
	if(!access_token) return false;

	// Local variables
	var eventId = null, 
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
		$(".jumbotron .actionable").hide(250);
		$(".jumbotron .working").show(250);

		RSVP.loadEvent(eventId, access_token, rawData).done(function () {
			$.when(RSVP.loadUserGender(rawData["attending"], access_token),
				   RSVP.loadUserGender(rawData["noreply"], access_token),
				   RSVP.loadUserGender(rawData["maybe"], access_token),
				   RSVP.loadUserGender(rawData["declined"], access_token))
				.done(function () 
				{
					// Perform collation
					var retObj = RSVP.createGenderReport(rawData);

					for(var att in retObj) {
						for(var gen in retObj[att]) {
							if(gen == "total") continue;
							var perc = (retObj[att]["total"] > 0) ? (Math.round(100 * retObj[att][gen] / retObj[att]["total"])+"&#37;") : "n/a";
							$("#" + gen + "-" + att).html(retObj[att][gen] + " (" + perc + ")");
						}
					}

					$(".jumbotron .working").hide(250);
					$(".jumbotron .actionable").show(250);
					$("#results").show(250);
				});
		});
	}
	catch (e) {
		console.log(e);
		return false;
	}

	return false;
});