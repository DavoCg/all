const Aigle = require('aigle');
const scrape = require('scrape-it');
const slugify = require('slugify');
const puppeteer = require('puppeteer');
const fs = require('fs');

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const findValue = (data, key) => {
  const y = data.replace(/\n/g, ' ').replace(/  +/g, '|');
  const z = y.split('|');
  const value = z.find(x => x.includes(key));
  return value && value.split(':')[1];
};

const writeData = urls => {
  return new Promise((res, rej) => {
    fs.readFile('./dataset/models.json', function(err, data) {
      if (err) {
        return rej();
      }

      let json = JSON.parse(data);
      json = [...json, ...urls];

      fs.writeFile('./dataset/models.json', JSON.stringify(json), err => {
        if (err) {
          return rej();
        }
        res();
      });
    });
  });
};

const getWatchesPup = async page => {
  await page.goto('https://watchbase.com/watches');
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);

  const res = scrape.scrapeHTML(bodyHTML, {
    brands: {
      listItem: 'li',
      data: {
        url: {
          selector: 'a.link-color',
          attr: 'href'
        }
      }
    }
  });

  return res.brands.map(x => x.url);
};

const getWatchesList = async (url, page) => {
  await page.goto(url);
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);

  const res = scrape.scrapeHTML(bodyHTML, {
    watches: {
      listItem: '.item-block',
      data: {
        url: {
          selector: '.bottomtext',
          attr: 'href'
        }
      }
    }
  });

  await writeData(res.watches.map(x => x.url).filter(x => x));
  await timeout(Math.random() * 2000);

  return res;
};

const execute = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const w = await getWatchesPup(page);

  const watches = w.filter(x => {
    return (
      x && !x.includes('honeypot') && x.length > 'https://watchbase.com'.length
    );
  });

  const n = watches.slice(202, watches.length);

  await Aigle.resolve(n).mapSeries((url, i) => {
    console.log(`handle ${i + 202}/${watches.length}`);
    return getWatchesList(url, page);
  });
};

execute();
