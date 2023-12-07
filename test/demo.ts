
// const DB = require('../build/index.js');

// import { list as Data } from './test';
// import Data from "./data.json";

import Data from "./org.json";
// import Data from "./data.json";
// import Data from "./demo.json";

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

import DB from "../src";

const db = new DB([]);
// db.insert({
//   "deptId": 0,
//   "deptName": "新增租户03",
//   "deptIcon": null,
//   "deptColor": null,
//   "haveSub": 0,
//   "subList": null
// }, "subList");

// db.insert(Data)
db.insert(Data.data.results, "subList")

// console.time("like");
// const list1 = db.like({ name: "O 100" }, 10000);
// console.timeEnd("like");
// console.log(list1);

// console.time("select");
// const list2 = db.select({ name: "Organization10000438" });
// console.timeEnd("select");
// console.log(list2);

console.time("childrenDeep");
const res = db.childrenDeep();
console.timeEnd("childrenDeep");
console.log(res);


console.log("数据量 = %s", db.size());

// import * as util from "../src/util";

// console.log(util.compare("Organization10004380", "IZation1000348", true));


