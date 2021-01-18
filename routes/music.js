var express = require('express');
const session = require('express-session');
let xmlParser = require('xml2json');
var router = express.Router();
const mongodb = require('mongodb')
const cheerio = require("cheerio");
const axios = require("axios");
var path = require('path')
router.use(express.urlencoded({ extended: true }));
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

class Music {
    constructor(state = 1) {
        this.state = state;
    }
}

router.use(session({ secret: 'ssshhhhh', saveUninitialized: true, resave: true }))

const MongoClient = mongodb.MongoClient
var db
var sess

MongoClient.connect(process.env['DATABASE_URL'], { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) return console.log(err)
    db = client.db('biblio');
    console.log('connection bdd OK')

})

/* GET home page. */
router.get('/', async function (req, res, next) {
    sess = req.session
    if (sess.login) {
        const { page = 1, limit = 12, genre = '', title = '' } = req.query;
        let Music = db.collection('music')
        const result = await Music.find({ "music.genre": { '$regex': genre, '$options': 'i' }, "music.title": { '$regex': title, '$options': 'i' } }).limit(limit).skip((page - 1) * limit).toArray();
        return res.render('music.ejs', { musics: result, sess: sess.login })
    } else {
        return res.render('login.ejs')
    }

});


router.post('/addmusic', async function (req, res) {
    sess = req.session
    pathfile = './public/images/musics';
    music = new Music();
    if (sess.login) {
        value = req.body.id;
        url = process.env['DISCOG_API'] + '/releases/' + value + '?key=' + process.env['DISCOG_KEY'] + '&secret=' + process.env['DISCOG_SECRET']
        const resp = await axios.get(url, { validateStatus: false });
        if (resp.data && resp.status == 200) {
        result=resp.data
        console.log(result)
        music.title = result.title
        music.tracklist = result.tracklist
        if (result.image){
            music.cover = result.image[0]
        }else{
            music.cover = result.thumb
        }
            res.status(200).send(music)
    }else {
            res.status(404).send()
        }

    } else {
        return res.render('login.ejs')
    }


});

router.get('/searchmusic', async function (req, res) {
    sess = req.session
    value = req.query.value;
    if ((parseFloat(value) == parseInt(value)) && !isNaN(value)) {
        url = process.env['DISCOG_API'] + '/database/search?barcode=' + value + '&key=' + process.env['DISCOG_KEY'] + '&secret=' + process.env['DISCOG_SECRET']
    } else {
        url = process.env['DISCOG_API'] + '/database/search?q=' + value + '&key=' + process.env['DISCOG_KEY'] + '&secret=' + process.env['DISCOG_SECRET']
    }
     if (sess.login) {
        const resp = await axios.get(url);
        pagination= resp.data.pagination
        musics = resp.data.results
        res.status(200).send(musics)
    } else {
       return res.render('login.ejs')
    }


});
module.exports = router;
