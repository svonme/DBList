
const DB = require('../build/index.js');

const list = require('./test.json');


const db = new DB(list);

const test = db.flatten(list, 'children')

const keys = db.insert(test);

console.log(keys);


const id = db.insert({name: '123'})

console.log(id);

console.log(db.clone());


