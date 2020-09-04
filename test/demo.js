
const DB = require('../build/index.js');

// const list = require('./test.json');
// console.log(list);

const list = [
    {
        id: '101',
        name: 'aaa12313'
    }, {
        id: '102',
        name: 'hjklsdas'
    }
]

const db = new DB(list);

// const test = db.flatten(list, 'children')


// db.insert(test);


const where = { id: '101' }

console.log(JSON.stringify(db.select(where), null, 2));

db.update(where, {
    name: '你好'
})

console.log(JSON.stringify(db.select(where), null, 2));


console.log(db.data)

// const data = db.parentDeep();


// const data = db.childrenDeep({ id: '100' });



// console.log('time : %s', (end - start) / 1000);



// console.log(JSON.stringify(data, null, 2));