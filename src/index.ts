
import { DB, Get, Matcher, Remove, Update } from "./db";

import * as _ from "./util";

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
    const list = Storage.flatten<Value>(
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
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      const id = item.get(this.primary);
      const status = super[Remove](id);
      if (status) {
        index += 1;
      }
    }
    return index;
  }
  /**
   * 修改数据
   * @param where 查询条件
   * @param newValue 新数据
   * @param limit 指定受影响的行数
   * @returns 
   */
  update(where: object, newValue: Value, limit?: number) {
    const list = this.select(where, limit);
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      const value = _.omit(newValue, [this.primary, this.foreign]);
      const temp = Object.assign({}, item, value);
      super[Update](temp);
    }
    return list.length;
  }
  private [Compare] (list: Map<string | number, any>[], key: string | number, value: any, like?: boolean) {
    const array: Map<string | number, any>[] = [];
    for (let i = 0, len = list.length; i < len; i++) {
      const data = list[i];
      // 从查询到集合中匹配符合条件的数据
      const matcher = this[Matcher](data, like);
      let status = matcher(key, value);
      if (!status && Array.isArray(value)) {
        for (let index = 0, size = value.length; index < size; index++) {
          const item = value[index];
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
   * @param like  是否模糊匹配
   * @returns 返回原始数据
   */
  where(where: object, limit?: number, like?: boolean): Map<string | number, any>[] {
    let list: Map<string | number, any>[] = [];
    let keys: string[] = [];
    const temp = _.keys(where);
    for (let i = 0, len = temp.length; i < len; i++) {
      const key = temp[i];
      if (key === this.primary) {
        keys = _.concat(key, keys);
      } else {
        keys.push(key);
      }
    }
    if (keys.length < 1) {
      return list;
    }
    list = this[Get](keys[0], _.get(where, keys[0]), like, limit);
    const array = keys.slice(1);
    for (let i = 0, len = array.length; i < len; i++) {
      const key = array[i];
      if (list.length > 0) {
        const value = _.get(where, key);
        list = this[Compare](list, key, value, like);
      } else {
        break;
      }
    }
    return list;
  }
  /**
   * 模糊数据
   * @param where 查询条件
   * @param limit 查询条数
   * @returns 返回泛型格式数据
   */
  like(where?: object, limit?: number) {
    if (where) {
      const list = this.where(where, limit, true);
      return list.map(Object.fromEntries) as Value[];
    }
    return [];
  }
  /**
   * 查询数据
   * @param where 查询条件
   * @param limit 查询条数
   * @returns 返回泛型格式数据
   */
  select(where?: object, limit?: number): Value[] {
    if (where) {
      const list = this.where(where, limit, false);
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
    const size = limit > 0 ? limit : list.length;
    for (let i = 0; i < size; i++) {
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
   * 将数据转换为 object 格式
   * @returns 
   */
  toJSON(): object {
    return this.clone();
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
      const array = this.where(query);
      for (let i = 0, len = array.length; i < len; i++) {
        const data = array[i];
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
    const array = this.where(where);
    for (let i = 0, len = array.length; i < len; i++) {
      const data = array[i];
      list.push({
        [this.primary]: data.get(this.primary),
        [this.foreign]: data.get(this.foreign)
      });
      super[Remove](data.get(this.primary));
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
      for (let i = 0, len = list.length; i < len; i++) {
        const item = list[i];
        const foreign = _.get(item, this.primary);
        const children = result[foreign];
        if (children && children.length > 0){
          _.set(item, childrenName, deep(children));
        }
      }
      return list;
    }
    if (where) {
      return deep(this.select(where));
    } else {
      const query = {
        [this.foreign]: this.foreignValue
      };
      return deep(this.select(query));
    }
  }
  /**
   * 查询所有父级数据
   * @param where 查询条件
   * @param parentName parent 名称
   * @returns 
   */
  parentDeep(where?: object, parentName: string = "parent") {
    const deep = (list: Value[]): Value[] => {
      for (let i = 0, len = list.length; i < len; i++) {
        const item = list[i];
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