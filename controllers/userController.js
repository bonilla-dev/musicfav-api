'use strict'

const express = require('express');
const { sha512 } = require('js-sha512');
const router = express.Router()
const passport = require('passport')
const axios = require('axios')

const songModel = require('../models/songModel')
const userModel = require('../models/userModel')

const authMiddleware = require('../modules/authenticator')
const onlyRegisteredAccess = authMiddleware(true, ['user', 'admin'])
const onlyUserAccess = authMiddleware(true, ['user'])
const onlyAdminAccess = authMiddleware(true, ['admin'])

router.route('/users')
  .get(onlyAdminAccess, async (req, res) => {
    try {
      const limit = req.query.hasOwnProperty('limit') ? parseInt(req.query.limit) : 50

      let userList = await userModel.find().sort({ firstname: 'ASC', lastname: 'ASC' }).limit(limit).exec()
      userList = userList.map((user) => {
        user = user.toJSON()
        delete user.password

        return user
      })

      res.json(userList)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  })
  .post(async (req, res) => {
    let userData = req.body
    try {
      userData.photo = "https://sguru.org/wp-content/uploads/2017/06/steam-avatar-profile-picture-1497.png"
      userData.profile = "user"
      userData.password = sha512(userData.password)

      userData = await new userModel(userData).save()
      userData = userData.toJSON()
      delete userData.password

      res.status(201).json(userData)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  })

router.route('/users/:userId')
  .get(onlyUserAccess, async (req, res) => {
    try {
      const userId = req.params.userId
      let foundUser = await userModel.findById(userId).exec()

      if (!foundUser) {
        res.status(404).json({ message: `Usuario ${userId} no encontrado.` })
        return
      }
      foundUser = foundUser.toJSON()
      delete foundUser.password

      res.json(foundUser)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  })
  .put(onlyUserAccess, async (req, res) => {
    try {
      const userId = req.params.userId
      const userData = req.body

      let updatedItem = await userModel.findOneAndUpdate({ _id: userId }, userData, { new: true }).exec()

      if (!updatedItem) {
        res.status(404).json({ message: `Usuario ${userId} no encontrado.` })
        return
      }

      updatedItem = updatedItem.toJSON()
      delete updatedItem.password

      res.json(updatedItem)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  })
  .delete(onlyRegisteredAccess, async (req, res) => {
    try {
      const userId = req.params.userId

      let foundItem = await userModel.findOneAndDelete({ _id: userId }).exec()

      if (!foundItem) {
        res.status(404).json({ message: `Usuario ${userId} no encontrado.` })
        return
      }

      res.status(204).json(null)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  })
router.route('/users/:userId/youtube')
  .get((req, res, next) => {
    const userId = req.params.userId
    req.app.set('userId', userId)
    passport.authenticate('youtube')
      (req, res, next)
  })

router.route('/youtube/callback')
  .get(passport.authenticate('youtube', { failureRedirect: '/login' }), async (req, res, next) => {
    try {

      const userId = req.app.get('userId')
      const userYoutube = req.user
      const foundUser = await userModel.findById(userId).exec()
      if (!foundUser) {
        res.status(404).json({ message: 'Usuario no existe' })
        return
      }

      let config = {
        headers: {
          'Authorization': 'Bearer ' + userYoutube.accessToken
        }
      }
      const response = await axios.get(`https://youtube.googleapis.com/youtube/v3/channels?part=snippet&mine=true&key=${config.GOOGLE_API_KEY}`, config)
      const youtubeIdChannel = response.data.items[0].id
      const playlistsChannel = await axios.get(`https://youtube.googleapis.com/youtube/v3/playlists?part=contentDetails&part=snippet&channelId=${youtubeIdChannel}&key=${config.GOOGLE_API_KEY}`, config)
      const playlist = playlistsChannel.data.items.filter(list => list.snippet.title == "Favorite");
      const songs = await axios.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlist[0].id}&key=${config.GOOGLE_API_KEY}`, config)
      const canciones = songs.data.items
      //TODO Añadir toda la lista con un while o similar
      canciones.forEach(async cancion => {
        let newSong = {
          id_web: cancion.id,
          title: cancion.snippet.title,
          image: cancion.snippet.thumbnails.default.url,
          author: cancion.snippet.videoOwnerChannelTitle,
          users: [],
          preview_url: cancion.snippet.resourceId.videoId,
          platform: "https://mpng.subpng.com/20200216/py/transparent-icon-youtube-logo-youtube-copyright-strike-kacperniszonampaposs-profile-anilist5eb0d45ea51fa2.7624506715886470066764.jpg"
        }
        const foundSong = await songModel.findOne({ id_web: cancion.id }).exec()
        if (foundSong && !foundSong.users.includes(userId)) {
          console.log("La cancion existe pero el usuario no la tiene")
          foundSong.users.push(userId)
          newSong = await songModel.findOneAndUpdate({ id_web: cancion.id }, foundSong, { new: true }).exec()

          foundUser.songs.push(newSong._id)
          if(!foundUser.platforms.includes("Youtube")) {
            foundUser.platforms.push("Youtube")
          }
          await userModel.findByIdAndUpdate(foundUser._id, foundUser, { new: true }).exec()
        }

        if (!foundSong) {
          newSong.users.push(userId)
          newSong = await songModel(newSong).save()
          console.log("La cancion no existe")
          foundUser.songs.push(newSong._id)
          if(!foundUser.platforms.includes("Youtube")) {
            foundUser.platforms.push("Youtube")
          }
          await userModel.findByIdAndUpdate(foundUser._id, foundUser, { new: true }).exec()
        }
      });
        
    } catch (error) {
      res.status(404).json({ message: error.message })
    }
  })

router.route('/users/:userId/spotify')
  .get((req, res, next) => {
    const userId = req.params.userId
    req.app.set('userId', userId)
    passport.authenticate('spotify', {scope: ['user-read-email', 'user-read-private', 'user-library-read'],
    showDialog: true})
      (req, res, next)
  })

router.route('/spotify/callback')
  .get(passport.authenticate('spotify', { failureRedirect: '/login' }), async (req, res, next) => {
    try {
    const userSpotify = req.user
    const userId = req.app.get('userId')

    //Buscar el usuario
    const foundUser = await userModel.findById(userId).exec()
      if (!foundUser) {
        res.status(404).json({ message: 'Usuario no existe' })
        return
      }

      let config = {
        headers: {
          'Authorization': 'Bearer ' + userSpotify.accessToken
        }
      }
      const response = await axios.get("https://api.spotify.com/v1/me/tracks?limit=50", config)
      const canciones = response.data.items
      //TODO Añadir toda la lista con un while o similar
      canciones.forEach(async cancion => {
        let newSong = {
          id_web: cancion.track.id,
          title: cancion.track.name,
          image: cancion.track.album.images[1].url,
          author: cancion.track.album.artists[0].name,
          users: [],
          preview_url: cancion.track.preview_url,
          duration: cancion.track.duration_ms,
          platform: "https://th.bing.com/th/id/Rf3439bb671530685b3a9fd9d5d1bb372?rik=OP9ji%2fBr4TO7Wg&riu=http%3a%2f%2f1000logos.net%2fwp-content%2fuploads%2f2017%2f08%2fSpotify-Logo-500x367.png&ehk=RkHgHYuxK%2bbtFEJ4IqRmknwVJY1n204P0mxJF1F7afo%3d&risl=&pid=ImgRaw"
        }
        const foundSong = await songModel.findOne({ id_web: cancion.track.id }).exec()
        if (foundSong && !foundSong.users.includes(userId)) {
          console.log("La cancion existe pero el usuario no la tiene")
          foundSong.users.push(userId)
          newSong = await songModel.findOneAndUpdate({ id_web: cancion.track.id }, foundSong, { new: true }).exec()

          foundUser.songs.push(newSong._id)
          if(!foundUser.platforms.includes("Spotify")) {
            foundUser.platforms.push("Spotify")
          }
          await userModel.findByIdAndUpdate(foundUser._id, foundUser, { new: true }).exec()
        }

        if (!foundSong) {
          newSong.users.push(userId)
          newSong = await songModel(newSong).save()
          console.log("La cancion no existe")
          foundUser.songs.push(newSong._id)
          if(!foundUser.platforms.includes("Spotify")) {
            foundUser.platforms.push("Spotify")
          }
          await userModel.findByIdAndUpdate(foundUser._id, foundUser, { new: true }).exec()
        }
      });
    } catch (error) {
      res.status(404).json({ message: error.message })
    }
  })


router.route('/users/:userId/songs')
.get(onlyRegisteredAccess, async (req, res) => {
  try {
    const userId = req.params.userId
    const foundUser = await userModel.findById(userId).exec()
    if(!foundUser) {
      res.status(404).json({message: 'Usuario no encontrado'})
      return
    }
    let songs = await songModel.find({users: userId}).exec()
    songs = songs.map((song) => {
      song = song.toJSON()
      delete song.users

      return song
    })
    res.json(songs)
  } catch (error) {
    res.json(error)
  }
})

router.route('/users/:userId/songs/:songId')
.delete(onlyUserAccess, async (req, res) => {
  try {
    const songId = req.params.songId
    const foundSong = await songModel.findOneAndDelete({_id: songId}).exec()
    if(!foundSong) {
      res.status(404).json({message: "Cancion no encontrada, prueba con otra."})
      return
    }
    res.status(204).json(null)
  }catch(error){
    res.status(500).json({ message: error.message })
  }
})

module.exports = router