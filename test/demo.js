
const DB = require('../build/index.min.js');

const list = require('./data.json');
// console.log(list);


const db = new DB('test', [], 'id', 'pid', 0);

db.insert(db.flatten(list, 'children'));
// db.insert(list);


// console.log(db.data);

// db.update({ id: 'A1' }, { pid: '0-A' });

const start = new Date().getTime();
const temp = db.childrenDeep({ id: '100' });



// console.log(JSON.stringify(temp, null, 2));

console.log('----------');

const demo = new DB('test', [], 'id', 'pid', 0);
demo.insert(demo.flatten(temp, 'parent'));

// console.log(JSON.stringify(demo.childrenDeep({ id: '100' }), null, 2));

const end = new Date().getTime();

console.log('time : %s', (end - start) / 1000);
