const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function fetchData() {
  const res = await fetch('https://voaa.me/pages/campanhas-em-destaque');
  const resText = await res.text();
  return parseRawText(resText);
}

function parseRawText(text) {
  const $ = cheerio.load(text);
  const data = $('.card-deck .card')
    .map(function () {
      const item = cheerio.load(this);
      const title = item('.card-title a').text();
      const link = item('.card-title a').attr('href');
      const description = item('.card-description').text();
      return {title, link, description};
    })
    .get();
  return data;
}

app.get('/', async function (req, res) {
  const data = await fetchData()
  res.send(data)
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
