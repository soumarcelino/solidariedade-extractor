const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const NodeCache = require('node-cache');

const oneDayInSeconds = 60 * 60 * 24;
const VOA_URL = 'https://voaa.me/pages/campanhas-em-destaque';

const cache = new NodeCache({
  stdTTL: oneDayInSeconds,
  checkperiod: oneDayInSeconds,
});

async function fetchData() {
  const res = await fetch(VOA_URL);
  const resText = await res.text();
  return parseRawText(resText);
}

function parseRawText(text) {
  const $ = cheerio.load(text);
  const data = $('.card-deck .card')
    .map(function () {
      const item = cheerio.load(this);
      const title = item('.card-title a').text();
      const description = item('.card-description').text();
      const link = item('.card-title a').attr('href');
      const image = item('img').attr('src');
      return {title, link, description, image};
    })
    .get();

  cache.set('list', data);
  return data;
}

app.get('/', async function (req, res) {
  const cacheList = cache.get('list');

  if (cacheList && cacheList.length) {
    res.send(cacheList);
  } else {
    const data = await fetchData();
    res.send(data);
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
