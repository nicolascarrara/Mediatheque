var express = require('express');
const session = require('express-session');
var router = express.Router();
const mongodb = require('mongodb')
const cheerio = require("cheerio");
const axios = require("axios");
var googlebooks = require('google-books-search');
var path = require('path')
const amazonScraper = require('amazon-buddy');
var isbnapi = require('node-isbn');
var multiIsbn = require('multi-isbn')
const goodreads = require('goodreads-api-node');

router.use(express.urlencoded({extended: true}));
//const siteUrl = "https://www.chasse-aux-livres.fr/prix/2353150330";
const siteUrl = "https://www.chasse-aux-livres.fr/prix/";

const myCredentials = {
  key: '8gF52Fial0ZVkgEZz9RQhA',
  secret: 'xEKgzcWuJDGmynvOKyjq43l9cZiDsSCOdpKpuxkg'
};

const gr = goodreads(myCredentials);

const fs = require('fs')
var amzlink='https://www.amazon.fr/s?k=<SEARCHPARAM>&i=stripbooks'
const puppeteer = require('puppeteer');

let request = require('request')
let pathfile = '';
router.use('/public', express.static('public'));


let searchgoodread = function(data){
  return gr.searchBooks( { q: data, page: 1, field: 'all' } ).then(books => { return books } );
}


let searchgoodreadid = function(data){
  return gr.showBook( data ).then(books => { return books } );
}

/*boookres.then(function(result) {
   console.log(result.search.results.work.best_book) // "Some User token"
   let bookdetail=searchgoodreadid(result.search.results.work.best_book.id._)
   bookdetail.then(function(resultat){
     console.log(resultat)
   })

})*/


const download = (url, path, callback) => {
  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback)
  })
}

//getGoogleList('La france orange mécanique')

async function getGoogleList(title){
    return new Promise((resolve,reject) => {
          var options = {
      key: 'AIzaSyCswLhqNjNb3STLR0xp__BvlMs4-1LS46I',
      field: 'title',
      offset: 0,
      limit: 5,
      type: 'books',
      order: 'relevance',
      lang: 'fr'
    };
    googlebooks.search(title, options, function(error, results) {
        if ( ! error ) {
            resolve(results)
        } else {
            reject(error);
        }
    })
});
}

router.post('/goodreadslist', async function(req, res, next) {
  isbn=req.body.isbn;
  title=req.body.title;
  let boookres = searchgoodread(title)

  boookres.then(function(result) {
     res.status(200).send(result.search.results.work);
   })
});

router.post('/goodreadsdetails', async function(req, res, next) {
  id=req.body.id;
  let bookdetail=searchgoodreadid(id)
  bookdetail.then(function(result){
    res.status(200).send(result);
  })

});

router.post('/submitadvanced', async(req, res,next) => {
  pathfile = './public/images/';
  book=new Book();
  book.title=req.body.title
  book.state=req.body.status
  book.cover=req.body.cover
  book.median=req.body.median
  book.genre=req.body.genre
  book.resume=req.body.resume
  book.link=req.body.categorie
  book.amazon=req.body.amazon
  book.author=req.body.auteur
  book.date=req.body.datesortie
  book.collection=req.body.collection
  book.page=req.body.pages
  book.format=req.body.format
  book.editor=req.body.editeur
  book.language=req.body.langue
  book.isbn10=req.body.isbn10
  book.isbn13=req.body.isbn13
  book.price=req.body.price
  book.size=req.body.size
  pathfile=pathfile+(book.isbn10)+(book.isbn13)+(path.extname(req.body.cover));
  book.cover=pathfile;


  //console.log(book);
  db.collection('books').save({book}, function(err, r) {
    if (err) {
      res.redirect('/addbookadvanced')
      res.status(500).send()
    }
    else{
      try {
      if (fs.existsSync(pathfile)) {
          console.log('image deja dl')
          res.redirect('/')
          //res.status(200).send(r)
         }else{
          download(req.body.cover, pathfile, () => {
          console.log('✅ Done!')
          res.redirect('/')
          //res.status(200).send(r)

        })
        }
      } catch(err) {
        res.redirect('/addbookadvanced')
        console.error(err)
      }


    }
  });
console.log(book);
});

