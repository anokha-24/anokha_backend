const TEMPLATE_STUDENT_REGISTERED = (userName,otp) => {
    return `<!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Anokha 2024</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
        </style>
    </head>

    <body>
        <p>Dear ${userName},</p>
        <br />
        <p>Thank you for registering for Anokha 2024. Please use the following OTP to verify your account.</p>
        <br />
        <h1>${otp}</h1>
        <br />
        <p>Regards,<br>Team WMD<br>Anokha 2024<br>Amrita Vishwa Vidyapeetham<br>Coimbatore</p>
    </body>

    </html>`;
}

module.exports = TEMPLATE_STUDENT_REGISTERED;