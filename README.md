# DBList

对一组有规则的列表数据进行增删改查

`$ npm install @fengqiaogang/dblist`

```
const list = [
  { name: '张三', age: 20, sex: '男',hobby: ['上网', '玩游戏'] }, 
  { name: '张六', age: 20, sex: '男', hobby: ['上网', '玩游戏'] }, 
  { name: '李四', age: 20, sex: '男', hobby: ['上网', '唱歌'] }, 
  { name: '王五', age: 20, sex: '男', hobby: ['上网', '玩游戏'] }, 
  { name: '静静', age: 18, sex: '女', hobby: ['游泳', '唱歌'] }, 
  { name: '夏琪', age: 19, sex: '女', hobby: ['游泳', '跳舞'] }, 
  { name: '游勇', age: 22, sex: '男', hobby: ['下棋', '玩游戏'] }
]
```

这样的有规则数据大家都很熟悉，假如我们要想知道数据中包含 age = 19 或者 age = 20 的数据有那些

生成一个 dblist 对象
```
const db = new DBList(list)
或者
const db = new DBList()
db.insert(list)
```

## select 查询

匹配 age = 19 的所有数据
```
db.select({ age: 19 })

[
  { name: '夏琪', age: 19, sex: '女', hobby: [ '游泳', '跳舞' ] }
]
```

匹配 age = 19 或者 age = 20 的所有数据
```
db.select({ age: [19, 20] });

[
  { name: '张三', age: 20, sex: '男',hobby: ['上网', '玩游戏'] }, 
  { name: '张六', age: 20, sex: '男', hobby: ['上网', '玩游戏'] }, 
  { name: '李四', age: 20, sex: '男', hobby: ['上网', '唱歌'] }, 
  { name: '王五', age: 20, sex: '男', hobby: ['上网', '玩游戏'] },
  { name: '夏琪', age: 19, sex: '女', hobby: ['游泳', '跳舞'] }
]
```

匹配 age = 18 并且 sex = 女 的所有数据
```
db.select({ age: 18, sex: '女' });

[
  { name: '静静', age: 18, sex: '女', hobby: ['游泳', '唱歌'] }
]
```

---

## insert 添加

添加数据

```
const value = { id: 5, value: '重庆' }

const key: number[] = db.insert(value) // 返回该条元素的唯一键值
```

## update 修改

把所有 name = 静静 的数据中的 age 修改为 19

```
const where = { name: '静静' }  // 匹配条件
const newData = { age: 19 }     // 修改的数据

const count: number = db.update(where, newData); // 返回受影响的行数
```

## remove 删除

删除 age = 22 的数据

```
const where =   { age: 22 }    // 匹配条件，匹配那些数据需要删除
const count: number = db.remove(where); // 返回受影响的行数
```

删除 name = 夏琪 或者 name = 游勇 的数据

```
const where =   { name: ['夏琪', '游勇'] }
const count: number = db.remove(where); 
```


## like 模糊查询

查询 name 中带 `张` 的数据

```
db.like({ name: '张' })

[
  { name: '张三', age: 20, sex: '男',hobby: ['上网', '玩游戏'] }, 
  { name: '张六', age: 20, sex: '男', hobby: ['上网', '玩游戏'] }
]
```

## selectOne 查询

selectOne 与 select 使用上一样的，selectOne 在匹配到一条数据后则会停止匹配

查询 age = 20 的第一条数据
```

db.selectOne({ age: 20 });
{ name: '张三', age: 20, sex: '男',hobby: ['上网', '玩游戏'] }


```
如果我们已知需要查询的数据只会存在一条时可以设置查询条数, 尽可能减少匹配次数
```
const where = { id: 5 }

db.select({ age: 20 }, 1)
[
  { name: '张三', age: 20, sex: '男',hobby: ['上网', '玩游戏'] }
]
```


## siblings

根据条件的匹配结果查询其兄弟元素

