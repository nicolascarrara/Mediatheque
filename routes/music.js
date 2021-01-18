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
let urlapi = "http://api.music-story.com/fr"
const accesstoken ="3beb354d79ac47191734f4b71ee3b9300305246d";
const secrettoken ="2e1ca98ab37730f8d111e4ff75895bc668da2f91";

const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
        request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    })
}

class Music {
    constructor(title = null, state = 1) {
        this.title = title;
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
    pathfile = './public/images/';
    key = 'VBwFQyAFtuPnXVSAbZsW'
    secret = 'yAsSQmGUsPkQaBdBvZSWMHlMzqkKBaaT'
    music = new Music();
    if (sess.login) {
        value = req.body.id;
        url = 'https://api.discogs.com/releases/' + value +'?key='+key+'&secret='+secret
    //     //         if (respcover.data && respcover.status == 200) {
    //     //             // console.log(respcover.status)
    //     //             // console.log(respcover.data)
    //     //             music.cover = respcover.data.images[0].image
    //     //         } else {
    //     //             music.cover = "https://dummyimage.com/600x400/000/ffffff&text=No+cover"
    //     //         }
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

router.get('/quota', async function (req, res) {
    sess = req.session
    pathfile = './public/images/';
    value = req.query.value;
    if (sess.login) {
        const resp = await axios.get(urlapi + "quota.php?json");
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

router.get('/searchmusic', async function (req, res) {
    sess = req.session
    pathfile = './public/images/';
    value = req.query.value;
    country='FR'
    key = 'VBwFQyAFtuPnXVSAbZsW'
    secret = 'yAsSQmGUsPkQaBdBvZSWMHlMzqkKBaaT'
    if ((parseFloat(value) == parseInt(value)) && !isNaN(value)) {
        url = 'https://api.discogs.com/database/search?barcode=' + value + '&key=' + key + '&secret=' + secret
    } else {
        url = 'https://api.discogs.com/database/search?q=' + value + '&key=' + key + '&secret=' + secret
    }
    
    //  if (sess.login) {
        const resp = await axios.get(url);
        console.log(resp.data)
        pagination= resp.data.pagination
        musics = resp.data.results
        res.status(200).send(musics)
        console.log()
        
    
    
   // res.status(200).send(resp.data)
    // if (undefined != resp.data.releases) {
    //     let musics = resp.data.releases
    //     musics = musics.filter(music => !music.title.toLowerCase().includes("titled"));
    //     musics = musics.filter(music => !music.title.toLowerCase().includes("suggestion"));

    //     // if (musics.length > 0 && Array.isArray(musics)) {
    //     //     for await (const music of musics) {
    //     //         coverurl = "http://coverartarchive.org/release/" + music.id
    //     //         const respcover = await axios.get(coverurl, { validateStatus: false });
    //     //         if (respcover.data && respcover.status == 200) {
    //     //             // console.log(respcover.status)
    //     //             // console.log(respcover.data)
    //     //             music.cover = respcover.data.images[0].image
    //     //         } else {
    //     //             music.cover = "https://dummyimage.com/600x400/000/ffffff&text=No+cover"
    //     //         }
    //     //     }
    //         res.status(200).send(musics)
    //     } else {
    //     res.status(200).send()
    //     }
    

    //} else {
    //    return res.render('login.ejs')
    //}


});
module.exports = router;
