
const list = require("./data.json");
const DB = require("../build/storage.umd");
console.time("DB");
const db = new DB(list, "id", "pid");
console.timeEnd("DB");
console.log(db.select());