router.post('/isbnlook', async function(req, res, next) {
  isbn=req.body.isbn;
    multiIsbn.init()
    multiIsbn.find(isbn, function(err, data) {
      if (err) throw err
      console.log(data)
      res.status(200).send(data);
    })
  /*isbn=req.body.isbn;
  isbnapi.provider(['openlibrary', 'google'])
    .resolve(isbn)
    .then(function (book) {
      console.log('Book found %j', book);
      res.status(200).send(book);

    }).catch(function (err) {
        console.log('Book not found', err);
        res.status(200).send(err);

    });*/


});

router.post('/googlelist', async function(req, res, next) {
  isbn=req.body.isbn;
  title=req.body.title;
  temp =  await getGoogleList(title);
  res.status(200).send(temp);

});



async function GetAmzList(isbn,title,more=null){
  param=isbn+' '+title;

  console.log(param)
  const products = await amazonScraper.products({ keyword: param, number: 5,country:"FR",category:"stripbooks"});
  console.log(products);
  return products
}

async function GetAmzDetails(asin){
  const products = await amazonScraper.asin({ asin: asin,country:"FR",cookie: 'session-id=259-8824684-0327260;session-id-time=2082754801l;i18n-prefs=EUR;ubid-acbfr=261-0383941-1165459;csm-hit=tb:6NCDP6Z82Q5H2Q86NDQE+s-P53C2Q0RJ4QM16QZKTN4|1605534596251&t:1605534596251&adb:adblk_yes;session-token=45TkyhDcd5q4yICzs8wKcr5+tt8jgbGyBFQCGTZeJn8mJ+JadIej6WENTiJ5HaT6s84iin0wJPFR+aSgvFzEfOXN0XELzC3EgkZ8czMsUZg/pcFBN792ntN4pMtoC9domQNktpbPlmoPJIMHWjOngoAJjH/JNI3WbNiyJA7FYhDItbIlSF6Uhuq24yqkakiD'});
  console.log(products);
  return products
}

router.post('/amzdetails', async function(req, res, next) {
  asin=req.body.asin;
  temp = await GetAmzDetails(asin);
  console.log(temp)
  res.status(200).send(temp);

});

router.post('/amzlist', async function(req, res, next) {
  isbn=req.body.isbn;
  title=req.body.title;
  temp = await GetAmzList(isbn,title);
  console.log(temp)
  res.status(200).send(temp);

});
class Book {
  constructor(title=null,state=null,cover=null,median=null,genre=null,resume=null,link=null,author=null,date=null,collection=null,page=null,format=null,editor=null,language=null,isbn10=null,isbn13=null,price=null,size=null) {
    this.title=title;
    this.state=state;
    this.cover=cover;
    this.media=median;
    this.genre=genre;
    this.resume=resume;
    this.link=link;
    this.author=author;
    this.date=date;
    this.collection=collection;
    this.page=page;
    this.format=format;
    this.editor=editor;
    this.language=language;
    this.isbn10=isbn10;
    this.isbn13=isbn13;
    this.price=price;
    this.size=size;
  }
}
let bookName = "";
router.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}))

const MongoClient = mongodb.MongoClient
var db
var sess
MongoClient.connect
/*
('mongodb+srv://nico:zG55iE3MuExHtrCZ@cluster0.blsp1.mongodb.net/biblio?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }, (err, database) => {
//MongoClient.connect('mongodb://nico:zG55iE3MuExHtrCZ@localhost/biblio?authSource=biblio&w=1', (err, database) => {
  if (err) return console.log(err)
  db = database
  console.log('connection bdd OK')
})
*/


