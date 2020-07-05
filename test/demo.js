
const DB = require('../build/index.min.js');

const list = require('./data.json');
// console.log(list);


const db = new DB('test', [], 'id', 'pid', 0);

db.insert(db.flatten(list, 'children'));
// db.insert(list);



const start = new Date().getTime();
const arr = db.childrenDeep({ id: '100' });
// const arr = db.select({ id: 0});
const stop = new Date().getTime();

console.log('DB 数据总条数: %s', db.size());
console.log('select 结果条数: %s', arr.length);
console.log('总耗时: %s毫秒', stop - start);



// console.log(arr);

// console.log(db.data);
// console.log('------Update------');
// db.update({ id: 'A1-1' }, { id: 'A1-1-new' });
// console.log('------Update------');
// console.log(db.data);