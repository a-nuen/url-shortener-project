'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
var shortid = require('shortid');
var validUrl = require('valid-url');
var
  CircularJSON = require('circular-json'),
  obj = { foo: 'bar' },
  str
;
  
obj.self = obj;
str = CircularJSON.stringify(obj);

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI)

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: 'false'}));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// Schema for short-url
const shortenUrlSchema = mongoose.Schema({
  ogUrl: String,
  shortenedUrl: String
})

const ShortenUrl = mongoose.model('ShortenUrl', shortenUrlSchema)

// end point for original url posted by user
app.post('/api/shorturl/new', function (req, res) {
  const ogUrl = req.body.url
  // check if url is valid
  if (validUrl.isUri(ogUrl)){
    console.log('Looks like an URI'); 
    // check if url is already in the db
    ShortenUrl.findOne({ogUrl: ogUrl}, (err, data) => {
      if (data) res.json({originalUrl: data.ogUrl, shortUrl: data.shortenedUrl})
      else { // if not create new entry
        const tinyUrl = shortid.generate() // generate random code

        const myShortUrl = new ShortenUrl({
          ogUrl: ogUrl,
          shortenedUrl: tinyUrl
        })
        myShortUrl.save()

        return res.json({originalUrl: myShortUrl.ogUrl, shortUrl: myShortUrl.shortenedUrl})
      }
    })
  // if not valid send 400 status 
  } else {
    console.log('Not a URI');
    return res
      .status(400)
      .json('Invalid URL')
  }
})

// end point for redirecting to original site using short url
app.get('/api/shorturl/:code', function (req, res) {
  const shortenedUrl = req.params.code
  ShortenUrl.findOne({shortenedUrl: shortenedUrl}, (err, data) => {
    if (data) res.redirect(data.ogUrl)
    else res.json({error: 'code not found'})
  })
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});