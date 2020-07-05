
let index = 100;

function app1() {
  const array = [];
  for(let i = 1; i <= 50; i++){
    array.push({
      id: `${index++}`,
      name: `${i}`
    });
  }
  return array;
}

function app() {
  const array = [];
  for(let i = 1; i <= 50; i++){
    array.push({
      id: `${index++}`,
      name: `${i}`,
      children: app1()
    });
  }
  return array;
}

const list = app();

module.exports = list;