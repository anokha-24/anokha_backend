const TEMPLATE_WELCOME_MAIL = (userName) => {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Anokha 2024</title>
<style>

  *{
      font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
  }
  body {
    padding: 0;
    width: 100% !important;
    -webkit-text-size-adjust: 100%;
    margin: 0;
    -ms-text-size-adjust: 100%;
  }

  .location{
    text-decoration: none;
    color: #3d454d;
  }

  .location:hover{
    color: #848688;
  }

  .location:active{
    text-decoration: none;
    color: #3d454d;
  }

  .container {
    padding: 0;
    width: 100% !important;
    background: #FFFFFF;
    border-radius: 4px;
    border: 1px #F7F8F8 solid;
    max-width: 100%;
    margin: auto;
    -webkit-border-radius: 4px;
    background-color: #FFFFFF;
    -moz-border-radius: 4px;
  }
  .header-img img {
    max-width: 100%;
    height: auto;
  }
  .content {
    color: #3d454d;
    font-size: 16px;
    font-family: Verdana, Geneva, sans-serif;
    line-height: 24px;
    padding: 20px;
    /* Adjusted width for large screens */
    width: 33.33%; 
  }
  .content h2 {
    font-size: 24px;
    line-height: 36px;
    margin-top: 0;
  }
  .content p {
    margin-top: 0;
  }
  .feature-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  .feature-item img {
    width: 48px;
    height: 48px;
    margin-right: 24px;
  }
  .feature-item p {
    font-weight: bold;
  }
  .contact-link {
    color: #007ee5;
    text-decoration: none;
  }
  .contact-link:hover {
    text-decoration: underline;
  }
  /* Media Query for Responsive Layout */
  @media screen and (max-width: 600px) {
    .content {
      padding: 10px;
      /* Adjusted width for small screens */
      width: 100%; 
    }
    .feature-item img {
      width: 32px;
      margin-right: 10px;
    }
    .feature-item p {
      font-size: 14px;
      line-height: 20px;
    }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header-img">
    <img width="240" alt="" src="https://i.imgur.com/oYCbxvw.png">
  </div>
  <div class="content">
    <h2>Dear ${userName} ,</h2>
    <p>We are delighted to welcome you to Anokha 2024, the annual technical extravaganza at Amrita Vishwa Vidyapeetham,
       Coimbatore! Get ready to embark on a thrilling journey of innovation, learning, and creativity.</p>

    <div class="feature-item">
      <img src="https://i.pinimg.com/736x/f6/3c/ea/f63cea7ca3521d0a2b8adbe4f3e10aa5.jpg" alt="">
      <p><b>Date:</b><br>17 October 2024 to 19 October 2024</p>
    </div>

    <div class="feature-item">
      <img src="https://media.istockphoto.com/id/1193451471/vector/map-pin-vector-glyph-icon.jpg?s=612x612&w=0&k=20&c=wuWVeHuthNAXzjOO5_VY9SUOd-6cxwpVH8VVfh6Y7Lc=" alt="">
      <a class="location" target="_blank" href = "https://www.google.com/maps/dir/10.9111928,76.9059512/amrita+vishwa+vidyapeetham/@10.9059161,76.8926599,15.31z/data=!4m9!4m8!1m1!4e1!1m5!1m1!1s0x3ba85c95d3e828eb:0x2785cb4510629029!2m2!1d76.9006279!2d10.9026791?entry=ttu">
        <p><b>Location:</b><br>Amrita Vishwa Vidyapeetham, Coimbatore</p>
      </a>
    </div>

    <p>We're looking forward to meeting you at Amrita Vishwa Vidyapeetham and witnessing the incredible 
      innovations you'll bring to the table. See you soon at Anokha 2024!</p>
    <p>Warm Regards,<br>WMD Team<br>Anokha 2024<br>Amrita Vishwa Vidyapeetham<br>Coimbatore Campus</p>

    <p>If you have any questions or require assistance, please feel free to reach out to our team at 
      <a href="mailto:anokhapr@cb.amrita.edu" class="contact-link">anokhapr@cb.amrita.edu</a>.</p>
  </div>
  
</div>
</body>
</html>`
}

module.exports = TEMPLATE_WELCOME_MAIL;