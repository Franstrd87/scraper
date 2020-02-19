var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();


app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);

// Routes

// A GET route for scraping the echoJS website
  app.get("/scrape", function (req, res) {
    scrapeNow();
    res.send("Scrape Initiated");
  });

const scrapeNow = () => {
    // First, we grab the body of the html with axios
    axios.get("https://www.npr.org/sections/news/").then(function (response) {
      var $ = cheerio.load(response.data);
      $("article").each(function (i, element) {
        // Save an empty result object
        var result = {};

        result.title = $(element)
          .find("h2")
          .children("a")
          .text();
        result.link = $(element)
          .find("h2")
          .children("a")
          .attr("href");
        result.teaser = $(element)
          .find(".teaser")
          .text();
        result.photo = $(element)
          .find("img")
          .attr("src");

        console.log('trying to create article', result);
        if (!result.title || !result.link) {
          console.log('skipping bad article...');
          return;
        }
        let filter = {link: result.link}
        let options = {upsert: true}
        db.Article.findOneAndUpdate(filter, result, options)

          .then(function (dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          })
          .catch(function (err) {
            // If an error occurred, log it
            console.log('error during create call', err);
          });
      });
    });
  };

  // Route for getting all Articles from the db
  app.get("/articles", function (req, res) {
    db.Article.find({})
      .then(function (dbArticle) {
        // If any articles are found, send them to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurs, send it back to the client
        res.json(err);
      });
  });


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  

  db.Article.findOne({
    _id: req.params.id
  })
    .populate("note")
    .then(function (dbArticle) {
      // find all notes associated with user
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
 

  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/articles/delete", function (req, res) {
  db.Article.deleteMany({})
    .then(function (dbNews) {
      res.json(dbNews);
    })
    .catch(function (err) {
      res.json(err);
    });
  console.log("attempted to delete");
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
  scrapeNow();
});