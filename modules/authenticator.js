const jwt = require('jsonwebtoken')
const config = require('./config')


module.exports = function authenticator(requiredSession, allowedProfiles = []) {

  return async (req, res, next) => {
    const token = req.token
    console.log(req)
    req.tokenData = null

    if (!token && !requiredSession) {
      next()
      return
    }

    try {
      if (!token && requiredSession) {
        res.status(401).json({ message: 'Debes iniciar sesión para llamar a este método' })
        return
      }

      if (token) {
        req.tokenData = await jwt.verify(token, config.APP_SECRET)

        
      }

      if (requiredSession && allowedProfiles.indexOf(req.tokenData.profile) === -1) {
        res.status(403).json({ message: 'No tienes permisos suficientes para llamar a este método.' })
        return
      }

      next()
    } catch (error) {
      res.status(500).json({ message: error.message })
      return
    }
  }

}