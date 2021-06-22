/**
 * @file DBList
 * @author svon.me@gmail.com
 */

const _ = require('lodash');

interface DataItem {
  [key: string]: any;
}

interface Where extends DataItem{
}

let _UUIDIndex = 1;
function UUid() {
  const id = `DBList_${_UUIDIndex++}`;
  const key = String(Math.random()).slice(2);
  return `${id}_${key}`;
}


class Basis {
  protected data: Map<string | number, Map<string | number, DataItem>>;
  /** 主健 */
  protected primaryKey: string;
  /** 外健 */
  protected foreignKey: string;
  /** 第一层外键值 */
  protected foreignKeyValue: string | number;
  private unknownKey: string;
  private index: number;
  protected indexName: string;
  constructor(list: Array<DataItem>, primaryKey: string, foreignKey: string, foreignKeyValue: string | number, indexName: string = 'dbIndex') {
    this.index = 1;
    this.indexName = indexName || '__index';
    this.data = new Map();
    this.primaryKey = primaryKey;
    this.foreignKey = foreignKey;
    this.foreignKeyValue = foreignKeyValue;
    this.unknownKey = `_unknownKey_${UUid()}`;
    this.data.set(this.unknownKey, new Map());
    this.insert(list);
  }
  size(): number {
    let number = 0;
    this.data.forEach(map => {
      number += map.size;
    })
    return number;
  }
  getIndex (): number {
    return this.index++;
  }

