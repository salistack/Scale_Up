const mongoose = require('mongoose');
const PostSchema = new mongoose.Schema({
  // ...other fields
  image: { type: String }, // Add this if not present
});
module.exports = mongoose.model('Post', PostSchema);