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

const getEventRegistrationData = {
    locks: {
      lockEventData_eventRegistrationData_eventRegistrationGroupData_studentData: 
      `
      LOCK TABLES 
      eventData READ, 
      eventRegistrationData READ, 
      eventRegistrationGroupData READ,
      studentData READ
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
      eventDepartmentId
      FROM eventData 
      WHERE eventId = ?`,
      getAllEventRegistrationData:`

      `,
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
