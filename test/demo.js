
const DB = require('../build/index.js');

const list = require('./test.json');


const db = new DB(list);

const test = db.flatten(list, 'children')

db.insert(test);



// const data = db.parentDeep({ id: '104' });


db.empty({id: '102'})

const data = db.clone();



// console.log('time : %s', (end - start) / 1000);



console.log(JSON.stringify(data, null, 2));