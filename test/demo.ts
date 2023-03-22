
// const DB = require('../build/index.js');

// import { list as Data } from './test';
// import Data from "./data.json";


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
// const Storage = require("../build/storage.mjs");


// console.time("db");
const db = new Storage([
  { name: '张三', age: 20, sex: '男',hobby: ['上网', '玩游戏'] }, 
  { name: '张六', age: 20, sex: '男', hobby: ['上网', '玩游戏'] }, 
  { name: '李四', age: 20, sex: '男', hobby: ['上网', '唱歌'] }, 
  { name: '王五', age: 20, sex: '男', hobby: ['上网', '玩游戏'] }, 
  { name: '静静', age: 18, sex: '女', hobby: ['游泳', '唱歌'] }, 
  { name: '夏琪', age: 19, sex: '女', hobby: ['游泳', '跳舞'] }, 
  { name: '游勇', age: 22, sex: '男', hobby: ['下棋', '玩游戏'] }
]);
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

// for (let index = 1; index <= 100; index++) {
//   const key = `childrenDeep-${index}`;
//   console.time(key);
//   console.log(db.childrenDeep({pid: 0}));
//   console.timeEnd(key);
// }

console.log(db.siblings({ name: '张三' }) );

