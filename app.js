const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const db = require('./dbconfig')
require('dotenv').config()


const PORT = process.env.PORT
const app = express()
app.use(express.json())
app.use(cors())


app.post('/api/register', async (req, res) => {
    const {name, age, email, password} = req.body
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        db.query('INSERT Users(FirstName, Age, Email, HashPass) VALUES(?, ?, ?, ?)', [name, age, email, passwordHash])
        res.json({ msg: 'User added successfully' })
    } catch (err) {
        return res.status(500).json({ msg: 'Iternal server error', error: err })
    }
})

app.post('/api/login', (req, res) => {
    const {email, password} = req.body
    db.query('SELECT * FROM Users WHERE Email = ?', [email], async (err, result) => {
        if (err) return res.status(500).json({ msg: 'Iternal server error' })
        const isIdent = await bcrypt.compare(password, result[0].HashPass)
        if (!isIdent) return res.status(400).json({ msg: 'Invalid password or login' })
        const access_token = jwt.sign({ email, password }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
        const refresh_token = jwt.sign({ email, password }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
        res.json({ access_token, refresh_token })
    })
})
app.get('/api/refresh_token', (req, res) => {
    if (!req.headers.authorization_refresh) return res.status(400).json({ msg: 'No refresh token recieved' })
    const user = jwt.verify(req.headers.authorization_refresh, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.status(403).json({ msg: 'Wrong user' })
        res.redirect('/api/login')
    }) 
})

app.get('/api/users', checkAuth, (req, res) => {
    db.query('SELECT * FROM Users', (err, result) => {
        res.json({ result })
    })
})
function checkAuth(req, res, next){
    if (!req.headers.authorization) return res.status(400).json({ msg: 'No token recieved' })
    const isAuth = jwt.verify(req.headers.authorization, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err) return res.redirect('/api/refresh_token')
        next()
    })
}

app.listen(PORT, (e) => console.log(`Server started on http://localhost:${PORT}`))