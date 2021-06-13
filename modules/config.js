'use strict'

if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv')
  const result = dotenv.config()

  if (result.error) {
    throw result.error
  }

  const envs = result.parsed

  module.exports = envs
}else{
  module.exports = process.env
}