const Aigle = require('aigle');
const scrape = require('scrape-it');
const slugify = require('slugify');
const puppeteer = require('puppeteer');
const fs = require('fs');

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const getBrandsPup = async page => {
  await page.goto('https://watchbase.com/calibers');
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);

  const res = scrape.scrapeHTML(bodyHTML, {
    brands: {
      listItem: 'h3',
      data: {
        url: {
          selector: 'a',
          attr: 'href'
        }
      }
    }
  });

  return res.brands.map(x => x.url);
};

const getBrand = async (url, page) => {
  await timeout(Math.random() * 1000);
  await page.goto(url);
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);

  console.log('GETTING : ', url);

  const res = await scrape.scrapeHTML(bodyHTML, {
    name: {
      selector: 'h1.title'
    },
    image: {
      selector: 'img#brand-logo',
      attr: 'src'
    },
    description: {
      selector: '#description > span'
    },
    url: {
      selector: '#brandurl',
      attr: 'href'
    },
    year: {
      selector: '.brand-box',
      convert: x => {
        const splitted = x.split('Established: ');

        if (!splitted[1]) {
          return undefined;
        }

        return splitted[1].slice(0, 4);
      }
    }
  });

  console.log('res', res);

  return res;
};

const execute = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const brands = await getBrandsPup(page);

  console.log('brands', brands);

  const allBrands = await Aigle.resolve(brands).mapSeries(url =>
    getBrand(url, page)
  );

  const formatted = allBrands.map(brand => ({
    id: slugify(brand.name, {strict: true}).toLowerCase(),
    ...brand
  }));

  fs.writeFile(
    './dataset/brands-calibers.json',
    JSON.stringify(formatted),
    () => {
      console.log('done');
    }
  );
};

execute();
