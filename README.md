# DBList
操作一组有规则的列表数据

```
const list = [
  {
    id: 1,
    value: '北京',
    children: [
      {
        id: 2,
        value: '朝阳区'
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

这样的有规则数据大家都很熟悉，如果我们要想知道 { id: 3, value: '东城区' } 这条数据，
必须要经过 { id: 1, ... } 这条数据 `DBList` 就是处理这类深层次数据的

```
// 生成一个 dblist 对象
const db = new DBList('db', [], 'id', 'parentId');
// 重新整理数据
const newList = db.flatten(list, 'children');
// 插入数据
db.insert(newList);
```

**select 查询**

```
db.select({ id: 2 }); 

[
  { id: 2, value: '朝阳区' }
]
```
---

```
db.select({ id: [2, 3] });

[
  { id: 2, value: '朝阳区' },
  { id: 3, value: '东城区' }
]
```
---

```
db.select({ id: [2, 3] });

[
  { id: 2, value: '朝阳区' },
  { id: 3, value: '东城区' }
]
```

---

```
db.select({ id: 1, value: '北京' });

[
  { id: 2, value: '北京' }
]
```



