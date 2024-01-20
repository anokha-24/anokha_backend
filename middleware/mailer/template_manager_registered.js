const TEMPLATE_MANAGER_REGISTERED = (userName, password) => {
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
        <p>You have been granted Access to the Anokha24 Admin app. Your password Is:</p>
        <br />
        <h1>${password}</h1>
        <br />
        <p>You can change your password by clicking on the forgot password option in the Admin App.</p>
        <br />
        <p>Regards,<br>Team WMD<br>Anokha 2024<br>Amrita Vishwa Vidyapeetham<br>Coimbatore</p>
    </body>

    </html>`;
}

module.exports = TEMPLATE_MANAGER_REGISTERED;