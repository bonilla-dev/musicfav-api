'use strict'

const express = require('express')
const cors = require("cors")
const bearerToken = require('express-bearer-token')
const passport = require('passport')

const indexController = require('./controllers/indexController')
const userController = require('./controllers/userController')
const authController = require('./controllers/authController')
const database = require('./modules/database')

const app = express()

app.use(bearerToken())
app.use(cors());
app.use(passport.initialize())
app.use(express.json())
require('./modules/passport')

app.use(indexController)
app.use(userController)
app.use(authController)
database.connect()

module.exports = app