MongoClient.connect('mongodb+srv://nico:zG55iE3MuExHtrCZ@cluster0.blsp1.mongodb.net?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  //MongoClient.connect('mongodb://nico:zG55iE3MuExHtrCZ@localhost/biblio?authSource=biblio&w=1', (err, database) => {
  if (err) return console.log(err)
  db = client.db('biblio');
  console.log('connection bdd OK')

})



/* GET home page. */
router.get('/', async function(req, res, next) {

  sess=req.session
 if(sess.login){

   const { page = 1, limit = 12,genre='' } = req.query;

   let Books = db.collection('books')
   //res.render('index', { title: 'Express' });
   Books.find({"book.genre": {'$regex': genre, '$options': 'i'} }).limit(limit ).skip((page - 1) * limit).toArray(function(err, result) {
     if (err) throw err;
   //console.log(result);
   let pricesum='';

   Books.aggregate([{
            "$group" : {
               "_id" : "$book.genre",
               "totalPrice": { "$sum":"$book.price"},
               "totalMedianPrice": {"$sum":"$book.median"},
               "count": { "$sum": 1 }
            }
       }],function(err, priceresult){
  console.log(err)
  console.log(priceresult)
  listeprix=[]
  listeprix["count"]=0
  listeprix["totalPrice"]=0
  listeprix["totalMedianPrice"]=0
  if (genre=='') {
    priceresult.forEach(function(i){
        listeprix["count"]=listeprix["count"]+i.count
        listeprix["totalPrice"]=listeprix["totalPrice"]+i.totalPrice
        listeprix["totalMedianPrice"]=listeprix["totalMedianPrice"]+i.totalMedianPrice
    });
  }else{
   str=genre
   console.log(genre)
   console.log(str)
   listeprix = priceresult.find(element => element._id.match(str) );
   console.log(listeprix)
  }

  return res.render('index', {books: result,price:listeprix,totalPages: Math.ceil(listeprix.count / limit),genre:genre,listgenre:priceresult,currentPage: page, sess: sess.login})
  });

   })
 }else{
  return res.render('login.ejs')
 }

});

router.post('/inscription', (req, res) => {
  console.log(req.body)
  db.collection('users').insertOne(req.body, (err, result) => {
    if (err) {
      console.log(err)
      return res.render('login.ejs',{inscription: 'false'})}
    else{
      console.log('Enregistré dans la bdd')
      return res.render('login.ejs',{inscription: 'true'})
    }
  })
})

router.post('/delete', (req, res) => {
  db.collection("books").findOne({_id: new mongodb.ObjectID(req.body.id)}, function(err, result) {
    if (err){
       console.log(e)
    }else{
      console.log(result)

      fs.unlinkSync(result.book.cover)
      console.log(result)
    }
  });
  db.collection('books').remove({_id: new mongodb.ObjectID(req.body.id)},{ justOne: true }, (err, result) =>{
    if (err) return console.log(err)

    res.status(200).send(JSON.stringify({'id':req.body.id}))
  })
 })

 router.get('/details', (req, res) => {
   sess=req.session
   if(sess.login){
   db.collection("books").findOne({_id: new mongodb.ObjectID(req.query.id)}, function(err, result) {
     if (err){
        console.log(e)
     }else{
        return res.render('details',{book: result, sess: sess.login})
     }
   });
 }else{
   return res.render('login.ejs')
 }
 })

 router.get('/addbookadvanced', (req, res) => {
   sess=req.session
   if(sess.login){
        return res.render('advanced',{sess:sess.login})
      }else{
   return res.render('login.ejs')
 }
 })

