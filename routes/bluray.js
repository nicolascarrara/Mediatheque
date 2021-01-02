var express = require('express');
const session = require('express-session');
var router = express.Router();
const mongodb = require('mongodb')
const cheerio = require("cheerio");
const axios = require("axios");
var path = require('path')
router.use(express.urlencoded({extended: true}));
//const siteUrl = "https://www.chasse-aux-livres.fr/prix/2353150330";
const fs = require('fs')
let request = require('request')
let pathfile = '';
router.use('/public', express.static('public'));


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

MongoClient.connect('mongodb://nico:zG55iE3MuExHtrCZ@localhost/biblio?authSource=biblio&w=1', (err, database) => {
  if (err) return console.log(err)
  db = database
  console.log('connection bdd OK')
})


/* GET home page. */
router.get('/', async function(req, res, next) {
  sess=req.session
 if(sess.login){
   //res.render('index', { title: 'Express' });
   db.collection('movies').find({}).toArray((err, result) => {
     if (err) throw err;
  //  console.log(result);
    db.close();
    return res.render('movies.ejs', {movies: result, sess: sess.login})
   })
 }else{
  return res.render('login.jade')
 }

});
module.exports = router;
