
// const DB = require('../build/index.js');

import { list } from './test';
import Data from "./data.json";


// const db = new DB(list);

// const test = db.flatten(list, 'children')

// const keys = db.insert(test);

// console.log(keys);


// const id = db.insert({name: '123'})

// console.log(id);

// console.log(db.clone());

import DB from "../src/index";

console.time("data");
const db = new DB(Data);
console.log(db.childrenDeep());
console.timeEnd("data");

console.log(DB);



