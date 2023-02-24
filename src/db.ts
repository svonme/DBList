/**
 * @file DB
 */

import * as _ from "./util";
import type { Item } from "./type";

const Add = Symbol("add");
const Children = Symbol("children");
const Where = Symbol("Where");
const WhereAll = Symbol("WhereAll");
const WherePrimary = Symbol("WherePrimary");
const WhereForeign = Symbol("WhereForeign");
const Matcher = Symbol("Matcher");
const IsMatch = Symbol("IsMatch");
const IsMatchLike = Symbol("IsMatchLike");

const UnknownKey = Symbol("UnknownKey");

export default class DB<Value = Item> {
  private data: Map<string | number, Map<string | number, Value>>;
  /** 主健 */
  readonly primary: string;
  /** 外健 */
  readonly foreign: string;
  /** 第一层外键值 */
  readonly foreignValue: string | number;

  private [UnknownKey]: string = `unknownKey_${_.UUid()}`;
  private index: number;
  private indexKey: string;

  constructor(
    list: Value | Array<Value> = [], 
    primary: string = "id", 
    foreign: string = "pid", 
    foreignValue: string | number = 0, 
    indexKey: string = 'index'
  ) {
    this.index = 0;
    this.indexKey = indexKey;
    this.primary = primary;
    this.foreign = foreign;
    this.foreignValue = foreignValue;

    const data = new Map<string | number, Map<string | number, Value>>();
    data.set(this[UnknownKey], new Map());

    this.data = data;
    this.insert(list);
  }
  
  /**
   * 统计数据总量
   * @returns 
   */
  size(): number {
    let number = 0;
    this.data.forEach(map => {
      number += map.size;
    })
    return number;
  }
  protected getIndex (): number {
    return this.index++;
  }

