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
  pathfile = './public/images/';
  if (sess.login) {
    console.log(req.body.ean);
    const resp = await axios.get(urlapi+"search.php?gencode="+req.body.ean);
    console.log(resp.data);
    if  (resp){
      console.log('JSON output', xmlParser.toJson(resp.data));
      res.status(200).send(resp.data)
    }else{
      res.status(500).send()
    }
    
  } else {
    return res.render('login.ejs')
  }


});
module.exports = router;
