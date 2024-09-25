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
}

export { unlockTables, getAdminProfile };
