
const passport = require('passport')
const localStrategy = require('passport-local').Strategy;
const { sha512 } = require('js-sha512')
const JWTStrategy = require('passport-jwt').Strategy
const ExtractJWT = require('passport-jwt').ExtractJwt

const YoutubeV3Strategy = require('passport-youtube-v3').Strategy
const SpotifyStrategy = require('passport-spotify').Strategy;

const userModel = require('../models/userModel')
const config = require('./config')

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use('login', new localStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    password = sha512(password)
    const user = await userModel.findOne({ email })
    if (!user) {
      return done(null, false, { message: 'Usuario y/o Contraseña no validos.' });
    }
    if (user.password !== password) {
      return done(null, false, { message: 'Usuario y/o Contraseña no validos.' });
    }
    return done(null, user, { message: 'Login successfull' });
  } catch (error) {
    return done(error)
  }
}
));

passport.use(new JWTStrategy({
  secretOrKey: config.APP_SECRET,
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
}, async (token, done) => {
  try {
    return done(null, token)
  } catch (error) {
    done(error)
  }
}))

passport.use(new YoutubeV3Strategy({
  clientID: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  callbackURL: config.GOOGLE_REDIRECT,
  scope: ['https://www.googleapis.com/auth/youtube.readonly']
},
function(accessToken, refreshToken, profile, done) {
    return done(null, {profile, accessToken});
}
));

passport.use(new SpotifyStrategy({
      clientID: config.SPOTIFY_CLIENT_ID,
      clientSecret: config.SPOTIFY_CLIENT_SECRET,
      callbackURL: config.SPOTIFY_REDIRECT
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
        return done(null, {accessToken, refreshToken, profile})
    }
  )
);