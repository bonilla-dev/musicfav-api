'use strict'

const mongoose = require('mongoose')

const songSchema = require('./schemas/songSchema')

const userModel = mongoose.model('songs', songSchema)

module.exports = userModel