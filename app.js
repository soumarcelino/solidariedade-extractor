const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const NodeCache = require('node-cache');

const oneDayInSeconds = 60 * 60 * 24;
const VOAA_URL = 'https://voaa.me/pages/campanhas-em-destaque';
const KICKANTE_URL = 'https://www.kickante.com.br';
const KICKANTE_URL_EXTRACT = `${KICKANTE_URL}/comunidade`;

const cache = new NodeCache({
  stdTTL: oneDayInSeconds,
  checkperiod: oneDayInSeconds,
});

async function fetchVoaaData() {
  const res = await fetch(VOAA_URL);
  const resText = await res.text();
  return parseRawTextVoaa(resText);
}

function parseRawTextVoaa(text) {
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

async function fetchKickanteData() {
  const res = await fetch(KICKANTE_URL_EXTRACT);
  const resText = await res.text();
  return parseRawTextKickante(resText);
}

function parseRawTextKickante(text) {
  const $ = cheerio.load(text);
  const data = $('.campaign-card-wrapper')
    .map(function () {
      const item = cheerio.load(this);
      const title = item('.field-group-format h3 a').text();
      const city = item('.field-group-format .field-name-field-city').text();
      const description = item(
        '.field-group-format .field-name-field-short-description div .even',
      ).text();
      const link = `${KICKANTE_URL}${item('.field-group-format h3 a').attr(
        'href',
      )}`;
      const image = item('img').attr('src');
      return {title, link,city, description, image};
    })
    .get();

  cache.set('kickante', data);
  return data;
}

app.get('/', async function (req, res) {
  const cacheList = cache.get('list');

  if (cacheList && cacheList.length) {
    res.send(cacheList);
  } else {
    const data = await fetchVoaaData();
    res.send(data);
  }
});

app.get('/kickante', async function (req, res) {
  const cacheList = cache.get('kickante');

  if (cacheList && cacheList.length) {
    res.send(cacheList);
  } else {
    const data = await fetchKickanteData();
    res.send(data);
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