router.post('/addbook', async(req, res) => {
  pathfile = './public/images/';
  sess=req.session
  if(sess.login){
//    axios.get(siteUrl+req.body.isbn)
  //   .then((response) => {
  puppeteer
    .launch({ args: ['--no-sandbox'] })
    .then(browser => browser.newPage())
    .then(page => {
      console.log(req.body.isbn);
      return page.goto(siteUrl+req.body.isbn, { waitUntil: 'networkidle0' }).then(function() {
        return page.content();
      });
    }).then(response => {
        let book = new Book();
         book.state="0";
         let $ = cheerio.load(response);
         if ($('script[type="application/ld+json"]').contents()[0]) {
           jsoninfo=($('script[type="application/ld+json"]').contents()[0].data);
           if (jsoninfo.offers) {
             console.log(JSON.parse(jsoninfo))
             lowPrice=JSON.parse(jsoninfo).offers.lowPrice;
             highPrice=JSON.parse(jsoninfo).offers.highPrice;
             avgprice=(parseFloat(lowPrice)+parseFloat(highPrice))/2;
           }else {
             minprice=$('div#recap a.used-price').text();
             minprice == undefined ? avgprice=undefined : avgprice=minprice;
           }

         }else{
           minprice=$('div#recap a.used-price').text();
           minprice == undefined ? avgprice=undefined : avgprice=minprice;
         }

         let lienamz=$('a.salesrank-link').attr('href');
         book.amazon=lienamz;
         //axios.get(lienamz)
          //.then((response) => {
            //  let $ = cheerio.load(response.data);
              //console.log($('.a-padding-small:nth-child(2) .a-divider-inner').first().text());
            //})
         let title = $('div#book-details div#book-title-and-details h1').text();
         if ($('div#book-details div#book-title-and-details h2:not(#creators)').text()){
           book.title=title+" - "+$('div#book-details div#book-title-and-details h2:not(#creators)').text();
         }else {
           book.title=title;
         }

         let cover = $('div#cover div.coverPlusBtnsCont img#book-cover').attr('src');
         if (cover.includes("_SX150_")) {
           cover=cover.replace("_SX150_", "");
         }

         let genre =$('ul.breadcrumb.breadcrumb-top.d-none.d-md-inline-block li a:nth-child(3)').text();
         book.genre=genre;
         if (book.genre=="") {
           book.genre='Inconnu'
         }
         let resume = $('div#resumeCont2').text();
         book.resume=resume;
         console.log($('div#resumeCont2').text());
         let link=$('ul.breadcrumb.breadcrumb-top.d-none.d-md-inline-block li a:last-child').text();
         book.link=link;
         let auteur=$('h2#creators a.alink').text();
         book.author=auteur;
         let medianprice=$('div#price-infos.card.mb-3 ul.list-unstyled li:nth-child(1)').text().split(':')[1];
         console.log(medianprice);
         medianprice == undefined ? medianprice=avgprice : medianprice=medianprice.trim();
         //console.log($('tr:nth-child(1) .used-price').first());

         medianprice == undefined ? medianprice=0 : medianprice=parseFloat(medianprice.split('€')[0].trim().replace(',','.'));
         console.log(medianprice);
         book.median=medianprice;
         let formatpages=$('div#book-more-more-details-mobile div.container.p-0 div.row div.col').first().text().split(',');
         //console.log(formatpages[1].split(' ')[1].trim());
         //console.log(formatpages[0].split(':')[1].trim())
         let test=$('div#book-more-more-details-mobile div.container.p-0 div.row div.col');
         test.each(function(i, elem) {
         select=$(this).text().trim().substr(0,7);
         //console.log(select);

        //console.log($(this).text().trim());
        switch (select.trim()) {
          case 'Format':
            splitted=$(this).text().trim().split(',');
            if (splitted[1]) {
              book.page=splitted[1].split(' ')[1].trim();
              book.format=splitted[0].split(':')[1].trim()
            }else {
              book.page=0;
              book.format='Non renseigné';
            }

            break;
          case 'Date de':
            splitted=$(this).text().trim().split(':');
            book.date=splitted[1].split(' ').pop().trim();
            //console.log(splitted[0].split(':')[1].trim())
            break;
          case 'Collect':
            splitted=$(this).text().trim().split(':');
            book.collection=splitted[1].trim();
            break;
          case 'Éditeur':
            splitted=$(this).text().trim().split(':');
            book.editor=splitted[1].trim();
            break;
          case 'Langue':
          splitted=$(this).text().trim().split(':');
          book.language=splitted[1].trim();
            break;
          case 'ISBN-10':
          splitted=$(this).text().trim().split(':');
          book.isbn10=splitted[1].trim();
            break;
          case 'ISBN-13':
          splitted=$(this).text().trim().split(':');
          book.isbn13=splitted[1].trim();
            break;
          case 'Prix éd':
          splitted=$(this).text().trim().split(':');
          book.price=parseFloat(splitted[1].trim().split(' ')[0].replace(',','.'));
            break;
          case 'Dimensi':
          splitted=$(this).text().trim().split(':');
          book.size=splitted[1].trim();
            break;

          default:
        }
  });
  pathfile=pathfile+(book.isbn10)+(book.isbn13)+(Math.random().toString(36).slice(-10))+(path.extname(cover));
  book.cover=pathfile;
  console.log(pathfile);



  //console.log(book);
  db.collection('books').insertOne({book}, function(err, r) {
    if (err) {
      res.status(500).send()
    }
    else{
      try {
      if (fs.existsSync(pathfile)) {
          console.log('image deja dl')
        res.status(200).send(r.ops[0])
         }else{
          download(cover, pathfile, () => {
          console.log('✅ Done!')
          res.status(200).send(r.ops[0])
        })
        }
      } catch(err) {
        console.error(err)
      }


    }
  });
     }).catch(function (e) {
       console.log(e);
       res.status(500).send()

     console.log('isbn non trouvé');

    // return res.render('index.jade', {error: 'Livre introuvable !', sess: sess.login})
  });

  }else{
    return res.render('login.ejs')
  }
})

