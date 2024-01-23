const fs = require('fs');
const dataValidator = require('../middleware/validator/dataValidator');
const adminTokenValidator = require('../middleware/auth/login/adminTokenValidator');
const [anokha_db, anokha_transactions_db] = require('../connection/poolConnection');

module.exports = {
    testConnection: async (req, res) => {
        res.status(200).json({
            "MESSAGE": "It's Working. 👍🏻",
            "WHO": "Admin"
        });
        return;
    },

    getAdminProfile: [
        adminTokenValidator,
        async (req, res) => {
            if (!await dataValidator.isValidAdminRequest(req.body.managerId)) {
                res.status(400).json({
                    "MESSAGE": "Access Restricted!"
                });
                return;
            }
            else {
                const db_connection = await anokha_db.promise().getConnection();
                try {
                    await db_connection.query("LOCK TABLES managerData READ, managerRole READ, departmentData READ");
                    const query = `SELECT * FROM managerData
                    LEFT JOIN managerRole ON managerData.managerRoleId = managerRole.roleId
                    LEFT JOIN departmentData ON managerData.managerDepartmentId = departmentData.departmentId
                    WHERE managerData.managerId=?`;
                    const [manager] = await db_connection.query(query, [req.body.managerId]);
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                    res.status(200).json({
                        "MESSAGE": "Successfully Fetched Admin Profile.",
                        "managerFullName": manager[0].managerFullName,
                        "managerEmail": manager[0].managerEmail,
                        "managerPhone": manager[0].managerPhone,
                        "managerRoleId": manager[0].managerRoleId,
                        "managerRole": manager[0].roleName,
                        "managerDepartmentId": manager[0].departmentId,
                        "managerDepartment": manager[0].departmentName,
                        "managerDepartmentAbbreviation":manager[0].departmentAbbreviation
                    });
                    return;
                }
                catch (err) {
                    console.log(err);
                    const time = new Date();
                    fs.appendFileSync('./logs/adminController/errorLogs.log', `${time.toISOString()} - getAdminProfile - ${err}\n`);
                    res.status(500).json({
                        "MESSAGE": "Internal Server Error. Contact Web Team."
                    });
                    return;
                }
                finally {
                    await db_connection.query("UNLOCK TABLES");
                    db_connection.release();
                }
            } 
        }
    ]
}