  /**
   * 模糊匹配查询
   * @param data   匹配数据
   * @param where  匹配条件
   */
  IsMatchLike(data: DataItem, where: Where): boolean {
    const keys: string[] = _.keys(where);
    // 假设可以匹配成功
    let status = true;
    for (let i = 0, length = keys.length; i < length; i++) {
      const key: string = keys[i];
      // 校验匹配条件是否满足
      if (data.hasOwnProperty(key) && _.includes(data[key], where[key])) {
        continue;
      } else {
        // 如果条件不成立，则返回失败结果
        status = false;
        break;
      }
    }
    return status;
  }
  /**
   * 返回对象是否具有给定的 key：value 集合
   * @param data   要匹配的对象
   * @param where  要查询的条件
   * @param link   是否模糊查询
   */
  IsMatch(data: DataItem, where: Where): boolean {
    const keys: string[] = _.keys(where);
    let status = true;
    for (let i = 0, length = keys.length; i < length; i++) {
      const key = keys[i]; // 判断其中一个结果是否为数组
      if (_.isArray(where[key])) {
        // 如果列表数据存与查询数据集合中其中一个匹配，则证明单次比对成功
        if (_.includes(where[key], data[key])) {
          continue;
        } else if (_.isArray(data[key]) && _.size(_.intersection(where[key], data[key])) > 0) {
          continue;
        } else {
          // 假如有一次匹配失败，则此次比较任务失败
          status = false;
          break;
        }
      } else {
        // 假如值的结果不相等，假如key不存在
        if (where[key] !== data[key] || !data.hasOwnProperty(key)) {
          // 假设 key 值是数组
          if (_.includes([].concat(data[key]), where[key])) {
            continue;
          } else {
            status = false;
            break;
          }
        }
      }
    }
    return status;
  }
  /**
   * 创建匹配任务
   * @param where  要查询的条件
   * @param link   是否模糊查询
   */
  Matcher(where: Where, like: boolean = false): Function {
    return (value: DataItem) => {
      if (!value) {
        return false;
      }
      if (like) {
        return this.IsMatchLike(value, where);
      }
      return this.IsMatch(value, where);
    };
  }
  /**
   * 查询所有
   * @param limit 
   */
  private whereAll<T extends DataItem>(limit: number = 0): T[] {
    const result: Array<T> = [];
    this.data.forEach(map => {
      map.forEach((item: T) => {
        result.push(item);
      });
    });
    return limit > 0 ? result.slice(0, limit) : result;
  }
  /**
   * 查询任务
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   * @param data  查询的数据
   * @param like  是否模糊查询
   */
  Where<T extends DataItem>(where: Where = {}, limit: number = 0, like: boolean): T[] {
    const keys = Object.keys(where);
    if (keys.length === 0) {
      return this.whereAll(limit);
    }
    let flag = true;
    let result: Array<T> = [];
    // 主外键查询
    if (keys.length === 1 && !like) {
      // 外键查询
      if (this.foreignKey in where) {
        const foreignKeys = [].concat(where[this.foreignKey]);
        for(const key of foreignKeys) {
          const map = this.data.get(key);
          if (!map) {
            continue;
          }
          if (limit === 0) {
            const list: T[] = map.values() as any
            result.push(...list);
          } else {
            for(const item of map.values()) {
              result.push(item as T);
              // 假如查询数据长度达到限制
              if (result.length >= limit) {
                flag = false;
                break;
              }
            }
            if (!flag) {
              break;
            }
          }
        }
        return result;
      }
      // 主键查询
      if (this.primaryKey in where) {
        const primaryKeys = [].concat(where[this.primaryKey]);
        for(const key of primaryKeys) {
          for(const map of this.data.values()) {
            const value: T = map.get(key) as T;
            if (value) {
              result.push(value);
            }
            if (limit > 0 && result.length >= limit) {
              flag = false;
              break;
            }
          }
          if (!flag) {
            break;
          }
        }
        return result;
      }
    }
    // 正常查询
    const match = this.Matcher(where, like);
    for(const key of this.data.keys()) {
      const map = this.data.get(key);
      for(const index of map.keys()) {
        const item: T = map.get(index) as T;
        const status = item ? match(item) : false;
        if (status) {
          result.push(item);
          // 假如查询数据长度达到限制
          if (limit > 0 && result.length >= limit) {
            flag = false;
            break;
          }
        }
      }
      if (!flag) {
        break;
      }
    }
    return result;
  }
  /**
   * 模糊查询
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   */
  like<T extends DataItem>(where: Where, limit?: number): T[] {
    return this.Where<T>(where, limit, true);
  }
  /**
   * 匹配查询
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   */
  select<T extends DataItem>(where?: Where, limit?: number): T[] {
    const array: T[] = this.Where<T>(where, limit, false);
    return _.sortBy(array, [this.indexName]) as T[];
  }
  /**
   * 添加数据
   * @param row
   */
  insert(row: DataItem | Array<DataItem>): number | string | Array<string | number> {
    if (!row) {
      return void 0;
    }
    const keys: Array<string | number> = [];
    const list = [].concat(row);
    for(let i = 0, len = list.length; i < len; i++){
      const item = list[i];
      const index = this.getIndex();
      // 判断是否存在主健
      if (!item.hasOwnProperty(this.primaryKey) ) {
        item[this.primaryKey] = UUid();
      }
      // 判断是否有排序字段
      if (!item.hasOwnProperty(this.indexName)) {
        item[this.indexName] = index;
      }
      keys.push(item[this.primaryKey]);
      if (item.hasOwnProperty(this.foreignKey)) {
        const [pid] = [].concat(item[this.foreignKey]);
        let map = this.data.get(pid);
        if (!map) {
          this.data.set(pid, new Map());
          map = this.data.get(pid);
        }
        map.set(item[this.primaryKey], item);
      } else {
        const map = this.data.get(this.unknownKey);
        map.set(item[this.primaryKey], item);
      }
    }
    if (keys.length === 1) {
      return keys[0];
    }
    return keys;
  }
  /**
   * 修改数据中的主键
   */
  private _updatePrimaryKey(originKey: string | number, newKey: string | number): void {
    const foreignKeys = this.data.keys();
    for(const foreignKey of foreignKeys) {
      const map = this.data.get(foreignKey);
      if(map.has(originKey)) {
        const value = map.get(originKey);
        map.delete(originKey);
        map.set(newKey, value);
      }
    }
  }
  /**
   * 修改数据中的外键
   */
  private _updateforeignKey(originKey: string | number, newKey: string | number): void {
    if (this.data.has(originKey)) {
      const map = this.data.get(originKey);
      for(const key of map.keys()) {
        const value = map.get(key);
        if (_.isArray(value[this.foreignKey])) {
          // 合并数据
          const ids = [].concat(value[this.foreignKey], newKey);
          // 排除旧数据
          value[this.foreignKey] = _.difference(ids, [originKey]);
        } else {
          value[this.foreignKey] = newKey;
        }
        map.set(key, value);
      }
      this.data.delete(originKey);
      this.data.set(newKey, map);
    }
  }
  /**
   * 修改
   * @param where 需要修改的数据的查询条件
   * @param value 新的数据
   */
  update(where: Where, value: DataItem): number {
    const primaryKeyHooks: DataItem = {};
    const foreignKeyHooks: DataItem = {};
    // 查询需要修改的数据
    const originList = this.select<DataItem>(where);
    for (const origin of originList) {
      const key = origin[this.primaryKey];
      // 新数据
      for(const foreignKey of this.data.keys()) {
        const map = this.data.get(foreignKey);
        if(map.has(key)) {
          if (foreignKey === this.unknownKey) {
            // 新数据中如果有外键
            if (this.foreignKey in value) {
              // 删除数据
              map.delete(key);
              // 判断新的外键是否存在, 不存在则创建
              if (!(this.data.has(value[this.foreignKey]))) {
                this.data.set(value[this.foreignKey], new Map());
              }
              // 添加数据
              const temp = this.data.get(value[this.foreignKey]);
              temp.set(key, Object.assign({}, origin, value));
            } else {
              map.set(key, Object.assign({}, origin, value));
            }
          } else {
            map.set(key, Object.assign({}, origin, value));
          }
        }
      }
      // 查询主键是否发生变化
      if (this.primaryKey in value) {
        primaryKeyHooks[key] = value[this.primaryKey];
        foreignKeyHooks[key] = value[this.primaryKey];
      }
      // 查询外键是否发生变化
      if (this.foreignKey in value) {
        // 原数据有外键
        if (origin[this.foreignKey]) {
          foreignKeyHooks[origin[this.foreignKey]] = value[this.foreignKey];
        }
      }
    }
    // 修改主键
    for(const key of Object.keys(primaryKeyHooks)) {
      const value = primaryKeyHooks[key];
      this._updatePrimaryKey(key, value);
    }
    // 修改外键
    for(const key of Object.keys(foreignKeyHooks)) {
      const value = foreignKeyHooks[key];
      this._updateforeignKey(key, value);
    }
    return originList.length;
  }
  /**
   * 删除数据
   * @param where 需要删除的数据的查询条件
   */
  remove<T extends DataItem>(where: Where): number {
    if (_.keys(where).length < 1) {
      return 0;
    }
    let count = 0;
    const list = this.select<T>(where);
    for(const item of list) {
      const id = item[this.primaryKey];
      for(const map of this.data.values()) {
        // 删除元素
        if (map.delete(id)) {
          count++;
        }
      }
    }
    return count;
  }
  /** 清空整个 DB 数据 */
  clear (): void {
    const data = new Map();
    data.set(this.unknownKey, new Map());
    this.data = data
  }
  /** 清空某元素数据，只保留 primaryKey & foreignKey 属性 */
  empty<T extends DataItem>(where: Where): void {
    const array: T[] = this.select(where);
    for(const item of array) {
      const value: T = _.pick(item, [this.primaryKey, this.foreignKey, this.indexName]);
      const map = this.data.get(item[this.foreignKey]);
      map.set(item[this.primaryKey], value);
    }
  }
}



