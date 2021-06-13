'use strict'

const mongoose = require('mongoose')

const userSchema = require('./schemas/userSchema')

const userModel = mongoose.model('users', userSchema)

module.exports = userModel