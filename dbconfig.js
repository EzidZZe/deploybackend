const mysql = require('mysql2')
require('dotenv').config()

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "firstdb",
    password: process.env.DB_PASSWORD
});
db.connect(e => {
    if (e) throw e
    console.log('Connected to database')
})
module.exports = db