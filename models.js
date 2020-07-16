const Aigle = require('aigle');
const scrape = require('scrape-it');
const flatten = require('lodash/flatten');
const fetch = require('node-fetch');
const fs = require('fs');

const getModels = async brand => {
  const {data} = await scrape(`https://watchbase.com/${brand}`, {
    models: {
      listItem: '.listed',
      data: {
        url: {
          selector: '.link-color',
          attr: 'href'
        }
      }
    }
  });

  return data.models.map(x => x.url).filter(x => x);
};

const getWatches = async url => {
  const {data} = await scrape(url, {
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

  return data.watches.map(x => x.url).filter(x => x);
};

const getWatch = async url => {
  const html = await fetch(url).then(res => res.text());

  const data = scrape.scrapeHTML(html, {
    brand: {
      selector: 'td',
      eq: 0
    },
    family: {
      selector: 'td',
      eq: 2
    },
    reference: {
      selector: 'td',
      eq: 2
    },
    name: {
      selector: 'td',
      eq: 3
    },
    year: {
      selector: 'td',
      eq: 4
    },
    limited: {
      selector: 'td',
      eq: 5,
      convert: x => {
        return x === 'Yes' ? true : false;
      }
    },
    caseMaterial: {
      selector: 'td',
      eq: 6
    },
    caseGlass: {
      selector: 'td',
      eq: 7
    },
    caseBack: {
      selector: 'td',
      eq: 8
    },
    caseShape: {
      selector: 'td',
      eq: 9
    },
    caseDiameter: {
      selector: 'td',
      eq: 10
    },
    caseHeight: {
      selector: 'td',
      eq: 11
    },
    caseWr: {
      selector: 'td',
      eq: 12
    },
    dialColor: {
      selector: 'td',
      eq: 13
    },
    dialMaterial: {
      selector: 'td',
      eq: 14
    },
    dialFinish: {
      selector: 'td',
      eq: 15
    },
    dialIndexes: {
      selector: 'td',
      eq: 16
    },
    dialHands: {
      selector: 'td',
      eq: 17
    },
    movementType: {
      selector: 'td',
      eq: 18
    },
    movementBrand: {
      selector: 'td',
      eq: 19
    },
    movementCaliber: {
      selector: 'td',
      eq: 20
    },
    movementDisplay: {
      selector: 'td',
      eq: 21
    },
    movementDiameter: {
      selector: 'td',
      eq: 22
    },
    movementJewels: {
      selector: 'td',
      eq: 23
    },
    movementReserve: {
      selector: 'td',
      eq: 24
    },
    movementFrequency: {
      selector: 'td',
      eq: 25
    },
    movementTime: {
      selector: 'td',
      eq: 26
    }
  });

  return data;
};

const brands = ['bereve'];

const execute = async () => {
  const models = await Aigle.resolve(brands).map(getModels);
  const modelsList = flatten(models);
  const watches = await Aigle.resolve(modelsList).map(getWatches);
  const watchesList = flatten(watches);

  console.log('watchesList', watchesList);

  const items = await Aigle.resolve(watchesList).map(getWatch);
  const itemsList = flatten(items);

  console.log('itemsList', itemsList);
};

execute();
