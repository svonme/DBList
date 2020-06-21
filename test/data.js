
let index = 100;

function app(children) {
  const array = [];
  for(let i = 1; i <= 2; i++){
    array.push({
      id: `${index++}`,
      name: `${i}`,
      children: children < 4 ? app(children + 1) : []
    });
  }
  return array;
}

const list = app(0);

module.exports = list;