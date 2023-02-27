
// const DB = require('../build/index.js');

// import { list as Data } from './test';
import Data from "./data.json";


// const db = new DB(list);

// const test = db.flatten(list, 'children')

// const keys = db.insert(test);

// console.log(keys);


// const id = db.insert({name: '123'})

// console.log(id);

// console.log(db.clone());

// import DB from "../src/index";
// import DB from "../build/db";

// const db = new DB(Data);
// console.time("db")
// console.log(db.size());
// console.log(db.childrenDeep());
// console.timeEnd("db");
// console.log(db);

import Storage from "../src/storage";


console.time("db");
const db = new Storage();
db.insert(Data);
console.timeEnd("db");

console.time("select");
const values = db.select({
  pid: 0
});
console.timeEnd("select");
console.log(values)

console.log(db);


