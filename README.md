# DBList

对一组有规则的列表数据进行增删改查

`$ npm install @fengqiaogang/dblist`

```
const list = [{
  name: '张三',
  age: 20,
  sex: '男',
  hobby: ['上网', '玩游戏']
}, {
  name: '张六',
  age: 20,
  sex: '男',
  hobby: ['上网', '玩游戏']
}, {
  name: '李四',
  age: 20,
  sex: '男',
  hobby: ['上网', '唱歌']
}, {
  name: '王五',
  age: 20,
  sex: '男',
  hobby: ['上网', '玩游戏']
}, {
  name: '静静',
  age: 18,
  sex: '女',
  hobby: ['游泳', '唱歌']
}, {
  name: '夏琪',
  age: 19,
  sex: '女',
  hobby: ['游泳', '跳舞']
}, {
  name: '游勇',
  age: 22,
  sex: '男',
  hobby: ['下棋', '玩游戏']
}]
```



这样的有规则数据大家都很熟悉，假如我们要想知道数据中包含 age = 19 或者 age = 20 的数据有那些

生成一个 dblist 对象
```
const db = new DBList('db name', list)
或者
const db = new DBList('db name')
db.insert(list)
```

## select 查询

匹配 age = 19 的所有数据
```
db.select({ age: 19 })

[
  { name: '张六', age: 19, sex: '男', hobby: [ '上网', '玩游戏' ] },
  { name: '夏琪', age: 19, sex: '女', hobby: [ '游泳', '跳舞' ] }
]
```

匹配 id = 2 或者 age = 20 的所有数据
```
db.select({ age: [19, 20] });

[
  { name: '张三', age: 20, sex: '男', hobby: [ '上网', '玩游戏' ] },
  { name: '张六', age: 19, sex: '男', hobby: [ '上网', '玩游戏' ] },
  { name: '李四', age: 20, sex: '男', hobby: [ '上网', '玩游戏' ] },
  { name: '夏琪', age: 19, sex: '女', hobby: [ '游泳', '跳舞' ] }
]
```

匹配 age = 19 并且 hobby = 玩游戏 的所有数据
```
db.select({ age: 19, hobby: '玩游戏' });

[
  { name: '张六', age: 19, sex: '男', hobby: [ '上网', '玩游戏' ] }
]
```

---

## insert 添加

添加单条数据

```
const value = { id: 5, value: '重庆' }

db.insert(value)
```

添加多条数据

```
const values = [{ id: 6, value: '上海' },  { id: 7, value: '天津' }]

db.insert(values)
```


## update 修改

把所有 name = 静静 的数据中的 age 修改为 19

```
const where = { name: '静静' }  // 匹配条件
const newData = { age: 19 }     // 修改的数据

db.update(where, newData)
```

## remove 删除

删除 age = 21 的数据

```
const where =   { age: 21 }    // 匹配条件，匹配那些数据需要删除
db.remove(where)
```

删除 name = 夏琪 或者 name = 游勇 的数据

```
const where =   { name: ['夏琪', '游勇'] }
db.remove(where)
```

## flatten 处理递归数据

```
const list = [
  {
    id: 1,
    value: '北京',
    children: [
      {
        id: 2,
        value: '朝阳区',
        children: [
          {
            id: 4,
            value: '三里屯'
          }
        ]
      },
      {
        id: 3,
        value: '东城区'
      }
    ]
  },
  ...
]
```

解构上面的递归结构数据

```
const db = new DBList('db flatten', [], 'id', 'pid')
const data = db.flatten(list, 'children')  // children 为数据结构中的递归字段

[
  { id: 1, value: '北京', pid: 0 },
  { id: 2, value: '朝阳区', pid: 1 },
  { id: 4, value: '三里屯', pid: 2 },
  { id: 3, value: '东城区', pid: 1 }
]

pid 为自动生成的外键关系数据，详情参考下面的介绍

```

## 构造参数

```
new DBList(name, list, primaryKey, foreignKey)
```

|  字段 | 是否可以为空  | 说明  |
| ------------ | ------------ | ------------ |
|  name | 是 | 对象名称 |
|  list | 是 | 实列化时默认执行一次 insert 方法  |
|  primaryKey | 是 | 主键 , 用于标识别当前数据 |
|  foreignKey | 是 | 外键, 用于与哪条数据进行关联 |



## children 查询子级数据

查询 id = 1 的子级数据 (查询所有与 id = 1 有关联的数据)

```
const where = { id: 1 }
db.children(where)

[
  { id: 1, value: '北京' },
  { id: 2, value: '朝阳区' },
  { id: 3, value: '东城区' }
]
```

## parent 查询父级数据

查询 id = 2 的父级数据 (查询所有与 id = 2 有关联的数据)

```
const where = { id: 2 }
db.parent(where)

[
  { id: 2, value: '朝阳区' },
  { id: 1, value: '北京' }
]
```

## childrenDeep 递归查询子级数据

该方法与 children 类似, children 只会查询一层子级数据，childrenDeep 则会进行递归查询

```
const where = { id: 1 }
db.children(where)

[
  { id: 1, value: '北京' },
  { id: 2, value: '朝阳区' },
  { id: 3, value: '东城区' },
  { id: 4, value: '三里屯' }
]
```

## parentDeep 递归查询父级数据

该方法与 parent 类似, parent 只会查询一层父级数据，parentDeep 则会进行递归查询

```
const where = { id: 4 }
db.parent(where)

[
  { id: 4, value: '三里屯' }
  { id: 2, value: '朝阳区' },
  { id: 1, value: '北京' }
]
```

## clone 复制

执行 clone 时会返回一个正常的 Array 数据

```
const list = db.clone()
```

执行 clone 时处理每一条数据

```
const list = db.clone(item => {
	// todo
	return item;
});
```

## like 模糊查询

查询 value 中带 `北` 的数据

```
const where = { value: '北' }
db.link(where)

[
  { id: 1, value: '北京' }
]
```

## selectOne 查询

selectOne 与 select 使用上一样的，selectOne 在匹配到一条数据后则会停止匹配。该方法返回的为数据本身，非数组

查询 id = 5 的数据
```
const where = { id: 5 }

db.selectOne(where) 
{ id: 5, value: '重庆' }
```
如果我们已知需要查询的数据只会存在一条时可以设置查询条数, 尽可能减少匹配次数
```
const where = { id: 5 }

db.select(where, 1)
[
  { id: 5, value: '重庆' }
]
```