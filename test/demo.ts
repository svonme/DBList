
// const DB = require('../build/index.js');

// import { list as Data } from './test';
// import Data from "./data.json";

import Data from "./org.json";


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

// import DB from "../src/storage";
import DB from "../build/storage.js";
// const Storage = require("../build/storage.js");

const db = new DB([], "id");
db.insert(Data.data.results);

console.time("like");
const list = db.like({ name: "Organ438" });
console.timeEnd("like");
console.log(list);
console.log("数据量 = %s", db.size());

// import * as util from "../src/util";

// console.log(util.compare("Organization10004380", "IZation1000348", true));