router.post('/updateinprogress', (req, res) => {
  console.log(req.body.id);
 var myquery = { _id: new mongodb.ObjectID(req.body.id)};
 var newvalues = { $set: {"book.state" : "2" }};
 db.collection('books').findAndModify(myquery, [] ,newvalues,
        {new:true}, function(err, book) {
   if (err) throw err;
   //console.log(book.value);
 res.status(200).send(book.value)  //  return res.send(book);
   console.log("1 livre mis a jour");
 });
});

router.post('/updatelu', (req, res) => {
  console.log(req.body.id);
 var myquery = { _id: new mongodb.ObjectID(req.body.id)};
 var newvalues = { $set: {"book.state" : "1" }};
 db.collection('books').findAndModify(myquery, [] ,newvalues,
        {new:true}, function(err, book) {
   if (err) throw err;
   console.log(book);
          res.status(200).send(book.value)  //  return res.send(book);
   console.log("1 livre mis a jour");
 });

});

router.post('/updatealire', (req, res) => {
  console.log(req.body.id);
 var myquery = { _id: new mongodb.ObjectID(req.body.id)};
 var newvalues = { $set: {"book.state" : "0" }};
 db.collection('books').findAndModify(myquery, [] ,newvalues,
        {new:true}, function(err, book) {
   if (err) throw err;
   console.log(book);
          res.status(200).send(book.value)  //  return res.send(book);
   console.log("1 livre mis a jour");
 });
});

router.post('/login', (req, res) => {
  var myquery = { login: req.body.login, password: req.body.password};
  db.collection("users").findOne(myquery, function(err, result) {
    if (err){
     return res.render('login.ejs',{connexion: 'false'})
    }else{
      sess=req.session;
      sess.login=req.body.login;
      res.redirect('/')
    }
  });
})

router.get('/logout',function(req,res){
    req.session.destroy(function(err){
        if(err){console.log(err)}
        else{res.redirect('/')}
    })
})

module.exports = router;
