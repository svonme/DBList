
const list = [
  {
    name: '张三',
    age: 20,
    sex: '男',
    hobby: [ '上网', '玩游戏' ],
    id: 'A1',
  },
  {
    name: '夏琪',
    age: 19,
    sex: '女',
    hobby: [ '游泳', '跳舞' ],
    id: 'A2',
  },
  {
    name: '游勇',
    age: 22,
    sex: '男',
    hobby: [ '下棋', '玩游戏' ],
    id: 'A3',
  },
  {
    name: '张六',
    age: 20,
    sex: '男',
    hobby: [ '上网', '玩游戏' ],
    id: 'A1-1',
    pid: ['A1', 'A2']
  },
  {
    name: '李四',
    age: 20,
    sex: '男',
    hobby: [ '上网', '唱歌' ],
    id: 'A1-2',
    pid: 'A1'
  },
  {
    name: '王五',
    age: 20,
    sex: '男',
    hobby: [ '上网', '玩游戏' ],
    id: 'A1-1-1',
    pid: 'A1-1'
  },
  {
    name: '静静',
    age: 18,
    sex: '女',
    hobby: [ '游泳', '唱歌' ],
    id: 'A1-2-1',
    pid: 'A1-2'
  }
];

module.exports = list;