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
  const z = y.split('|').map(x => x.replace(': ', ':'));

  let n = 1;

  const a = z.reduce((acc, curr, i) => {
    const isBase = curr.includes(':');
    const [key, value] = curr.split(':');

    if (key && value) {
      acc.push(curr);
      return acc;
    }

    if (isBase && !value) {
      acc.push(curr);
      return acc;
    }

    if (!isBase && !value) {
      acc[i - n] = `${acc[i - n]} ${curr}`;
      n = n + 1;
      return acc;
    }
  }, []);

  const value = a.find(x => x.includes(key));
  return value && value.split(':')[1].trim();
};

const writeData = caliber => {
  return new Promise((res, rej) => {
    fs.readFile('./dataset/calibers3.json', function(err, data) {
      if (err) {
        return rej();
      }

      const json = JSON.parse(data);
      json.push(caliber);

      fs.writeFile('./dataset/calibers3.json', JSON.stringify(json), err => {
        if (err) {
          return rej();
        }
        res();
      });
    });
  });
};

const getCalibersPup = async page => {
  await page.goto('https://watchbase.com/calibers');
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

const getCaliber = async (url, page) => {
  await page.goto(url);
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  const res = await scrape.scrapeHTML(bodyHTML, {
    picture: {
      selector: '.caliber-main-image > a',
      attr: 'href'
    },
    description: {
      selector: '.caliber-description > p'
    },
    brand_id: {
      selector: '.info-table',
      convert: x => {
        const v = findValue(x, 'Brand');
        return slugify(v, {strict: true}).toLowerCase();
      }
    },
    base: {
      selector: '.info-table',
      convert: x => {
        const v = findValue(x, 'Base');
        if (!v) return null;
        return slugify(v, {strict: true}).toLowerCase();
      }
    },
    reference: {
      selector: '.info-table',
      convert: x => findValue(x, 'Reference')
    },
    movement: {
      selector: '.info-table',
      convert: x => findValue(x, 'Movement')
    },
    display: {
      selector: '.info-table',
      convert: x => findValue(x, 'Display')
    },
    diameter: {
      selector: '.info-table',
      convert: x => findValue(x, 'Diameter')
    },
    jewels: {
      selector: '.info-table',
      convert: x => findValue(x, 'Jewels')
    },
    reserve: {
      selector: '.info-table',
      convert: x => findValue(x, 'Reserve')
    },
    frequency: {
      selector: '.info-table',
      convert: x => findValue(x, 'Frequency')
    },
    date: {
      selector: '.info-table',
      convert: x => findValue(x, 'Date')
    },
    chronograph: {
      selector: '.info-table',
      convert: x => findValue(x, 'Chronograph')
    },
    hands: {
      selector: '.info-table',
      convert: x => findValue(x, 'Hands')
    },
    astronomical: {
      selector: '.info-table',
      convert: x => findValue(x, 'Astronomical')
    },
    acoustic: {
      selector: '.info-table',
      convert: x => findValue(x, 'Acoustic')
    },
    additionals: {
      selector: '.info-table',
      convert: x => findValue(x, 'Additionals')
    }
  });

  const caliber = {
    ...res,
    id: slugify(res.reference, {strict: true}).toLowerCase(),
    diameter: parseFloat(res.diameter),
    jewels: parseInt(res.jewels),
    reserve: parseInt(res.reserve),
    frequency: parseInt(res.frequency)
  };

  await writeData(caliber);
  await timeout(Math.random() * 2000);
};

const execute = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const c = await getCalibersPup(page);

  const calibers = c.filter(x => {
    return x && !x.includes('honeypot') && x.includes('caliber');
  });

  const n = calibers.slice(1696, calibers.length);

  await Aigle.resolve(n).eachSeries((url, i) => {
    console.log(`handle ${i + 1696}/${calibers.length}`);
    return getCaliber(url, page);
  });
};

execute();
