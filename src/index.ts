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
  constructor(list: Array<DataItem>, primaryKey: string, foreignKey: string, foreignKeyValue: string) {
    this.data = new Map();
    this.primaryKey = primaryKey;
    this.foreignKey = foreignKey;
    this.foreignKeyValue = foreignKeyValue;
    this.unknownKey = `_unknownKey_${UUid()}`;
    this.data.set(this.unknownKey, new Map());
    this.insert(list);
  }
  size() {
    let number = 0;
    this.data.forEach(map => {
      number += map.size;
    })
    return number;
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
  Matcher(where: Where, like: boolean = false) {
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
  private whereAll(limit: number = 0): Array<DataItem> {
    const result: Array<DataItem> = [];
    this.data.forEach(map => {
      map.forEach(item => {
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
  Where(where: Where = {}, limit: number = 0, like: boolean): Array<DataItem> {
    const keys = Object.keys(where);
    if (keys.length === 0) {
      return this.whereAll(limit);
    }
    let flag = true;
    let result: Array<DataItem> = [];
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
            result.push(...map.values());
          } else {
            for(const item of map.values()) {
              result.push(item);
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
            const value = map.get(key);
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
        const item = map.get(index);
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
  like(where: Where, limit?: number): Array<DataItem> {
    return this.Where(where, limit, true);
  }
  /**
   * 匹配查询
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   */
  select(where?: Where, limit?: number): Array<DataItem> {
    return this.Where(where, limit, false);
  }
  /**
   * 添加数据
   * @param row
   */
  insert(row: DataItem | Array<DataItem>): number {
    if (!row) {
      return 0;
    }
    const list = [].concat(row);
    for(let i = 0, len = list.length; i < len; i++){
      const item = list[i];
      // 判断是否存在主健
      if (!(this.primaryKey in item)) {
        item[this.primaryKey] = UUid();
      }
      if (this.foreignKey in item) {
        for(const pid of [].concat(item[this.foreignKey])) {
          let map = this.data.get(pid);
          if (!map) {
            this.data.set(pid, new Map());
            map = this.data.get(pid);
          }
          map.set(item[this.primaryKey], item);
        }
      } else {
        const map = this.data.get(this.unknownKey);
        map.set(item[this.primaryKey], item);
      }
    }
    return list.length;
  }
  /**
   * 修改数据中的主键
   */
  private _updatePrimaryKey(originKey: string | number, newKey: string | number) {
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
  private _updateforeignKey(originKey: string | number, newKey: string | number) {
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
    const originList = this.select(where);
    for (const origin of originList) {
      const key = origin[this.primaryKey];
      // 查询主键是否发生变化
      if (this.primaryKey in value) {
        primaryKeyHooks[key] = value[this.primaryKey];
        foreignKeyHooks[key] = value[this.primaryKey];
      }
      // 查询外键是否发生变化
      if (this.foreignKey in value) {
        foreignKeyHooks[origin[this.foreignKey]] = value[this.foreignKey];
      }
      // 新数据
      for(const map of this.data.values()) {
        if(map.has(key)) {
          map.set(key, Object.assign({}, origin, value));
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
  remove(where: Where): number {
    if (_.keys(where).length < 1) {
      return 0;
    }
    let count = 0;
    const list = this.select(where);
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
}



class DB extends Basis {
  /** DB 名称 */
  private name: string;
  constructor(name: string = UUid(), list: Array<DataItem> = [], primaryKey: string = 'id', foreignKey: string = 'pid', foreignKeyValue: string = '0') {
    super(list, primaryKey, foreignKey, foreignKeyValue);
    // 设置数据库名称
    this.setName(name);
  }
  protected setName(name: string): void {
    this.name = name;
  }
  protected getName(): string {
    return this.name;
  }
  selectOne(where: Where): DataItem {
    const [ data ]: Array<DataItem> = this.select(where, 1);
    return data;
  }
  /**
   * 复制一份数据
   * @param callback 可以对每一个元素作处理
   */
  clone(callback: Function): Array<DataItem> {
    const array = this.select();
    if (callback) {
      const list: Array<DataItem> = [];
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
  flatten(list: Array<DataItem>, childrenKey: string): Array<DataItem> {
    const data: Array<DataItem> = [];
    const deep = (array: Array<DataItem>, foreignKey: string | number) => {
      for (let i = 0, len = array.length; i < len; i++) {
        const item = array[i];
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
   * @param limit 指定查询条数
   */
  children(where: Where): Array<DataItem> {
    const item = this.selectOne(where);
    if (item) {
      const childrenWhere: Where = {};
      childrenWhere[this.foreignKey] = item[this.primaryKey];
      const children = this.select(childrenWhere);
      return [].concat(item, children);
    }
    return [item];
  }
  /**
   * 查询所有子级数据，相对 children 方法，该方法会进行递归查询
   * @param where 
   * @param limit 
   */
  childrenDeep(where: Where): Array<DataItem> {
    const result: Array<DataItem> = [];
    const deep = (query: Where) => {
      const list: Array<DataItem> = this.children(query)
      if (list[0]) {
        result.push(list[0]);
      }
      const children = list.slice(1);
      for(let i = 0, len = children.length; i < len; i++){
        const node = children[i];
        const childrenWhere: Where = {};
        childrenWhere[this.primaryKey] = node[this.primaryKey];
        deep(childrenWhere);
      }
    };

    for(const item of this.select(where)) {
      const query: Where = {};
      query[this.primaryKey] = item[this.primaryKey];
      deep(query);
    }
    return result;
  }
  /**
   * 查询父级数据，与 children 方法进行相反方向查询
   * @param where 
   * @param limit 
   */
  parent(where: Where): Array<DataItem> {
    const result: Array<DataItem> = [];
    const item = this.selectOne(where);
    if (item) {
      result.push(item);
      // 判断是否是第一层数据
      if (this.foreignKeyValue !== item[this.foreignKey]) {
        const parentWhere: Where = {};
        parentWhere[this.primaryKey] = item[this.foreignKey];
        const parent = this.selectOne(parentWhere);
        if (parent) {
          result.push(parent);
        }
      }
    }
    return result;
  }
  /**
   * 查询所有父级数据，与 与 childrenDeep 方法进行相反方向查询
   * @param where 
   * @param limit 
   */
  parentDeep(where: Where): Array<DataItem> {
    const result: Array<DataItem> = []
    const deep = (list: Array<DataItem>) => {
      if (list[0]) {
        result.push(list[0]);
      }
      if (list[1]) {
        const parent = list[1];
        const select: Where = {};
        select[this.primaryKey] = parent[this.primaryKey];
        deep(this.parent(select));
      }
    }
    for(const item of this.select(where)) {
      const query: Where = {};
      query[this.primaryKey] = item[this.primaryKey];
      deep(this.parent(query));
    }
    return result;
  }
}

module.exports = DB;
exports.default = DB;