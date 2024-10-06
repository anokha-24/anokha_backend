const unlockTables = {
  queries: {
    unlock:"UNLOCK TABLES"
  },
};

const getAdminProfile = {
  locks: {
    lockManagerData:"LOCK TABLES managerData READ",
    lockManagerData_managerRole_departmentData:"LOCK TABLES managerData READ, managerRole READ, departmentData READ",
  },
  queries: {
    getAdminProfileData:`SELECT * FROM managerData
                        LEFT JOIN managerRole 
                        ON managerData.managerRoleId = managerRole.roleId
                        LEFT JOIN departmentData 
                        ON managerData.managerDepartmentId = departmentData.departmentId
                        WHERE managerData.managerId=?`,
  },
};

const editAdminProfile = {
    locks: {
      lockManagerData:"LOCK TABLES managerData WRITE"
    },
};

const getEventRegistrationCount = {
    locks: {
      lockEventData_departmentData:`LOCK TABLES eventData READ, departmentData READ`,
    },
    queries: {
      getEventRegistrationCountData: `SELECT eventId, eventName,
      eventDescription, eventDate, eventTime, eventVenue, maxSeats,
      seatsFilled, eventDepartmentId, departmentName as eventDepartmentName, departmentAbbreviation as eventDepartmentAbbreviation
      FROM eventData LEFT JOIN departmentData ON eventData.eventDepartmentId = departmentData.departmentId`
    }
};


// const jsonSchema = `
// JSON_OBJECT(
//     'eventId', e.eventId,
//     'isGroup', e.isGroup,
//     'registrations', (
//         SELECT JSON_ARRAYAGG(
//             JSON_OBJECT(
//                 'registrationId', erd.registrationId,
//                 'txnID', erd.txnId,
//                 'teamName', erd.teamName,
//                 'teamData', (
//                     SELECT JSON_ARRAYAGG(
//                         JSON_OBJECT(
//                             'studentId', COALESCE(ergd.studentId, erd.studentId),
//                             'role', ergd.roleDescription,
//                             'studentFullName', sd.studentFullName,
//                             'studentCollegeName', sd.studentCollegeName,
//                             'studentCollegeCity', sd.studentCollegeCity,
//                             'studentEmail', sd.studentEmail,
//                             'studentPhone', sd.studentPhone
//                         )
//                     )
//                     FROM (
//                         SELECT erd2.registrationId, erd2.studentId, NULL as roleDescription
//                         FROM eventRegistrationData erd2
//                         WHERE erd2.eventId = e.eventId AND e.isGroup = '0'
//                         UNION ALL
//                         SELECT ergd2.registrationId, ergd2.studentId, ergd2.roleDescription
//                         FROM eventRegistrationGroupData ergd2
//                         WHERE ergd2.eventId = e.eventId AND e.isGroup = '1'
//                     ) ergd
//                     JOIN studentData sd ON sd.studentId = ergd.studentId
//                     WHERE ergd.registrationId = erd.registrationId
//                 )
//             )
//         )
//         FROM eventRegistrationData erd
//         WHERE erd.eventId = e.eventId
//     )
// ) 
// AS result`

const studentContactJSON = `
JSON_ARRAYAGG(
  JSON_OBJECT(
    'studentId', eventRegistrationData.studentId,
    'roleDescription', COALESCE(eventRegistrationGroupData.roleDescription,"N/A"),
    'isOwnRegistration', COALESCE(eventRegistrationGroupData.isOwnRegistration,"1"),
    'studentFullName', studentData.studentFullName,
    'studentCollegeName', studentData.studentCollegeName,
    'studentCollegeCity', studentData.studentCollegeCity,
    'studentEmail', studentData.studentEmail,
    'studentPhone', studentData.studentPhone
  )
)
`

const getEventRegistrationData = {
    locks: {
      lockEventData_eventRegistrationData_eventRegistrationGroupData_studentData_departmentData: 
      `
      LOCK TABLES 
      eventData READ, 
      eventRegistrationData READ, 
      eventRegistrationGroupData READ,
      studentData READ,
      departmentData READ
      `
    },
    queries: {
      getEventData: 
      `SELECT 
      eventId,
      eventName,
      eventDate,
      eventTime,
      eventVenue,
      eventPrice,
      maxSeats,
      seatsFilled,
      minTeamSize,
      maxTeamSize,
      isWorkshop,
      isTechnical,
      isGroup,
      isPerHeadPrice,
      eventStatus,
      eventDepartmentId,
      departmentName as eventDepartmentName
      FROM eventData 
      LEFT JOIN 
      departmentData
      ON eventData.eventDepartmentId =
      departmentData.departmentId
      WHERE eventId = ?`,
      getAllEventRegistrationData:`
      SELECT 
      eventRegistrationData.registrationId,
      eventRegistrationData.createdAt as registrationDate,
      eventRegistrationData.txnId,
      eventRegistrationData.totalAmountPaid as amount,
      teamName,
      ${studentContactJSON}
      AS teamData
      FROM eventRegistrationData 
      LEFT JOIN
      eventRegistrationGroupData
      ON
      eventRegistrationData.registrationId = 
      eventRegistrationGroupData.registrationId
      LEFT JOIN 
      studentData
      ON COALESCE(eventRegistrationGroupData.studentId,
      eventRegistrationData.studentId) =
      studentData.studentId
      WHERE eventRegistrationData.eventId = ?
      GROUP BY 
      eventRegistrationData.registrationId,
      eventRegistrationData.createdAt,
      eventRegistrationData.txnId,
      eventRegistrationData.totalAmountPaid,
      eventRegistrationData.teamName`,
      getDepartmentEventRegistrationData: ``,
      getSpecificEventRegistrationData: ``
    }
};

module.exports = { 
  unlockTables, 
  getAdminProfile,
  getEventRegistrationCount,
  getEventRegistrationData
};
