const calibers = require('./dataset/calibers3.json');
const uniqBy = require('lodash/uniqBy');
const fs = require('fs');

const c = calibers.map(x => ({...x, id: `${x.brand_id}-${x.id}`}));
const cal = uniqBy(c, 'id');

console.log('ca', cal.length);

// const f = brandsCalibers.filter(x => {
//   const exist = !!brands.find(y => y.id === x.id);
//   return !exist;
// });

fs.writeFile('./dataset/calibers4.json', JSON.stringify(cal), () => {
  console.log('done');
});
