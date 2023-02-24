
// const DB = require('../build/index.js');

import { list as Data } from './test';
// import Data from "./data.json";


// const db = new DB(list);

// const test = db.flatten(list, 'children')

// const keys = db.insert(test);

// console.log(keys);


// const id = db.insert({name: '123'})

// console.log(id);

// console.log(db.clone());

import DB from "../src/index";

const db = new DB(Data);
console.time("data");
db.childrenDeep();
console.timeEnd("data");
console.log(db);





