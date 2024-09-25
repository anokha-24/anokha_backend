const cron = require('node-cron');

const pingAnokha = () => {
	console.log("[MESSAGE]: Anokha Pinger Reporting.");

	cron.schedule('*/10 * * * * *', async () => {


		try {

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

            console.log(response);


			if (response.status == 200) {
				console.log("[MESSAGE]: login is UP");
			} else {
				console.log("[ERROR]: login is not working");
			}


			response = await fetch(
				"https://anokha.amrita.edu/api/user/getAllEvents", {
                    method: "GET",
                }
			);

			if (response.status == 200) {
				console.log("[MESSAGE]: getAllEvents is UP");
			} else {
				console.log("[ERROR]: getAllEvents is not working");
			}

		} catch (err) {
			console.log("[ERROR]: Start");
			console.log(err);
			console.log("[ERROR]: End");
			return;

		}


	});

}


pingAnokha();