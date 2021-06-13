const { Schema } = require("mongoose")


let songSchema = new Schema({
  id_web: {type: String, unique: true},
  title: { type: String, required: true},
  image: { type: String, required: true},
  author: { type: String },
  created_at: { type: Date, default: Date.Now },
  users: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  preview_url:{type: String},
  active: {type: Boolean, default: true},
  duration: {type: Number},
  platform: {type:String, required: true}
});

module.exports = songSchema