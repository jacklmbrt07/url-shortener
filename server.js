require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const urlSchema = new mongoose.Schema({
  original: { type: String, required: true },
  short: { type: Number, required: false },
});

const Url = mongoose.model("Url", urlSchema);

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

let responseObject = {};

app.post(
  "/api/shorturl/new",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let inputShort = 1;
    let inputUrl = req.body.url;
    let urlRegex = new RegExp(
      /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
    );

    if (!inputUrl.match(urlRegex)) {
      return res.json({ error: "Invalid URL" });
    }

    responseObject.original_url = inputUrl;

    Url.findOne({})
      .sort({ short: "desc" })
      .exec((err, result) => {
        if (!err && result != undefined) {
          inputShort = result.short + 1;
        }
        if (!err) {
          Url.findOneAndUpdate(
            { original: inputUrl },
            { original: inputUrl, short: inputShort },
            { new: true, upsert: true },
            (err, savedUrl) => {
              if (!err) {
                responseObject.short_url = savedUrl.short;
                res.json(responseObject);
              }
            }
          );
        }
      });
  }
);

app.get("/api/shorturl/:inputShort", (req, res) => {
  let inputShort = req.params.inputShort;
  Url.findOne({ short: inputShort }, (err, result) => {
    if (!err && result != undefined) {
      res.redirect(result.original);
    } else {
      res.json({ error: "URL Does Not Exist" });
    }
  });
});

// Listener
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
