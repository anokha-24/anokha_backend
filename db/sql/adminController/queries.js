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

const getEventRegistrationStats = {
  locks: {
    lockManagerData:`LOCK TABLES managerData READ`,
    lockEventData_departmentData : `LOCK TABLES eventData READ, departmentData READ`,
    lockEventData_departmentData_eventRegistrationData: `LOCK TABLES eventData READ, departmentData READ, eventRegistrationData READ`,
    lockEventData_departmentData_eventOrganizersData: `LOCK TABLES eventData READ, departmentData READ, eventOrganizersData READ`,
  },
  queries: {
    searchForManager: `SELECT * FROM managerData WHERE managerId=?`,
    allEventsDataWithRevenue: 
      `SELECT eventData.eventId, eventName, eventDate, eventTime, eventVenue, maxSeats, isWorkshop, isTechnical, isGroup,
      seatsFilled, eventDepartmentId, departmentName as eventDepartmentName, 
      departmentAbbreviation as eventDepartmentAbbreviation, revenueData.totalRevenue, revenueData.totalRegistrations, revenueData.totalMembers
      FROM eventData 
      LEFT JOIN departmentData ON eventData.eventDepartmentId = departmentData.departmentId
      LEFT JOIN (SELECT eventId, SUM(totalAmountPaid) as totalRevenue, COUNT(eventId) as totalRegistrations, SUM(totalMembers) as totalMembers FROM eventRegistrationData WHERE registrationStatus=2 GROUP BY eventId) as revenueData ON eventData.eventId = revenueData.eventId
      WHERE eventData.eventStatus != 0
      ORDER BY revenueData.totalRevenue DESC`,
    allEventsData: 
     `SELECT eventData.eventId, eventName, eventDate, eventTime, eventVenue, maxSeats, isWorkshop, isTechnical, isGroup,
      seatsFilled, eventDepartmentId, departmentName as eventDepartmentName, 
      departmentAbbreviation as eventDepartmentAbbreviation
      FROM eventData 
      LEFT JOIN departmentData ON eventData.eventDepartmentId = departmentData.departmentId
      WHERE eventData.eventStatus != 0`,
    managerDepartmentEventsData:
      `SELECT eventData.eventId, eventName, eventDate, eventTime, eventVenue, maxSeats, isWorkshop, isTechnical, isGroup,
      seatsFilled, eventDepartmentId, departmentName as eventDepartmentName, departmentAbbreviation as eventDepartmentAbbreviation
      FROM eventData 
      LEFT JOIN departmentData ON eventData.eventDepartmentId = departmentData.departmentId
      WHERE eventData.eventDepartmentId = ? AND eventData.eventStatus != 0`,
    localEventAttendanceTakerData:
      `SELECT eventId, eventName, eventDate, eventTime, eventVenue, maxSeats, isWorkshop, isTechnical, isGroup,
      seatsFilled, eventDepartmentId, departmentName as eventDepartmentName, departmentAbbreviation as eventDepartmentAbbreviation
      FROM eventData 
      LEFT JOIN departmentData ON eventData.eventDepartmentId = departmentData.departmentId
      RIGHT JOIN eventOrganizersData ON eventData.eventId = eventOrganizersData.eventId 
      WHERE eventOrganizersData.managerId = ? AND eventData.eventStatus != 0`,
  }
}


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
      `,
      lockManagerData:
      `
      LOCK TABLES
      managerData READ
      `,
      eventOrganizersData:
      `
      LOCK TABLES 
      eventOrganizersData READ
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
      getManagerDepartmentId:
      `
      SELECT 
      managerDepartmentId 
      FROM
      managerData 
      WHERE 
      managerId = ?
      `,
      checkIfEventOrganizer: 
      `
      SELECT * 
      FROM 
      eventOrganizersData
      WHERE
      eventId = ?
      AND 
      managerId = ?
      `,
    },
};

const totalEarnings = {
  locks: {
    lockEventRegistrationData: `LOCK TABLES eventRegistrationData r READ, eventData e READ`,
  },
  queries: {
    totalEarnings: `SELECT SUM(totalAmountPaid), count(totalAmountPaid), sum(totalMembers) FROM eventRegistrationData r JOIN eventData e ON e.eventId = r.eventId WHERE e.eventStatus != 0 AND r.registrationStatus=2`,
  },
};

const getTransactionStatusDiff = {
  locks: {
    lockTransactionData: `LOCK TABLES transactionData READ`,
  },
  queries: {
    getFailureTransactions: `SELECT * FROM transactionData WHERE transactionStatus = '2';`,
  },
}

module.exports = {
  unlockTables, 
  getAdminProfile,
  getEventRegistrationStats,
  getEventRegistrationData,
  totalEarnings,
  getTransactionStatusDiff
};
