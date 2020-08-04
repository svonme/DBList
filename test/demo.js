
const DB = require('../build/index.js');

const list = require('./test.json');
// console.log(list);

const db = new DB('test', [], 'id', 'pid', 0);

const test = db.flatten(list, 'children')


db.insert(test);


// const data = db.parentDeep({ id: '104' });


const data = db.childrenDeep({ id: '100' });



// console.log('time : %s', (end - start) / 1000);


console.log(JSON.stringify(data, null, 2));