const cron = require('node-cron');
const mailer = require('../middleware/mailer/mailer');

const statusChecker = () => {
	console.log("[MESSAGE]: Anokha Pinger Reporting.");

	// Check status of Anokha every 2 minutes.
	cron.schedule('*/2 * * * *', async () => {
		console.log(`[MESSAGE]: Pinging Anokha at ${new Date().toLocaleString()}.`);
		var notWorking = [];
		try {
			// POST endpoint test.
			let response = await fetch(
				"https://anokha.amrita.edu/api/auth/loginStudent", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        studentEmail: "cb.en.u4cse21008@cb.students.amrita.edu",
                        studentPassword: "6f28f4faf56bb704ae154fc2d2b2ba0d72f8a9ea06c3b8a3ed0be6836da9e258"
                    }),
                }
			);

			if (response.status == 200) {
				console.log("[MESSAGE]: login is UP");
			} else {
				console.log("[ERROR]: login is not working");
				notWorking.push("/api/auth/loginStudent");
			}
			
			// GET events endpoint test as this is a high-traffic endpoint.
			response = await fetch(
				"https://anokha.amrita.edu/api/user/getAllEvents", {
                    method: "GET",
                }
			);

			if (response.status == 200) {
				console.log("[MESSAGE]: getAllEvents is UP");
			} else {
				console.log("[ERROR]: getAllEvents is not working");
				notWorking.push("/api/user/getAllEvents");
			}
		} catch (err) {
			console.log("[ERROR]: Start");
			console.log(err);
			console.log("[ERROR]: End");
			notWorking.push("Error: " + err);
			return;
		}
		
		// Send Email if Anokha is down.
		if (notWorking.length > 0) {
			console.log("[ERROR]: Anokha is down. Sending mail to Anokha Dev.");
			mailer.anokhaDown("cb.en.u4cse21001@cb.students.amrita.edu", "cb.en.u4cse21008@cb.students.amrita.edu", notWorking.join("<br/>"));
		}
	});

}


statusChecker();