```

db.siblings({ name: '张三' }) 

[
  ...
]

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
const data = DBList.flatten(list, 'children')  // children 为数据结构中的递归字段

[
  { id: 1, value: '北京', pid: 0 },
  { id: 2, value: '朝阳区', pid: 1 },
  { id: 4, value: '三里屯', pid: 2 },
  { id: 3, value: '东城区', pid: 1 }
]
id 为该条数据种的唯一值
pid 为自动生成的外键关系数据

```

## 构造参数


|  字段 | 是否可以为空  | 说明  | 默认值  |
| ------------ | ------------ | ------------ | ------------ |
|  list | 否 | 实列化时默认执行一次 insert 方法  | [] |
|  primaryKey | 否 | 主键 , 用于标识别当前数据 | "id" |
|  foreignKey | 否 | 外键, 用于与哪条数据进行关联 | "pid" "
|  fristForeignValue | 否 | 第一层外键的值 | "0" |


```
new DBList(list, primaryKey, foreignKey, fristForeignValue)

const db = new DBList(list, "id", "pid", "0");

db.primaryKey => "id"
db.foreignKey => "pid"
db.fristForeignValue => "0"
```


### 测试数据

```
[
  { "id": "100", "name": "A", "pid": 0 },
  { "id": "101", "name": "B", "pid": "100" },
  { "id": "102", "name": "C", "pid": "101" },
  { "id": "103", "name": "D", "pid": "102" },
  { "id": "104", "name": "E", "pid": "103" }
]
```

## children 查询子级数据

查询 id = 100 的子级数据

```
db.children({ id: '100' });
[
  { "id": "101", "name": "B", "pid": "100" }
]
```

## parent 查询父级数据

查询 id = 104 的父级数据 (父级返回的是对象，非数组)

```
db.parent({ id: '104' });
{ "id": "103", "name": "D", "pid": "102" }
```

## childrenDeep 递归查询子级数据

该方法与 children 类似, children 只会查询一层子级数据，childrenDeep 则会进行递归查询

```
db.childrenDeep({ id: '100' })
// db.childrenDeep(where, 'children') 
// 第二个参数用于指定 children 列表的键值，默认 children

[
  {
    "id": "100",
    "name": "A",
    "pid": 0,
    "children": [
      {
        "id": "101",
        "name": "B",
        "pid": "100",
        "children": [
          {
            "id": "102",
            "name": "C",
            "pid": "101",
            "children": [
              {
                "id": "103",
                "name": "D",
                "pid": "102",
                "children": [
                  {
                    "id": "104",
                    "name": "E",
                    "pid": "103"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]
```

## parentDeep 递归查询父级数据

该方法与 parent 类似, parent 只会查询一层父级数据，parentDeep 则会进行递归查询

```
db.parentDeep({ id: '104' })

// db.parentDeep(where, 'parent') 
// 第二个参数用于指定 parent 列表的键值，默认 parent

[
  {
    "id": "104",
    "name": "E",
    "pid": "103",
    "parent": [
      {
        "id": "103",
        "name": "D",
        "pid": "102",
        "parent": [
            {
              "id": "102",
              "name": "C",
              "pid": "101",
              "parent": [
                {
                  "id": "101",
                  "name": "B",
                  "pid": "100",
                  "parent": [
                    {
                      "id": "100",
                      "name": "A",
                      "pid": 0
                    }
                  ]
                }
              ]
            }
          ]
        }
    ]
  }
]
```

## clone 复制

执行 clone 时会将所有数据以 Array 格式返回

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

## childrenDeepFlatten
  childrenDeep + flatten
  把 childrenDeep 的数据做降维处理 

## parentDeepFlatten
  parentDeep + flatten
  把 parentDeep 的结果做降维处理

## clear
  清空所有数据

## empty
  清空元素几节点上的数据，只保留 primaryKey & foreignKey 属性
