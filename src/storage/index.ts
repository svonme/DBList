
import DB from "./db";

import * as _ from "../util";

const Compare = Symbol("Compare");

export default class Storage<Value = object> extends DB<Value> {
  /**
   * @param list 默认数据
   * @param primary 主键
   * @param foreign 外健
   * @param foreignValue 第一层外键值
   */
  constructor(
    list: Value[] = [],
    readonly primary: string = "id",
    readonly foreign: string = "pid",
    readonly foreignValue: string | number = 0
  ) {
    super(primary);
    if (list.length > 0) {
      this.insert(list);
    }
  }
  /**
   * 添加数据
   * @param row 需要添加的数据
   * @param childrenName children 名称
   * @returns 返回添加数据的主键（唯一值）
   */
  insert(row?: any, childrenName: string = "children"): Array<string | number> {
    if (!row) {
      return [];
    }
    const callback = (value: Value): Value => {
      if (!_.hasOwnProperty(value, this.foreign)) {
        _.set(value, this.foreign, this.foreignValue);
      }
      return value;
    }
    const list = _.flatten<Value>(
      _.concat<Value>(row as Value[]), 
      childrenName, 
      this.primary, 
      this.foreign, 
      this.foreignValue, 
      callback
    );
    return super.insert(list);
  }
  /**
   * 删除数据
   * @param where 查询条件
   * @returns 返回受影响的行数
   */
  remove(where: object): number {
    let index = 0;
    const list = this.where(where);
    for (const item of list) {
      const id = item.get(this.primary);
      const status = super.Remove(id);
      if (status) {
        index += 1;
      }
    }
    return index;
  }
  update(where: object, newValue: Value, limit: number = 0) {
    let index = 0;
    const list = this.select(where, limit);
    const newList: Value[] = [];
    for (const item of list) {
      const id = _.get(item, this.primary);
      const status = super.Remove(id);
      if (status) {
        index += 1;
        newList.push(Object.assign({}, item, newValue));
      }
    }
    this.insert(newList);
    return index;
  }
  private [Compare] (list: Map<string | number, any>[], key: string | number, value: any) {
    const array: Map<string | number, any>[] = [];
    for (let i = 0, len = list.length; i < len; i++) {
      const data = list[i];
      // 从查询到集合中匹配符合条件的数据
      const matcher = this.Matcher(data);
      let status = matcher(key, value);
      if (!status && Array.isArray(value)) {
        for (const item of value) {
          status = matcher(key, item);
          if (status) {
            break;
          }
        }
      }
      if (status) {
        array.push(data);
      }
    }
    return array;
  }
  /**
   * 查询数据
   * @param where 查询条件
   * @param limit 查询条数
   * @returns 返回原始数据
   */
  where(where: object, limit: number = 0): Map<string | number, any>[] {
    let list: Map<string | number, any>[] = [];
    let keys: string[] = [];
    for (const key of _.keys(where)) {
      if (key === this.primary) {
        keys = _.concat(key, keys);
      } else {
        keys.push(key);
      }
    }
    if (keys.length < 1) {
      return list;
    }
    list = this.get(keys[0], _.get(where, keys[0]));
    for (const key of keys.slice(1)) {
      if (list.length > 0) {
        const value = _.get(where, key);
        list = this[Compare](list, key, value);
      } else {
        break;
      }
    }
    return limit > 0 ? list.slice(0, limit) : list;
  }
  /**
   * 查询数据
   * @param where 查询条件
   * @param limit 查询条数
   * @returns 返回泛型格式数据
   */
  select(where?: object, limit: number = 0): Value[] {
    if (where) {
      const list = this.where(where, limit);
      return list.map(Object.fromEntries) as Value[];
    } else {
      return this.clone(void 0, limit);
    }
  }
  /**
   * 克隆一份集合
   * @param iteratee 迭代处理每一条数据 
   * @param limit
   * @returns 
   */
  clone<T = Value>(iteratee?: (value: Map<string | number, any>) => T, limit: number = 0): T[] {
    const list: Map<string | number, any>[] = this.toData();
    const result: T[] = [];
    for (let i = 0, len = limit > 0 ? limit : list.length; i < len; i++) {
      const data = list[i];
      if (iteratee) {
        result.push(iteratee(data));
      } else {
        result.push(Object.fromEntries(data) as T);
      }
    }
    return result;
  }
  /**
   * 同 Array.reduce
   * @param iteratee 
   * @param init 
   * @returns 
   */
  reduce<T>(iteratee?: (result: T, value: Map<string | number, any>, index: number) => T, init?: T) {
    if (iteratee && typeof iteratee === "function") {
      const list: Map<string | number, any>[] = this.toData();
      for (let i = 0, len = list.length; i < len; i++) {
        const data = list[i];
        init = iteratee(init as any, data, i);
      }
    }
    return init;
  }
  /**
   * 根据查询条件查询第一条数据
   * @param where 查询条件
   */
  selectOne(where: object): Value | undefined {
    if (where) {
      const [ value ] = this.select(where, 1);
      return value;
    }
  }
  /**
   * 根据条件查询第一条数据的所有兄弟数据
   * @param where 
   */
  siblings(where: object): Value[] {
    const [ table ] = this.where(where, 1);
    if (table) {
      const id = table.get(this.foreign);
      const query = {[this.foreign]: id};
      const list: Value[] = [];
      for (const data of this.where(query)) {
        const status = _.compare(data.get(this.primary), table.get(this.primary));
        if (!status) {
          list.push(Object.fromEntries(data) as Value);
        }
      }
      return list;
    }
    return [];
  }
  /**
   * 清空数据中除主键和外键的其余字段
   * @param where 
   * @returns 
   */
  empty(where: object): number {
    const list = [];
    for (const data of this.where(where)) {
      list.push({
        [this.primary]: data.get(this.primary),
        [this.foreign]: data.get(this.foreign)
      });
      super.Remove(data.get(this.primary));
    }
    const keys = this.insert(list);
    return keys.length;
  }
  /**
   * 根据条件查询第一条数据的所有子集数据
   * @param where 
   * @returns 
   */
  children(where: object): Value[] {
    const [data] = this.where(where, 1);
    if (data) {
      const query = {[this.foreign]: data.get(this.primary)};
      return this.select(query);
    }
    return [];
  }
  /**
   * 根据条件查询第一条数据的父级数据
   * @param where 
   * @returns 
   */
  parent(where: object): Value | undefined {
    const [data] = this.where(where, 1);
    if (data) {
      const query = {[this.primary]: data.get(this.foreign)};
      return this.selectOne(query);
    }
  }
  /**
   * 查询所有子级数据
   * @param where 查询条件
   * @param childrenName children 名称
   * @returns 
   */
  childrenDeep(where?: object, childrenName: string = "children"): Value[] {
    const result: {[key: string]: Value[]} = {};
    this.reduce((data: any, item: Map<string | number, any>) => {
      const value = Object.fromEntries(item) as Value;
      const id = item.get(this.foreign);
      if (id in result) {
        _.set(data, id, _.concat(result[id], value));
      } else {
        _.set(data, id, [value]);
      }
      return data;
    }, result);
    const deep = (list: Value[]): Value[] => {
      for (const item of list) {
        const foreign = _.get(item, this.primary);
        const children = result[foreign];
        if (children && children.length > 0){
          _.set(item, childrenName, deep(children));
        }
      }
      return list;
    }
    return where ? deep(this.select(where)) : [];
  }
  /**
   * 查询所有父级数据
   * @param where 查询条件
   * @param parentName parent 名称
   * @returns 
   */
  parentDeep(where?: object, parentName: string = "parent") {
    const deep = (list: Value[]): Value[] => {
      for (const item of list) {
        const query = {[this.primary]: _.get(item, this.foreign)};
        const parent = this.selectOne(query);
        if (parent) {
          _.set(item, parentName, deep([parent]));
        }
      }
      return list;
    }
    return where ? deep(this.select(where)) : [];
  }
  /**
   * 基于 childrenDeep 方法，将数据打散为一维数组
   * @param where 
   * @param childrenName 
   * @returns 
   */
  childrenDeepFlatten(where?: object, childrenName: string = "children"): Value[] {
    const list = this.childrenDeep(where, childrenName);
    const storage = new Storage<Value>([], this.primary, this.foreign, this.foreignValue);
    storage.insert(list, childrenName);
    return storage.clone();
  }
  /**
   * 基于 parentDeep 方法，将数据打散为一维数组
   * @param where 
   * @param parentName 
   * @returns 
   */
  parentDeepFlatten(where?: object, parentName: string = "parent") {
    const list = this.parentDeep(where, parentName);
    const storage = new Storage<Value>([], this.primary, this.foreign, this.foreignValue);
    storage.insert(list, parentName);
    return storage.clone();
  }
};