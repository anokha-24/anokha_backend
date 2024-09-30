const cron = require('node-cron');
const mailer = require('../middleware/mailer/mailer');
const appConfig = require('../config/appConfig');
const fs = require('fs');

const statusChecker = () => {
	console.log("[MESSAGE]: Anokha Pinger Reporting.");
	fs.appendFileSync('./logs/statusChecker.log', `${new Date().toLocaleString()} - statusChecker - [MESSAGE]: Anokha Pinger Reporting.\n`);

	// Check status of Anokha every 2 minutes.
	cron.schedule('*/2 * * * *', async () => {
		const time = new Date();

		console.log(`[MESSAGE]: Pinging Anokha at ${time.toLocaleString()}.`);
		fs.appendFileSync('./logs/statusChecker.log', `${time.toLocaleString()} - statusChecker - [MESSAGE]: Pinging Anokha at ${time.toLocaleString()}.\n`);

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
                        studentEmail: appConfig.statusChecker.testAccount.studentEmail,
                        studentPassword: appConfig.statusChecker.testAccount.studentPassword,
                    }),
                }
			);

			if (response.status == 200) {
				console.log("[MESSAGE]: login is UP.");
				fs.appendFileSync('./logs/statusChecker.log', `${time.toLocaleString()} - statusChecker - [MESSAGE]: login is UP.\n`);
			} else {
				console.log("[ERROR]: login is not working!");
				fs.appendFileSync('./logs/statusChecker.log', `${time.toLocaleString()} - statusChecker - [ERROR]: login is not working.\n`);
				notWorking.push("/api/auth/loginStudent");
			}
			
			// GET events endpoint test as this is a high-traffic endpoint.
			response = await fetch(
				"https://anokha.amrita.edu/api/user/getAllEvents", {
                    method: "GET",
                }
			);

			if (response.status == 200) {
				console.log("[MESSAGE]: getAllEvents is UP.");
				fs.appendFileSync('./logs/statusChecker.log', `${time.toLocaleString()} - statusChecker - [MESSAGE]: getAllEvents is UP.\n`);
			} else {
				console.log("[ERROR]: getAllEvents is not working!");
				fs.appendFileSync('./logs/statusChecker.log', `${time.toLocaleString()} - statusChecker - [ERROR]: getAllEvents is not working.\n`);
				notWorking.push("/api/user/getAllEvents");
			}
		} catch (err) {
			console.log("[ERROR]: Start.");
			console.log(err);
			console.log("[ERROR]: End.");
			fs.appendFileSync('./logs/statusChecker.log', `${time.toLocaleString()} - statusChecker - [ERROR]: ${err}\n`);
			notWorking.push("Error: " + err);
			return;
		}
		
		// Send Email if Anokha is down.
		if (notWorking.length > 0) {
			console.log("[ERROR]: Anokha is down. Sending mail to Anokha Dev.");
			fs.appendFileSync('./logs/statusChecker.log', `${time.toLocaleString()} - statusChecker - [ERROR]: Anokha is down. Sending mail to Anokha Dev.\n`);
			mailer.anokhaDown("cb.en.u4cse21001@cb.students.amrita.edu", "cb.en.u4cse21008@cb.students.amrita.edu", notWorking.join("<br/>"));
		}
	});

}


statusChecker();