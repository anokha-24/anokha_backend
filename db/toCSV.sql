SELECT intelSubmissions.teamId, intelTeamData.teamName, studentData.studentCollegeName 
INTO OUTFILE '/var/lib/mysql-files/intelSubmissions.csv' 
FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' 
FROM intelSubmissions 
LEFT JOIN intelTeamData ON intelSubmissions.teamId = intelTeamData.teamId 
LEFT JOIN studentData ON intelTeamData.createdBy =
studentData.studentId;