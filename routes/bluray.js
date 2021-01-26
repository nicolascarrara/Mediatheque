var express = require('express');
const session = require('express-session');
let xmlParser = require('xml2json');
var router = express.Router();
const mongodb = require('mongodb')
const cheerio = require("cheerio");
const axios = require("axios");
var path = require('path')
router.use(express.urlencoded({extended: true}));
const fs = require('fs')
let request = require('request')
let pathfile = '';
router.use('/public', express.static('public'));
let urlapi = "http://www.dvdfr.com/api/"


const download = (url, path, callback) => {
  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback)
  })
}


let bookName = "";
router.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}))

const MongoClient = mongodb.MongoClient
var db
var sess

MongoClient.connect(process.env['DATABASE_URL'], { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) return console.log(err)
  db = client.db('biblio');
  console.log('connection bdd OK')

})

/* GET home page. */
router.get('/', async function(req, res, next) {
  sess=req.session
 if(sess.login){
   const { page = 1, limit = 12, genre = '', title = '' } = req.query;
   let Movies = db.collection('movies')
   const result = await Movies.find({ "movie.genre": { '$regex': genre, '$options': 'i' }, "movie.title": { '$regex': title, '$options': 'i' } }).limit(limit).skip((page - 1) * limit).toArray();
   return res.render('movies.ejs', {movies: result, sess: sess.login})
  
 }else{
  return res.render('login.ejs')
 }

});


router.post('/addmovie', async function(req, res) {
  sess = req.session
  pathfile = './public/images/movies/';
  if (sess.login) {
    const resp = await axios.get(urlapi+"dvd.php?id="+req.body.id);
    jsonresp = JSON.parse(xmlParser.toJson(resp.data))
    if  (resp){
      res.status(200).send(jsonresp)
    }else{
      res.status(500).send()
    }
  } else {
    return res.render('login.ejs')
  }


});

router.get('/quota', async function (req, res) {
  sess = req.session
  value = req.query.value;
  if (sess.login) {
    const resp = await axios.get(urlapi + "quota.php?json" );
    console.log(resp.data);
    if (resp) {
      console.log('JSON output', resp.data.fetchs);
      res.status(200).send(resp.data.fetchs)
    } else {
      res.status(500).send()
    }
  } else {
    return res.render('login.ejs')
  }
});

router.get('/searchmovie', async function (req, res) {
  sess = req.session
  value = req.query.value;
  if (sess.login) {
    if ((parseFloat(value) == parseInt(value)) && !isNaN(value)) { 
      url = "http://www.dvdfr.com/api/search.php?gencode=" + value;
    }else{
      url = "http://www.dvdfr.com/api/search.php?title=" + value;
    }
    const resp = await axios.get(url);
    console.log(resp.data);
    jsonresp = JSON.parse(xmlParser.toJson(resp.data))
    if (resp) {
      console.log('JSON output', jsonresp.dvds);
      res.status(200).send(jsonresp.dvds)
    } else {
      res.status(500).send()
    }

  } else {
    return res.render('login.ejs')
  }


});
module.exports = router;
