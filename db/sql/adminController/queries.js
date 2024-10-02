const unlockTables = {
  queries: ["UNLOCK TABLES"],
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

module.exports = { unlockTables, 
  getAdminProfile,
  getEventRegistrationCount
};
