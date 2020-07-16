const Aigle = require('aigle');
const scrape = require('scrape-it');
const slugify = require('slugify');
const puppeteer = require('puppeteer');
const fs = require('fs');
const uniq = require('lodash/uniq');

const allModels = require('./dataset/models.json');

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const findValue = (data, key, occ = 1) => {
  const y = data.replace(/\n/g, ' ').replace(/  +/g, '|');
  const z = y.split('|').map(x => x.replace(': ', ':'));

  let n = 1;

  const a = z.reduce((acc, curr, i) => {
    const isBase = curr.includes(':');
    const [key, value] = curr.split(':');

    if (key && !!value) {
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

  const occurence = a.reduce((acc, curr, i) => {
    if (curr.includes(key)) {
      acc.push(curr);
    }
    return acc;
  }, []);

  const value = occurence[occ - 1];
  return value && value.split(':')[1].trim();
};

const writeData = caliber => {
  return new Promise((res, rej) => {
    fs.readFile('./dataset/all.json', function(err, data) {
      if (err) {
        return rej();
      }

      const json = JSON.parse(data);
      json.push(caliber);

      fs.writeFile('./dataset/all.json', JSON.stringify(json), err => {
        if (err) {
          return rej();
        }
        res();
      });
    });
  });
};

const getWatch = async (url, page) => {
  await page.goto(url);
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);

  console.log('url', url);

  const res = scrape.scrapeHTML(bodyHTML, {
    picture: {
      selector: '.watch-main-image > a',
      attr: 'href'
    },
    description: {
      selector: '.watch-description > p'
    },
    reference: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Reference');
      }
    },
    brand_id: {
      selector: '.info-table',
      convert: x => {
        const v = findValue(x, 'Brand');
        return slugify(v, {strict: true}).toLowerCase();
      }
    },
    family: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Family');
      }
    },
    name: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Name');
      }
    },
    produced: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Produced');
      }
    },
    limited: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Limited');
      }
    },
    caseMaterial: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Material');
      }
    },
    caseBezel: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Bezel');
      }
    },
    caseShape: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Shape');
      }
    },
    caseGlass: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Glass');
      }
    },
    caseBack: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Back');
      }
    },
    caseDiameter: {
      selector: '.info-table',
      convert: x => {
        const v = findValue(x, 'Diameter');
        return v && parseFloat(v.replace('mm', ''));
      }
    },
    caseHeight: {
      selector: '.info-table',
      convert: x => {
        const v = findValue(x, 'Height');
        return v && parseFloat(v.replace('mm', ''));
      }
    },
    caseLugWidth: {
      selector: '.info-table',
      convert: x => {
        const v = findValue(x, 'Lug Width');
        return v && parseFloat(v.replace('mm', ''));
      }
    },
    caseWR: {
      selector: '.info-table',
      convert: x => {
        const v = findValue(x, 'W/R');
        return v && parseFloat(v.replace('m', ''));
      }
    },
    dialNickname: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Nickname');
      }
    },
    dialColor: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Color');
      }
    },
    dialFinish: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Finish');
      }
    },
    dialMaterial: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Material', 2);
      }
    },
    dialIndexes: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Indexes');
      }
    },
    dialHands: {
      selector: '.info-table',
      convert: x => {
        return findValue(x, 'Hands');
      }
    },
    caliber_id: {
      selector: '.info-table',
      convert: x => {
        const brand = findValue(x, 'Brand');
        const caliber = findValue(x, 'Caliber');
        const v = `${brand} ${caliber}`;
        return slugify(v, {strict: true}).toLowerCase();
      }
    }
  });

  const watch = {
    ...res,
    id: slugify(`${res.brand_id} ${res.reference}`, {
      strict: true
    }).toLowerCase()
  };

  await writeData(watch);
  await timeout(Math.random() * 5000);
};

const execute = async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const allUniq = uniq(allModels);

  const all = require('./dataset/all.json');
  const start = all.length;

  console.log('start', start);

  await Aigle.resolve(allUniq.slice(start, allUniq.length)).eachSeries(
    (url, i) => {
      console.log(`handle ${i + start}/${allUniq.length}`);
      return getWatch(url, page);
    }
  );
};

execute();
