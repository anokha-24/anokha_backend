const paseto = require('paseto');
const { V4: { verify } } = paseto;
const fs = require('fs');
const secret_key = "E$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3424343244243o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHABFHADBFE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBAE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)356536432424341#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHABFHADBFSSFBAE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHABFHADBFE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHABFHADBFSFHAFAHFBHABFHADE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHA"

async function otpTokenValidator(req, res, next) {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader && tokenHeader.split(' ')[1];

    if (tokenHeader == null || token == null) {
        res.status(401).send({
            "ERROR": "No Token. Warning."
        });
        return;
    }

    const public_key = fs.readFileSync('middleware/RSA/private_key.pem');
    try {
        const payLoad = await verify(token, public_key);
        if (payLoad["secret_key"] == secret_key) {
                req.body.studentFullName = payLoad["studentFullName"];
                req.body.studentEmail = payLoad["studentEmail"];
                req.body.studentPhone = payLoad["studentPhone"];
                req.body.studentPassword = payLoad["studentPassword"];
                req.body.needPassport = payLoad["needPassport"];
                req.body.studentAccountStatus = payLoad["studentAccountStatus"];
                req.body.studentCollegeName = payLoad["studentCollegeName"];
                req.body.studentCollegeCity = payLoad["studentCollegeCity"];
                req.body.isInCampus = payLoad["isInCampus"];
            next();
            return;
        } else {
            //console.log(payLoad["secret_key"]);
            res.status(401).send({
                "ERROR": "Unauthorized access. Warning."
            });
            return;
        }
    } catch (err) {
            //console.log(err);
            res.status(401).send({
                "ERROR": "Unauthorized access. Warning."
            });
        return;
    }
}


// async function resetPasswordValidator(req, res, next) {
//     const tokenHeader = req.headers.authorization;
//     const token = tokenHeader && tokenHeader.split(' ')[1];

//     if (tokenHeader == null || token == null) {
//         res.status(401).send({
//             "ERROR": "No Token. Warning."
//         });
//         return;
//     }

//     const public_key = fs.readFileSync('../../RSA/public_key.pem');
//     try {
//         const payLoad = await verify(token, public_key);
//         if (payLoad["secret_key"] == secret_key) {
//             req.authorization_tier = payLoad["userRole"];
//             req.body.userEmail = payLoad["userEmail"];
//             next();
//             return;
//         } else {
//             res.status(401).send({
//                 "ERROR": "Unauthorized access. Warning."
//             });
//             return;
//         }
//     } catch (err) {
//         res.status(401).send({
//             "ERROR": "Unauthorized access. Warning."
//         });
//         return;
//     }

// }

module.exports = [otpTokenValidator];


