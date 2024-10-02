const validator = require('validator');
const [anokha_db, anokha_transactions_db] = require('../../connection/poolConnection');
const fs = require('fs');

module.exports = {
    // Password should be greater than or equal to 8 characters. Cannot have hiphens or quotes.
    isValidPassword: (password) => {
        
        if (typeof (password) === 'string' && password != null && password.length > 8 && password.length <= 255) {
            return true;
        }
        return false;
    },

    // Email should be valid.
    isValidEmail: (email) => {
        if (typeof (email) === 'string' && email.length > 0 && email.length <= 255 && validator.isEmail(email)) {
            return true;
        }
        return false;
    },


    isValidOtp: (otp) => {
        if (typeof (otp) === 'string' && otp != null && otp.length > 0 && otp.length <= 255) {
            return true;
        }
        return false;
    },

    /*
    {
        "studentFullName":"<Max 255 Chars>",
        "studentEmail":"<Valid Email ID. Max 255 chars.>",
        "studentPhone":"<10 digit. numeric only. Max 255 chars.>",
        "studentPassword":"<min 8 chars. Max 255 chars. Password cannot have `-` and `'`>",
        "studentCollegeName":"<Max 255 chars.>",
        "studentCollegeCity":"<Max 255 chars.>",
    }
    */
    isValidStudentRegistration: (student) => {
        if (typeof (student.studentFullName) === 'string' && student.studentFullName.length > 0 && student.studentFullName.length <= 255 &&
            typeof (student.studentEmail) === 'string' &&
            validator.isEmail(student.studentEmail) && student.studentEmail.length > 0 && student.studentEmail.length <= 255 &&
            student.studentPhone.length === 10 && validator.isNumeric(student.studentPhone) &&
            student.studentPassword.length > 0 && student.studentPassword.length <= 255 &&
            validator.isLength(student.studentPassword, { min: 8 }) && !validator.contains(student.studentPassword, '-' || "'") &&
            student.studentCollegeName.length > 0 && student.studentCollegeName.length <= 255 &&
            student.studentCollegeCity.length > 0 && student.studentCollegeCity.length <= 255) {
            return true;
        }
        return false;
    },

    /*
        If email ends with @cb.students.amrita.edu or @cb.amrita.edu, then the user does not need passport. userAccountStatus will be set to 2.
    */
    needPassport: (email) => {
        if (email.endsWith('@cb.students.amrita.edu') || email.endsWith('@cb.amrita.edu')) {
            return false;
        }
        return true;
    },

    //sha256 consists only Hexadecimal characters.
    isValidStudentLogin: (student) => {
        if (typeof (student.studentEmail) === 'string' &&
            validator.isEmail(student.studentEmail) &&
            typeof (student.studentPassword) === 'string' &&
            student.studentPassword.length === 64 &&
            validator.isLength(student.studentPassword, { min: 8 }) && !validator.contains(student.studentPassword, '-' || "'")) {
            return true;
        }
        return false;
    },

    isValidAdminRegistration: (manager) => {
        if (typeof (manager.managerFullName) === 'string' &&
            manager.managerFullName.length > 0 && manager.managerFullName.length <= 255 &&
            typeof (manager.managerEmail) === 'string' &&
            validator.isEmail(manager.managerEmail) && manager.managerEmail.length > 0 && manager.managerEmail.length <= 255 &&
            typeof (manager.managerPhone) === 'string' &&
            manager.managerPhone.length === 10 && validator.isNumeric(manager.managerPhone) &&
            manager.managerRoleId != 1 &&
            manager.managerRoleId != null && manager.managerRoleId != undefined && !isNaN(manager.managerRoleId) &&
            manager.managerDepartmentId != null && manager.managerDepartmentId != undefined && !isNaN(manager.managerDepartmentId)
        ) 
        {
           
            return true;
        }
        return false;
    },

    //sha256 consists only Hexadecimal characters.
    isValidAdminLogin: (manager) => {
        if (typeof (manager.managerEmail) === 'string' &&
            validator.isEmail(manager.managerEmail) &&
            typeof (manager.managerPassword) === 'string' &&
            manager.managerPassword.length === 64 &&
            validator.isLength(manager.managerPassword, { min: 8 }) && !validator.contains(manager.managerPassword, '-' || "'")) {
            return true;
        }
        return false;
    },

    

    isValidEditStudentProfile: (student) => {
        if (typeof (student.studentFullName) === 'string' &&
            student.studentFullName.length > 0 && student.studentFullName.length <= 255 &&
            typeof (student.studentPhone) === 'string' &&
            student.studentPhone.length === 10 && validator.isNumeric(student.studentPhone) &&
            typeof (student.studentCollegeName) === 'string' &&
            student.studentCollegeName.length > 0 && student.studentCollegeName.length <= 255 &&
            typeof (student.studentCollegeCity) === 'string' &&
            student.studentCollegeCity.length > 0 && student.studentCollegeCity.length <= 255) {
            return true;
        }
        return false;
    },

    isValidAdminEditProfile: (manager) => {
        if (typeof (manager.managerFullName) === 'string' &&
            manager.managerFullName.length > 0 && manager.managerFullName.length <= 255 &&
            typeof (manager.managerPhone) === 'string' &&
            manager.managerPhone.length === 10 && validator.isNumeric(manager.managerPhone) &&
            manager.managerDepartmentId != null && manager.managerDepartmentId != undefined && !isNaN(manager.managerDepartmentId)
        ) {
            return true;
        }
        return false;
    },

    isValidToggleStarredEventRequest: (req) => {
        if (req.body.eventId === undefined || req.body.eventId === null || isNaN(req.body.eventId)) {
            return false;
        }
        return true;
    },

    vaildRegistrationDataRequest: (req) => {
        if (req.body.registrationId === undefined || req.body.registrationId === null || isNaN(req.body.registrationId)) {
            return false;
        }
        return true;
    },

    isValidTag: (tag) => {
        if (typeof (tag.tagName) != 'string' || tag.tagName === undefined || tag.tagName === null || tag.tagName.length > 255 || tag.tagName.length === 0 ||
            typeof (tag.tagAbbreviation) != 'string' ||
            tag.tagAbbreviation === undefined || tag.tagAbbreviation === null || tag.tagAbbreviation.length > 255 || tag.tagAbbreviation.length === 0
        ) {
            return false;
        }
        return true;
    },

    isValidToggleTagStatus: (tag) => {
        if (tag.tagId === undefined || tag.tagId === null || isNaN(tag.tagId)
            || typeof (tag.isActive) != 'string'
            || tag.isActive === undefined || tag.isActive === null || (tag.isActive != "0" && tag.isActive != "1")
        ) {
            return false;
        }
        
        return true;
    },

    isValidCreateEvent: (event) => {
        if (typeof (event.eventName) != 'string' ||
            event.eventName === undefined || event.eventName === null || event.eventName.length > 255 || event.eventName.length === 0 ||
            typeof (event.eventDescription) != 'string' ||
            event.eventDescription === undefined || event.eventDescription === null || event.eventDescription.length > 255 || event.eventDescription.length === 0 ||
            typeof (event.eventMarkdownDescription) != 'string' ||
            event.eventMarkdownDescription === undefined || event.eventMarkdownDescription === null || event.eventMarkdownDescription.length > 5000 || event.eventMarkdownDescription.length === 0 ||
            typeof (event.eventDate) != 'string' ||
            event.eventDate === undefined || event.eventDate === null || isNaN(Date.parse(event.eventDate)) || event.eventDate.length === 0 ||
            typeof (event.eventTime) != 'string' ||
            event.eventTime === undefined || event.eventTime === null || !validator.isTime(event.eventTime) || event.eventTime.length === 0 ||
            typeof (event.eventVenue) != 'string' ||
            event.eventVenue === undefined || event.eventVenue === null || event.eventVenue.length > 255 || event.eventVenue.length === 0 ||
            typeof (event.eventImageURL) != 'string' ||
            event.eventImageURL === undefined || event.eventImageURL === null || event.eventImageURL.length > 255 || event.eventImageURL.length === 0 ||
            event.eventPrice === undefined || event.eventPrice === null || isNaN(event.eventPrice) ||
            event.maxSeats === undefined || event.maxSeats === null || isNaN(event.maxSeats) ||
            event.minTeamSize === undefined || event.minTeamSize === null || isNaN(event.minTeamSize) ||
            event.maxTeamSize === undefined || event.maxTeamSize === null || isNaN(event.maxTeamSize) ||
            event.isWorkshop === undefined || event.isWorkshop === null || (event.isWorkshop != "0" && event.isWorkshop != "1") ||
            event.isTechnical === undefined || event.isTechnical === null || (event.isTechnical != "0" && event.isTechnical != "1") ||
            event.isGroup === undefined || event.isGroup === null || (event.isGroup != "0" && event.isGroup != "1") ||
            event.isPerHeadPrice === undefined || event.isPerHeadPrice === null || (event.isPerHeadPrice != "0" && event.isPerHeadPrice != "1") ||
            event.isRefundable === undefined || event.isRefundable === null || (event.isRefundable != "0" && event.isRefundable != "1") ||
            event.needGroupData === undefined || event.needGroupData === null || (event.needGroupData != "0" && event.needGroupData != "1") ||
            event.eventDepartmentId === undefined || event.eventDepartmentId === null || isNaN(event.eventDepartmentId) ||
            event.tags === undefined || event.tags === null
        ) {
            return false;
        }
        return true;
    },

    isValidEditEventData: (event) => {
        if (typeof (event.eventName) != 'string' ||
            event.eventName === undefined || event.eventName === null || event.eventName.length > 255 || event.eventName.length === 0 ||
            typeof (event.eventDescription) != 'string' ||
            event.eventDescription === undefined || event.eventDescription === null || event.eventDescription.length > 255 || event.eventDescription.length === 0 ||
            typeof (event.eventMarkdownDescription) != 'string' ||
            event.eventMarkdownDescription === undefined || event.eventMarkdownDescription === null || event.eventMarkdownDescription.length > 5000 || event.eventMarkdownDescription.length === 0 ||
            typeof (event.eventDate) != 'string' ||
            event.eventDate === undefined || event.eventDate === null || isNaN(Date.parse(event.eventDate)) || event.eventDate.length === 0 ||
            typeof (event.eventTime) != 'string' ||
            event.eventTime === undefined || event.eventTime === null || validator.isTime(event.eventTime) || event.eventTime.length === 0 ||
            typeof (event.eventVenue) != 'string' ||
            event.eventVenue === undefined || event.eventVenue === null || event.eventVenue.length > 255 || event.eventVenue.length === 0 ||
            typeof (event.eventImageURL) != 'string' ||
            event.eventImageURL === undefined || event.eventImageURL === null || event.eventImageURL.length > 255 || event.eventImageURL.length === 0 ||
            event.eventPrice === undefined || event.eventPrice === null || isNaN(event.eventPrice) ||
            event.maxSeats === undefined || event.maxSeats === null || isNaN(event.maxSeats) ||
            event.minTeamSize === undefined || event.minTeamSize === null || isNaN(event.minTeamSize) ||
            event.maxTeamSize === undefined || event.maxTeamSize === null || isNaN(event.maxTeamSize) ||
            event.isWorkshop === undefined || event.isWorkshop === null || (event.isWorkshop != "0" && event.isWorkshop != "1") ||
            event.isTechnical === undefined || event.isTechnical === null || (event.isTechnical != "0" && event.isTechnical != "1") ||
            event.isGroup === undefined || event.isGroup === null || (event.isGroup != "0" && event.isGroup != "1") ||
            event.isPerHeadPrice === undefined || event.isPerHeadPrice === null || (event.isPerHeadPrice != "0" && event.isPerHeadPrice != "1") ||
            event.isRefundable === undefined || event.isRefundable === null || (event.isRefundable != "0" && event.isRefundable != "1") ||
            event.needGroupData === undefined || event.needGroupData === null || (event.needGroupData != "0" && event.needGroupData != "1") ||
            event.eventDepartmentId === undefined || event.eventDepartmentId === null || isNaN(event.eventDepartmentId) ||
            event.eventId === undefined || event.eventId === null || isNaN(event.eventId) ||
            event.tags === undefined || event.tags === null
        ) {
            
            return false;
        }
        return true;
    },

    isValidToggleEventStatus: (event) => {
        if (event.eventId === undefined || event.eventId === null || isNaN(event.eventId)
            || event.eventStatus === undefined || event.eventStatus === null || (event.eventStatus != "0" && event.eventStatus != "1" && event.eventStatus != "2")
        ) {
            return false;
        }
        return true;
    },


    isValidTagEvent: (req) => {
        if (req.eventId === undefined || req.eventId === null || isNaN(req.eventId)
            || req.tagId === undefined || req.tagId === null || isNaN(req.tagId)
        ) {
            return false;
        }
        return true;
    },


    isValidToggleStudentStatus: (student) => {
        if (student.studentId === undefined || student.studentId === null || isNaN(student.studentId)
            || student.isActive === undefined || student.isActive === null || (student.isActive != "0" && student.isActive != "1")
        ) {
            return false;
        }
        return true;
    },

    isValidToggleOfficialStatus: (manager) => {
        if (manager.managerId === undefined || manager.managerId === null || isNaN(manager.managerId)
            || manager.isActive === undefined || manager.isActive === null || (manager.isActive != "0" && manager.isActive != "1")
        ) {
            return false;
        }
        return true;
    },

    isValidAssignEventToOfficial: (req) => {
        if (req.eventId === undefined || req.eventId === null || isNaN(req.eventId)
            || req.managerId === undefined || req.managerId === null || isNaN(req.managerId)
        ) {
            return false;
        }
        return true;
    },

    isValidMarkEventAttendance: (req) => {
        if (req.studentId === undefined || req.studentId === null || isNaN(req.studentId)
            || req.eventId === undefined || req.eventId === null || isNaN(req.eventId)
        ) {
            return false;
        }
        return true;
    },


    /*
    {
        "eventId": "integer",
        "totalMembers": "integer",
        "isMarketPlacePaymentMode": "<0/1>",
    }
    */
    isValidEventRegistration: (req) => {
        if (!(typeof (req.body.eventId) === "number" && req.body.eventId >= 1 &&
            typeof (req.body.totalMembers) === "number" && req.body.totalMembers >= 1 &&
            typeof (req.body.isMarketPlacePaymentMode) === "string" && (req.body.isMarketPlacePaymentMode === "1" || req.body.isMarketPlacePaymentMode === "0"))) {
            return false;
        }

        return true;
    },

    isValidRegisterTeamRequest: (req) => {
        if (!(typeof (req.teamName) === "string" && req.teamName.length > 0 && req.teamName.length <= 255 &&
            typeof (req.teamMembers) === "object" && req.teamMembers.length >= 2 && req.teamMembers.length <=3  &&
            typeof (req.idcId) === "object" && req.idcId.length === req.teamMembers.length + 1)) {
            return false;
        }
        for (let i = 0; i < req.teamMembers.length; i++) {
            if (!(typeof (req.teamMembers[i]) === 'string' && validator.isEmail(req.teamMembers[i]))) {
                return false;
            }
        }
        let devfolioId="0";
        if (typeof (req.devfolioId) === "string" && req.devfolioId.length > 0 && req.devfolioId.length <= 255 && validator.isEmail(req.devfolioId)) 
        {
            devfolioId="1";
        }
        let unstopId="0";
        if (typeof (req.unstopId) === "string" && req.unstopId.length > 0 && req.unstopId.length <= 255 && validator.isEmail(req.unstopId)) 
        {
            unstopId="1";
        }
        let devpostId="0";
        if (typeof (req.devpostId) === "string" && req.devpostId.length > 0 && req.devpostId.length <= 255 && validator.isEmail(req.devpostId)) 
        {
            devpostId="1";
        }
        if((devfolioId === "1" && unstopId != "1" && devpostId != "1")
        ||(devfolioId != "1" && unstopId === "1" && devpostId != "1")
        ||(devfolioId != "1" && unstopId != "1" && devpostId === "1")
        ||(devfolioId === "0" && unstopId === "0" && devpostId === "0"))
        {
            return true;
        }
        return false;
    },

    isValidEditTeamRequest: (req) => {
        if (!(typeof (req.teamName) === "string" && req.teamName.length > 0 && req.teamName.length <= 255 &&
            typeof (req.teamMembers) === "object" && req.teamMembers.length >= 2 && req.teamMembers.length <=3  &&
            typeof (req.idcId) === "object" && req.idcId.length === req.teamMembers.length + 1)) {
            return false;
        }
        for (let i = 0; i < req.teamMembers.length; i++) {
            if (!(typeof (req.teamMembers[i]) === 'string' && validator.isEmail(req.teamMembers[i]))) {
                return false;
            }
        }
        return true;
    },

    isValidSubmitFirstRoundRequest: (req) => {
        if(
            typeof (req.problemStatement) === "string" && req.problemStatement.length > 0 && req.problemStatement.length <= 1000 &&
            typeof (req.theme) === "string" && req.theme.length > 0 && req.theme.length <= 2 && ["0","1","2","3","4","5"].includes(req.theme) &&
            typeof (req.pptFileLink) === "string" && req.pptFileLink.length > 0 && req.pptFileLink.length <= 500 && validator.isURL(req.pptFileLink) 
        ){
            return true;
        }
        return false;
    },

    isValidSubmitSecondRoundRequest: (req) => {
        if(
            typeof (req.pptFileLink) === "string" && req.pptFileLink.length > 0 && req.pptFileLink.length <= 500 &&
            typeof (req.githubLink) === "string" && req.githubLink.length > 0 && req.githubLink.length <= 500 && validator.isURL(req.githubLink) &&
            typeof (req.youtubeVideoLink) === "string" && req.youtubeVideoLink.length > 0 && req.youtubeVideoLink.length <= 500 &&
            typeof (req.devmeshLink) === "string" && req.devmeshLink.length > 0 && req.devmeshLink.length <= 500
        )
        {
            return true;
        }
        return false;
    },
    
    isValidCrewMember: (req) => {
        if (
            typeof(req.memberEmail) === "string" && req.memberEmail.length > 0 && req.memberEmail.length <= 255 && validator.isEmail(req.memberEmail) &&
            typeof(req.managerName) === "string" && req.managerName.length > 0 && req.managerName.length <= 255 &&
            typeof(req.crewId) === "number" && req.crewId >= 1 &&
            typeof(req.memberImageURL) === "string" && req.memberImageURL.length > 0 && req.memberImageURL.length <= 255 && validator.isURL(req.memberImageURL) &&
            typeof(req.departmentId) === "number" && req.departmentId >= 1 &&
            typeof(req.roleDescription) === "string" && req.roleDescription.length > 0 && req.roleDescription.length <= 255
        )
        {
            return true;
        }
        return false;
    },

    isValidTransactionStatus: (req) => {
        if (
            typeof(req.transactionStatus) === "string" && (req.transactionStatus === "1" || req.transactionStatus === "0" || req.transactionStatus === "2")
        ) {
            return true;
        }
        return false;
    },
}