  /**
   * 模糊匹配查询
   * @param data   匹配数据
   * @param where  匹配条件
   */
  private [IsMatchLike](data: Value, where: object): boolean {
    // 假设可以匹配成功
    let status = true;
    const keys = Object.keys(where);
    for (let i = 0, size = keys.length; i < size; i++) {
      const key = keys[i];
      // 校验匹配条件是否满足
      const value = _.get(data, key);
      const text = _.get(where, key);
      if (
        value && 
        text && 
        typeof text === "string" && 
        _.hasOwnProperty(data, key) && 
        _.includes(value, text)
      ) {
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
  private [IsMatch](data: Value, where: object): boolean {
    let status = true;
    const keys = Object.keys(where);
    for (let i = 0, size = keys.length; i < size; i++) {
      const key = keys[i];
      const value = _.get(data, key);
      const text = _.get(where, key);
      // 判断其中一个结果是否为数组
      if (text && Array.isArray(text)) {
        // 如果列表数据存与查询数据集合中其中一个匹配，则证明单次比对成功
        if (_.includes(text, value)) {
          continue;
        } else if (Array.isArray(value) && _.size(_.intersection(text, value)) > 0) {
          continue;
        } else {
          // 假如有一次匹配失败，则此次比较任务失败
          status = false;
          break;
        }
      } else {
        // 假如值的结果不相等，假如key不存在
        if (text !== value || !_.hasOwnProperty(data, key)) {
          // 假设 key 值是数组
          if (_.includes(_.concat<string>(value), text)) {
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
  private [Matcher](where: object, like: boolean = false): Function {
    return (value: Value) => {
      if (!value) {
        return false;
      }
      if (like) {
        return this[IsMatchLike](value, where);
      }
      return this[IsMatch](value, where);
    };
  }
  /**
   * 查询所有
   * @param limit 
   */
  private [WhereAll](limit: number = 0): Value[] {
    console.time("all");
    const result: Value[] = [];
    const maps = _.concat(this.data.values());
    for (let i = 0, len = maps.length; i < len; i++) {
      const map = maps[i];
      const list = _.concat(map.values());
      if (limit > 0) {
        if (list.length + result.length <= limit) {
          result.push(...list);
        } else {
          const temp = list.slice(0, limit - result.length);
          result.push(...temp);
          break;
        }
      } else {
        result.push(...list);
      }
    }
    console.timeEnd("all");
    return result;
  }
  /**
   * 根据外键查询数据
   * @param where 查询条件
   * @param limit 查询数据数量
   * @returns 
   */
  private [WhereForeign](where: object = {}, limit: number = 0): Value[] {
    let flag = true;
    const result: Value[] = [];
    const foreigns: string[] = _.concat(_.get(where, this.foreign));
    for(let i = 0, len = foreigns.length; i < len; i++) {
      const key = foreigns[i];
      const map = this.data.get(key);
      if (!map) {
        continue;
      }
      const list = _.concat(map.values());
      if (limit === 0) {
        result.push(...list);
      } else {
        for(let index = 0, size = list.length; index < size; index++) {
          const item = list[index];
          result.push(item);
          // 假如查询数据长度达到限制
          if (result.length >= limit) {
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
   * 根据主键查询数据
   * @param where 查询条件
   * @param limit 查询数据数量
   * @returns
   */
  [WherePrimary](where: object = {}, limit: number = 0): Value[] {
    let flag = true;
    const result: Value[] = [];
    const primarys: string[] = _.concat(_.get(where, this.primary));
    for(let i = 0, len = primarys.length; i < len; i++) {
      const key = primarys[i];
      const maps = _.concat(this.data.values());
      for(let index = 0, size = maps.length; index < size; index++) {
        const map = maps[index];
        const value = map.get(key);
        if (value) {
          result.push(value);
          break;
        }
      }
      if (limit > 0 && result.length >= limit) {
        flag = false;
        break;
      }
      if (!flag) {
        break;
      }
    }
    return result;
  }
  /**
   * 查询任务
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   * @param data  查询的数据
   * @param like  是否模糊查询
   */
  private [Where](where: object = {}, limit: number = 0, like: boolean): Value[] {
    let flag = true;
    const result: Value[] = [];
    // 正常查询
    const match = this[Matcher](where, like);
    const normalKeys = _.concat(this.data.keys());
    for(let i = 0, size = normalKeys.length; i < size; i++) {
      const key = normalKeys[i];
      const map = this.data.get(key);
      if (!map) {
        continue;
      }
      const keys = _.concat(map.keys());
      for(let j = 0, len = keys.length; j < len; j++) {
        const index = keys[j];
        const item = map.get(index);
        const status = item ? match(item) : false;
        if (item && status) {
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
   * 查询任务
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   * @param data  查询的数据
   * @param like  是否模糊查询
   * @param sort  是否启用排序
   * @returns
   */
  where(where: object = {}, limit: number = 0, like: boolean, sort?: boolean) {
    const keys = Object.keys(where);
    let list: Value[] = [];
    if (keys.length === 0) {
      list = this[WhereAll](limit);
    } else if (like) {
      list = this[Where](where, limit, true);
    } else if (keys.length === 1) {
      // 主外键查询
      // 如果只有外键查询条件
      if (_.hasOwnProperty(where, this.foreign)) {
        list = this[WhereForeign](where, limit);
      }
      // 如果只有主键查询条件
      if (_.hasOwnProperty(where, this.primary)) {
        list = this[WherePrimary](where, limit);
      }
    } else {
      list = this[Where](where, limit, false);
    }
    return sort ? _.sortBy(list, [this.indexKey]) : list;
  }
  /**
   * 模糊查询
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   * @param sort  是否启用排序
   * @returns
   */
  like(where: object, limit?: number, sort?: boolean): Value[] {
    return this.where(where, limit, true, sort);
  }
  /**
   * 匹配查询
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   * @param sort  是否启用排序
   * @returns
   */
  select(where?: object, limit?: number, sort?: boolean): Value[] {
    return this.where(where, limit, false, sort);
  }
  [Children] (item: Value): Value[] {
    const key = _.get(item, this.primary);
    const map = this.data.get(key);
    if (map) {
      return [...map.values()];
    }
    return [];
  }
  /**
   * 查询元素子级数据
   * @param where 查询条件
   */
  children(where: object): Value[] {
    if (!where) {
      throw "function children: where cannot be undefined"
    }
    const array: Value[] = [];
    const list = this.select(where);
    for (let i = 0, size = list.length; i < size; i++) {
      const value = this[Children](list[i]);
      array.push(...value);
    }
    return array;
  }
  /**
   * 查询所有子级数据，相对 children 方法，该方法会进行递归查询
   * @param where 
   * @param childrenKey 
   */
  childrenDeep(where?: object, childrenKey: string = "children"): Value[] {
    const deep = (data: Value): Value => {
      const array = this[Children](data);
      if (array && array.length > 0) {
        _.set(data, childrenKey, array.map(deep));
      }
      return data;
    }
    const result: Value[] = [];
    if (!where) {
      where = { [this.foreign]: this.foreignValue };
    }
    const list = this.select(where);
    for(let i = 0, size = list.length; i < size; i++) {
      result.push(deep(list[i]));
    }
    return result;
  }
  // 添加数据
  private [Add](item: Value, foreign?: string | number): string {
    if (!foreign && foreign !== 0) {
      foreign = this[UnknownKey];
    }
    // 判断是否存在主健
    if (!_.hasOwnProperty(item, this.primary) ) {
      // @ts-ignore
      item[this.primary] = UUid();
    }
    const key = _.get(item, this.primary);
    if (this.data.has(foreign)) {
      const map = this.data.get(foreign);
      map!.set(key, item);
    } else {
      const map = new Map<string, Value>();
      map.set(key, item);
      this.data.set(foreign, map);
    }
    return key;
  }
  /**
   * 添加数据
   * @param row
   * @description 返回数据的主键集合
   */
  insert(row?: Value | Value[]): Array<string | number> {
    const keys: Array<string | number> = [];
    if (!row) {
      return keys;
    }
    const list = _.flatten<Value>(
      _.concat<Value>(row as Value[]), 
      "children", 
      this.primary, 
      this.foreign, 
      this.foreignValue
    );
    for(let i = 0, len = list.length; i < len; i++){
      const item = { ...list[i] };
      const index = this.getIndex();
      // 判断是否有排序字段
      if (!_.hasOwnProperty(item, this.indexKey)) {
        // @ts-ignore
        item[this.indexKey] = index;
      }
      const pid = _.get(item, this.foreign);
      keys.push(this[Add](item, pid));
    }
    return keys;
  }
  /**
   * 修改数据中的主键
   */
  updatePrimary(oldValue: string | number, newValue: string | number): boolean {
    return false;
    // const [ data ] = this.select({[this.primary]: oldValue}, 1);
    // if (!data) {
    //   return false;
    // }
    // const children = this[Children](data); // 所有子集数据
    // set(data, this.primary, newValue);

    // this.data.delete(oldValue);
    // this.insert(data);
    // const foreignKeys = this.data.keys();
    // for(const foreignKey of foreignKeys) {
    //   const map = this.data.get(foreignKey);
    //   if(map.has(originKey)) {
    //     const value = map.get(originKey);
    //     map.delete(originKey);
    //     map.set(newKey, value);
    //   }
    // }
  }
  // /**
  //  * 修改数据中的外键
  //  */
  // private _updateforeignKey(originKey: string | number, newKey: string | number): void {
  //   if (this.data.has(originKey)) {
  //     const map = this.data.get(originKey);
  //     for(const key of map.keys()) {
  //       const value = map.get(key);
  //       if (_.isArray(value[this.foreignKey])) {
  //         // 合并数据
  //         const ids = [].concat(value[this.foreignKey], newKey);
  //         // 排除旧数据
  //         value[this.foreignKey] = _.difference(ids, [originKey]);
  //       } else {
  //         value[this.foreignKey] = newKey;
  //       }
  //       map.set(key, value);
  //     }
  //     this.data.delete(originKey);
  //     this.data.set(newKey, map);
  //   }
  // }
  // /**
  //  * 修改
  //  * @param where 需要修改的数据的查询条件
  //  * @param value 新的数据
  //  */
  // update(where: Where, value: DataItem): number {
  //   const primaryKeyHooks: DataItem = {};
  //   const foreignKeyHooks: DataItem = {};
  //   // 查询需要修改的数据
  //   const originList = this.select<DataItem>(where);
  //   for (const origin of originList) {
  //     const key = origin[this.primaryKey];
  //     // 新数据
  //     for(const foreignKey of this.data.keys()) {
  //       const map = this.data.get(foreignKey);
  //       if(map.has(key)) {
  //         if (foreignKey === this.unknownKey) {
  //           // 新数据中如果有外键
  //           if (this.foreignKey in value) {
  //             // 删除数据
  //             map.delete(key);
  //             // 判断新的外键是否存在, 不存在则创建
  //             if (!(this.data.has(value[this.foreignKey]))) {
  //               this.data.set(value[this.foreignKey], new Map());
  //             }
  //             // 添加数据
  //             const temp = this.data.get(value[this.foreignKey]);
  //             temp.set(key, Object.assign({}, origin, value));
  //           } else {
  //             map.set(key, Object.assign({}, origin, value));
  //           }
  //         } else {
  //           map.set(key, Object.assign({}, origin, value));
  //         }
  //       }
  //     }
  //     // 查询主键是否发生变化
  //     if (this.primaryKey in value) {
  //       primaryKeyHooks[key] = value[this.primaryKey];
  //       foreignKeyHooks[key] = value[this.primaryKey];
  //     }
  //     // 查询外键是否发生变化
  //     if (this.foreignKey in value) {
  //       // 原数据有外键
  //       if (origin[this.foreignKey]) {
  //         foreignKeyHooks[origin[this.foreignKey]] = value[this.foreignKey];
  //       }
  //     }
  //   }
  //   // 修改主键
  //   for(const key of Object.keys(primaryKeyHooks)) {
  //     const value = primaryKeyHooks[key];
  //     this._updatePrimaryKey(key, value);
  //   }
  //   // 修改外键
  //   for(const key of Object.keys(foreignKeyHooks)) {
  //     const value = foreignKeyHooks[key];
  //     this._updateforeignKey(key, value);
  //   }
  //   return originList.length;
  // }
  /**
   * 删除数据
   * @param where 需要删除的数据的查询条件
   * @description 返回受影响的行数
   */
  remove(where: object): number {
    const list = this.select(where);
    const data = new Map<string, Value>();
    for(let i = 0, size = list.length; i < size; i++) {
      const item = list[i];
      const childrenKey: string = "children";
      const value = this.childrenDeep(_.pick(item, [this.primary]), childrenKey);
      const temp = _.flatten(value, childrenKey, this.primary, this.foreign, this.foreignValue);
      for (let j = 0, len = temp.length; j < len; j++) {
        const item = temp[j];
        const key: string = _.get(item, this.primary);
        data.set(key, item);
        this.data.delete(key); // 删除子数据
      }
    }
    const maps = _.concat(this.data.values());
    for (let i = 0, size = maps.length; i < size; i++) {
      const map = maps[i];
      const keys = _.concat(data.keys());
      for (let index = 0, len = keys.length; index < len; index++) {
        const key = keys[index];
        map.delete(key); // 删除数据
      }
    }
    return data.size;
  }
  /** 清空整个 DB 数据 */
  clear (): void {
    const data = new Map<string | number, Map<string | number, Value>>();
    data.set(this[UnknownKey], new Map<string | number, Value>());
    this.data = data
  }
  /** 清空某元素数据，只保留 primary & foreign 属性 */
  empty(where: object): void {
    const array = this.select(where);
    for(let i = 0, size = array.length; i < size; i++) {
      const item = array[i];
      const value = _.pick(item, [this.primary, this.foreign, this.indexKey]);
      const map = this.data.get(_.get(item, this.foreign));
      if (map) {
        map.set(_.get(item, this.primary), value as Value);
      }
    }
  }
}