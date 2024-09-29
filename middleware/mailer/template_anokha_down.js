const TEMPLATE_ANOKHA_DOWN = (data) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <title>ANOKHA 2024</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Reset styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
        }


        body {
            margin: 0;
            padding: 0;
        }

        /* Custom styles */
        .container {
            max-width: 600px;

            padding: 20px;
        }

        .logo {
            width: auto;
            height: 80px;
        }

        h1 {
            font-weight: bold;
            color: #374151;
            margin-top: 20px;
        }

        .verification-text {
            margin-top: 10px;
            color: #4B5563;
            padding-bottom: 10px;
        }

        .verification-code {
            display: flex;
            justify-content: center;
            margin-top: 10px;
        }

        .verification-code p {
            width: 40px;
            height: 40px;
            text-align: center;
            line-height: 40px;
            font-size: 20px;
            font-weight: bold;
            color: #3B82F6;
            border: 1.5px solid #3B82F6;
            border-radius: 5px;
            margin-right: 10px; /* Add space between each digit */
            margin-bottom: 10px;
        }

        .expiration-text {
            margin-top: 10px;
            color: #4B5563;
            line-height: 1.5;
        }

        .regards-text {
            margin-top: 20px;
            color: #4B5563;
            line-height: 1.5;
        }

        .contact-text {
            margin-top: 20px;
            color: #6B7280;
            line-height: 1.5;
        }

        .contact-link {
            color: #3B82F6;
            text-decoration: none;
        }

        .contact-link:hover {
            text-decoration: underline;
        }

        /* Responsive adjustments */
        @media only screen and (max-width: 600px) {
            .container {
                padding: 10px;
            }
            .logo {
                height: 60px;
            }
            .verification-code p {
                font-size: 16px;
                width: 30px;
                height: 30px;
                line-height: 30px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <img class="logo" src="https://i.imgur.com/oYCbxvw.png" alt="">
        </header>
    
        <main>
            <h1>Hi Ashwin, Abhinav,</h1> <br>


            <h3> It's 500 - Internal Server Error</h3>
            <p class="verification-text">Anokha DOWN!</p>

            <p class="verification-text">${data}</p>

            <p class="regards-text">
                Regards, <br>
                Anokha Pinger <br>
                Anokha 2024 <br>
                Amrita Vishwa Vidyapeetham <br>
                Coimbatore
            </p>
        </main>
    
        <footer>
            <p class="contact-text">If you have any questions or require assistance, please feel free to reach out to our team at <a href="mailto:anokhapr@cb.amrita.edu" class="contact-link">anokhapr@cb.amrita.edu</a>.</p>
        </footer>
    </div>
</body>
</html>
`;
}

module.exports = TEMPLATE_ANOKHA_DOWN;