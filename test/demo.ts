
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
// import Storage from "../build/storage";
// const Storage = require("../build/storage.umd.cjs");


// console.time("db");
const db = new Storage(Data as any[]);
// console.timeEnd("db");
console.log("size = ", db.size());

// console.time("select");
// const values = db.select({
//   pid: 0
// });
// console.timeEnd("select");
// console.log(values)

// console.time("remove")
// // db.remove({ pid: 0 });
// console.log("size = ", db.size());
// console.timeEnd("remove")

// db.update({
//   id: "100"
// }, {
//   name: "张三"
// });

// console.log(db.select({ id: "100" }));

console.time("childrenDeep");
Promise.resolve(db.parentDeepFlatten()).then(function(value) {
  console.log(value);
  console.timeEnd("childrenDeep");
})


