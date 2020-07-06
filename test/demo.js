
const DB = require('../build/index.js');

const list = require('./list');
// console.log(list);


const db = new DB('test', [], 'id', 'pid', 0);

// db.insert(db.flatten(list, 'children'));
db.insert(list);


console.log(db.data);

db.update({ id: 'A1' }, { pid: '0-A' });


console.log(db.data);