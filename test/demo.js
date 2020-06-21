
const DB = require('../build/index.min.js');

const db = new DB('test', [], 'id', 'pid', 0);
const list = db.flatten(require('./data'), 'children');
db.insert(list);

console.log('length : %s', list.length);
const start = new Date().getTime();
const deep = db.childrenDeep({ 'id': '100' });
console.log(deep);
const end = new Date().getTime();
console.log('deep : %s豪秒', (end - start));

console.log(db.parentDeep({ id: '159' }));


console.log(db.like({ name: '2' }));

