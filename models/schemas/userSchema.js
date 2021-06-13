const { Schema } = require("mongoose")


let userSchema = new Schema({
  firstname: { type: String, required: true, minlength: 3, maxlength: 100 },
  lastname: { type: String, required: true, minlength: 3, maxlength: 100 },
  email: { type: String, required: true, unique: true },
  photo: { type: String },
  password: { type: String, required: true, minlenght: 8, maxlenght: 200 },
  profile: { type: String, required: false, default: 'user' },
  enabled: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.Now },
  songs: [
    { type: Schema.Types.ObjectId, ref: 'songs' }
  ],
  platforms: [
    { type: String, require: true }
  ],
  // status: {
  //   type: String,
  //   enum: ['Pending', 'Active'],
  //   default: 'Pending'
  // },
  // confirmationCode: {
  //   type: String,
  //   unique: true
  // }
});

module.exports = userSchema