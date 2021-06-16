'use strict'

const express = require('express')
const router = express.Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')

const config = require('../modules/config')



router.route('/auth/login')
  .post(async (req, res, next) => {
    passport.authenticate('login', async (error, user) => {
      try {
        // if(user.status !== "Active") {
        //   res.status(401).json({message: "Cuenta pendiente de activación, Por favor verifica tu correo."})
        //   return
        // }
        if (error || !user) {
          return next(error)
        }

        req.login(user, { session: false }, async (error) => {
          if (error) return next(error)

          let payload = {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            profile: user.profile,
            photo: user.photo
          }

          const token = jwt.sign(payload, config.APP_SECRET, {
            expiresIn: "30 days"
          })
          return res.json({ token })
        })
      }
      catch (error) {
        res.json(error)
        return next(error)
      }
    })(req, res, next)
  })

router.route('/auth/forggotten-password')
  .post((req, res) => {
    res.json({})
  })

router.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
  })

module.exports = router