class DB extends Basis {
  constructor(list: Array<DataItem> = [], primaryKey: string = 'id', foreignKey: string = 'pid', foreignKeyValue: string | number = '0') {
    // 如果第一个参数为字符串，则为无效参数（旧版本有该参数，0.2.4版本时已取消）
    if (_.isString(list)) {
      console.warn('Dblist has removed the name field in version 0.2.4');
      list = primaryKey as any
      primaryKey = foreignKey
      foreignKey = String(foreignKeyValue)
      foreignKeyValue = '0'
    }
    super(list, primaryKey, foreignKey, foreignKeyValue);
  }
  selectOne<T extends DataItem>(where: Where): T {
    if (!where) {
      throw "function selectOne: where cannot be undefined"
    }
    const [ data ]: T[] = this.select<T>(where, 1);
    return data;
  }
  /**
   * 复制一份数据
   * @param callback 可以对每一个元素作处理
   */
  clone<T extends DataItem>(callback?: Function): T[] {
    const array: T[] = this.select<T>();
    if (callback) {
      const list: T[] = [];
      for (let i = 0, len = array.length; i < len; i++) {
        const value = callback(Object.assign({}, array[i]));
        if (value) {
          list.push(value);
        }
      }
      return list;
    }
    return array;
  }
  /** 以下法必须配置 primaryKey & foreignKey */
  flatten<T extends DataItem>(list: T[], childrenKey: string = "children"): T[] {
    if (!list) {
      throw "function flatten: list cannot be undefined"
    }
    const data: T[] = [];
    const deep = (array: T[], foreignKey: string | number): void => {
      for (let i = 0, len = array.length; i < len; i++) {
        const item: DataItem = array[i];
        // 判断主键是否存在
        if (!(this.primaryKey in item)) {
          item[this.primaryKey] = UUid();
        }
        // 判断外键是否存在
        if (!(this.foreignKey in item)) {
          item[this.foreignKey] = foreignKey;
        }
        const primaryKey = item[this.primaryKey];
        const value = _.omit(item, [childrenKey]);
        data.push(value);
        if (item[childrenKey]) {
          const children = [].concat(item[childrenKey] || []);
          if (children.length > 0) {
            deep(children, primaryKey);
          }
        }
      }
    };
    deep(list, this.foreignKeyValue);
    return data;
  }
  /**
   * 查询元素子级数据
   * @param where 查询条件
   */
  children<T extends DataItem>(where: Where): T[] {
    if (!where) {
      throw "function children: where cannot be undefined"
    }
    let item: T;
    if (this.primaryKey in where && this.foreignKey in where) {
      item = Object.assign({}, where) as T;
    } else {
      item = Object.assign({}, this.selectOne<T>(where)) as T;
    }
    if (item) {
      const childrenWhere: Where = {};
      childrenWhere[this.foreignKey] = item[this.primaryKey];
      return _.map(this.select<T>(childrenWhere), (data: DataItem) => _.clone(data));
    }
    return [];
  }
  /**
   * 查询所有子级数据，相对 children 方法，该方法会进行递归查询
   * @param where 
   * @param childrenKey 
   */
  childrenDeep<T extends DataItem>(where: Where, childrenKey: string = 'children'): T[] {
    const deep = (query: Where): Array<DataItem> => {
      const list: any = this.children<T>(query);
      for(const item of list) {
        const array = deep(item as Where);
        if (array && array.length) {
          item[childrenKey] = array
        }
      }
      return list;
    };
    const result: T[] = [];
    if (!where) {
      where = {};
      where[this.foreignKey] = this.foreignKeyValue;
    }
    for(const item of this.select<T>(where)) {
      const data: DataItem = Object.assign({}, item);
      const query: Where = {};
      query[this.primaryKey] = data[this.primaryKey];
      const array = deep(query);
      if (array && array.length) {
        data[childrenKey] = array
      }
      result.push(data as T);
    }
    return result;
  }
  /**
   * childrenDeep + Flatten 组合
   * @param list 
   * @param childrenKey 
   */
  childrenDeepFlatten<T extends DataItem>(where: Where, childrenKey: string = 'children'): T[] {
    const result = this.childrenDeep(where, childrenKey);
    const db = new DB([], this.primaryKey, this.foreignKey, this.foreignKeyValue);
    const array = db.flatten(result, childrenKey);
    db.insert(array);
    return db.clone<T>()
  }
  /**
   * 查询父级数据，与 children 方法进行相反方向查询
   * @param where 
   */
  parent<T extends DataItem>(where: Where): T {
    if (!where) {
      throw "function parent: where cannot be undefined"
    }
    if (this.foreignKey in where) {
      const parentWhere: Where = {};
      parentWhere[this.primaryKey] = where[this.foreignKey];
      const value: T = this.selectOne<T>(parentWhere)
      return value ? _.clone(value) : void 0;
    } else {
      const item = this.selectOne<T>(where);
      if (item) {
        const parentWhere: Where = {};
        parentWhere[this.primaryKey] = item[this.foreignKey];
        const value: T = this.selectOne<T>(parentWhere)
        return value ? _.clone(value) : void 0;
      }
      return void 0;
    }
  }
  /**
   * 查询所有父级数据，与 childrenDeep 方法进行相反方向查询
   * @param where 
   * @param parentKey 
   */
  parentDeep<T extends DataItem>(where: Where, parentKey: string = 'parent'): T[] {
    const result: T[] = []
    const deep = (where: Where): DataItem => {
      const parent = this.parent(where);
      if (parent) {
        parent[parentKey] = deep(parent);
      }
      return parent;
    }
    for(const item of this.select(where)) {
      const data: DataItem = Object.assign({}, item);
      const parent = deep(data);
      if (parent) {
        data[parentKey] = parent
      }
      result.push(data as T);
    }
    return result;
  }
  /**
   * parentDeep + Flatten 组合
   * @param list 
   * @param childrenKey 
   */
  parentDeepFlatten<T extends DataItem>(where: Where, childrenKey: string = 'children'): T[] {
    const result = this.parentDeep(where, childrenKey);
    const db = new DB([], this.primaryKey, this.foreignKey, this.foreignKeyValue);
    const array = db.flatten(result, childrenKey);
    db.insert(array);
    return db.clone<T>()
  }
  /**
   * 查询兄弟元素
   * @param where 
   */
  siblings<T extends DataItem>(where: Where): T[] {
    if (!where) {
      throw "function siblings: where cannot be undefined"
    }
    const item = this.selectOne<T>(where);
    if (item) {
      const query: Where = {};
      query[this.foreignKey] = item[this.foreignKey];
      return this.select<T>(query);
    }
    return void 0;
  }
}


module.exports = DB;
exports.default = DB;