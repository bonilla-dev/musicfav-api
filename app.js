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

const corsOptions = {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
}


app.use(bearerToken())
app.use(cors(corsOptions));
app.use(passport.initialize())
app.use(express.json())
require('./modules/passport')

app.use(indexController)
app.use(userController)
app.use(authController)
database.connect()

module.exports = app