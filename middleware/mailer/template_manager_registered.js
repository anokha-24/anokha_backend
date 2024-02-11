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
    
            body {
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                padding: 0;
                width: 100% !important;
                -webkit-text-size-adjust: 100%;
                margin: 0;
                -ms-text-size-adjust: 100%;
            }
    
            .container {
                padding: 20px;
                width: 100% !important;
                background: #FFFFFF;
                border-radius: 4px;
                border: 1px #F7F8F8 solid;
                max-width: 600px;
                background-color: #FFFFFF;
                -moz-border-radius: 4px;
            }
    
            .header-img img {
                max-width: 100%;
                height: auto;
                width: 50%; 
            }
    
            .content {
                color: #3d454d;
                font-size: 18px;
                line-height: 28px;
                padding: 20px;
                width: 100%;
            }
    
            .content h1 {
                font-size: 28px;
                line-height: 36px;
                margin-top: 10px;
                font-weight: bold;
            }
    
            .content p {
                margin-top: 10px;
                font-size: 18px;
            }
    
            .password-container {
                display: flex; 
                align-items: center; 
                text-align: center;
                padding: 10px;
            }
    
            .password {
                font-size: 24px;
                font-weight: bold;
                margin-left: 10px; 
            }
    
            .contact-link {
                color: #007ee5;
                text-decoration: none;
            }
    
            .contact-link:hover {
                text-decoration: underline;
            }
    
     
            @media screen and (max-width: 600px) {
                .container {
                    padding: 10px;
                }
                .header-img img {
                    width: 100%; 
                }
            }
        </style>
    </head>
    
    <body>
        <div class="container">
            <div class="header-img">
                <img alt="" src="https://i.imgur.com/oYCbxvw.png">
            </div>
            <div class="content">
                <h1> Dear ${userName},</h1>
                <p>You have been granted access to the Anokha24 Admin app. Your password is:</p>
    
                <div class="password-container">
                    <img src="https://static.vecteezy.com/system/resources/previews/026/130/079/original/key-icon-in-flat-style-access-login-illustration-on-white-isolated-background-password-key-business-concept-vector.jpg" alt="" style="width: 12%;">
                    <div class="password">${password}</div>
                </div>
    
                <p>You can change your password by clicking on the "Forgot Password" option in the Admin App.</p>
                <p>Regards,<br>Team WMD<br>Anokha 2024<br>Amrita Vishwa Vidyapeetham<br>Coimbatore</p>
            </div>
        </div>
    </body>
    
    </html>
    `;
}

module.exports = TEMPLATE_MANAGER_REGISTERED;