require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const dns = require('dns')
const urlpraser = require('url');

const { MongoClient } = require('mongodb');
const mySecret = process.env['DB_URL']
const client = new MongoClient(mySecret);
const db = client.db('urlshortner');
const urls = db.collection('urls');



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {

  res.sendFile(process.cwd() + '/views/index.html');
});







// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  console.log(req.body)
  const url = req.body.url
  const dnsLookup = dns.lookup(urlpraser.parse(url).hostname,
    async (err, address) => {
      if (!address) {
        res.json({ error: 'invalid url' })
      } else {
        const urlCount = await urls.countDocuments({});

        const urlDoc = {
          url,
          short_url: urlCount
        }

        await urls.insertOne(urlDoc);
        res.json({
          original_url: url,
          shorturl: urlCount
        });
      }
    });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortURL = req.params.short_url;
  const urlDoc = await urls.findOne({ short_url: +shortURL });
  if (urlDoc) {
    res.redirect(urlDoc.url);
  } else {
    res.json({ error: 'Short URL not found' });
  }
});



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
