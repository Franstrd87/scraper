var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
var ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  teaser: {
    type: String,
    required: false
  },
  photo: {
    type: String,
    required: false
  },

  
  note: {
    type: Schema.Types.ObjectId,
    ref: "note"
  }
});

var Article = mongoose.model("article", ArticleSchema);

// Export the Article model
module.exports = Article;