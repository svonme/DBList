/**
 * @file DB
 */

import * as _ from "lodash-es";
import { UUid, hasOwnProperty, get, set, pick, concat, flatten } from "./util";
import type { Where, Item } from "./type";

export default class DB<Value = Item> {
  protected data: Map<string | number, Map<string | number, Value>>;
  /** 主健 */
  protected primary: string;
  /** 外健 */
  protected foreign: string;
  /** 第一层外键值 */
  protected foreignValue: string | number;

  private unknownKey: string;
  private index: number;
  protected indexKey: string;

  constructor(
    list: Value | Array<Value> = [], 
    primary: string = "id", 
    foreign: string = "pid", 
    foreignValue: string | number = 0, 
    indexKey: string = 'index'
  ) {
    this.index = 1;
    this.indexKey = indexKey;
    this.primary = primary;
    this.foreign = foreign;
    this.foreignValue = foreignValue;
    this.unknownKey = `unknownKey_${UUid()}`;

    const data = new Map<string | number, Map<string | number, Value>>();
    data.set(this.unknownKey, new Map());

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
  IsMatchLike(data: Value, where: Where): boolean {
    // 假设可以匹配成功
    let status = true;
    for (const key of Object.keys(where)) {
      // 校验匹配条件是否满足
      const value = get(data, key);
      const text = get(where, key);
      if (
        value && 
        text && 
        typeof text === "string" && 
        hasOwnProperty(data, key) && 
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
  IsMatch(data: Value, where: Where): boolean {
    let status = true;
    for (const key of Object.keys(where)) {
      const value = get(data, key);
      const text = get(where, key);
      // 判断其中一个结果是否为数组
      if (text && Array.isArray(text)) {
        // 如果列表数据存与查询数据集合中其中一个匹配，则证明单次比对成功
        if (_.includes(text, value)) {
          continue;
        } else if (Array.isArray(value) && _.size(_.intersection(where[key], value)) > 0) {
          continue;
        } else {
          // 假如有一次匹配失败，则此次比较任务失败
          status = false;
          break;
        }
      } else {
        // 假如值的结果不相等，假如key不存在
        if (text !== value || !hasOwnProperty(data, key)) {
          // 假设 key 值是数组
          if (_.includes(concat(value), text)) {
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
    return (value: Value) => {
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
  private whereAll(limit: number = 0): Value[] {
    const result: Value[] = [];
    let status = false;
    for (const map of this.data.values()) {
      for (const item of map.values()) {
        result.push(item);
        if (limit > 0 && result.length >= limit) {
          status = true;
          break;
        }
      }
      if (status) {
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
  Where(where: Where = {}, limit: number = 0, like: boolean): Value[] {
    const keys = Object.keys(where);
    if (keys.length === 0) {
      return this.whereAll(limit);
    }
    let flag = true;
    let result: Value[] = [];
    // 主外键查询
    if (keys.length === 1 && !like) {
      // 外键查询
      if (this.foreign in where) {
        for(const key of [].concat(where[this.foreign])) {
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
      if (this.primary in where) {
        for(const key of [].concat(where[this.primary])) {
          for(const map of this.data.values()) {
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
    }

    // 正常查询
    const match = this.Matcher(where, like);
    for(const key of this.data.keys()) {
      const map = this.data.get(key);
      if (!map) {
        continue;
      }
      for(const index of map.keys()) {
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
   * 模糊查询
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   */
  like(where: Where, limit?: number): Value[] {
    return this.Where(where, limit, true);
  }
  /**
   * 匹配查询
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   */
  select(where?: Where, limit?: number): Value[] {
    const array = this.Where(where, limit, false);
    return _.sortBy(array, [this.indexKey]);
  }


  /**
   * 查询元素子级数据
   * @param where 查询条件
   */
  children(where: Where): Value[] {
    if (!where) {
      throw "function children: where cannot be undefined"
    }
    const array: Value[] = [];
    for (const item of this.select(where)) {
      const value = get(item, this.primary);
      const map = this.data.get(value);
      if (map) {
        array.push(...map.values());
      }
    }
    return array;
  }
  /**
   * 查询所有子级数据，相对 children 方法，该方法会进行递归查询
   * @param where 
   * @param childrenKey 
   */
  childrenDeep(where?: Where, childrenKey: string = "children"): Value[] {
    const deep = (query: Where): Value[] => {
      const list = this.children(query);
      for(const item of list) {
        const array = deep(item as Where);
        if (array && array.length > 0) {
          set(item, childrenKey, array);
        }
      }
      return _.sortBy(list, [this.indexKey]);
    };
    const result: Value[] = [];
    // if (!where) {
    //   where = { [this.foreign]: this.foreignValue };
    // }
    // for(const item of this.select(where)) {
    //   const query: Where = { [this.primary]: get(item, this.primary) };
    //   const array = deep(query);
    //   if (array && array.length) {
    //     set(item, childrenKey, array);
    //   }
    //   result.push(item);
    // }
    return result;
  }


  private add(foreign: string, item: Value): string {
    // 判断是否存在主健
    if (!hasOwnProperty(item, this.primary) ) {
      // @ts-ignore
      item[this.primary] = UUid();
    }
    const key = get(item, this.primary);
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
  insert(row: Value | Value[]): Array<string | number> {
    const keys: Array<string | number> = [];
    if (!row) {
      return keys;
    }
    const list = flatten<Value>(
      concat<Value>(row as Value[]), 
      "children", 
      this.primary, 
      this.foreign, 
      this.foreignValue
    );
    for(let i = 0, len = list.length; i < len; i++){
      const item = { ...list[i] };
      const index = this.getIndex();
      // 判断是否有排序字段
      if (!hasOwnProperty(item, this.indexKey)) {
        // @ts-ignore
        item[this.indexKey] = index;
      }
      if (hasOwnProperty(item, this.foreign)) {
        const pid = get(item, this.foreign);
        keys.push(this.add(pid, item));
      } else {
        keys.push(this.add(this.unknownKey, item));
      }
    }
    return keys;
  }
  // /**
  //  * 修改数据中的主键
  //  */
  // private _updatePrimaryKey(originKey: string | number, newKey: string | number): void {
  //   const foreignKeys = this.data.keys();
  //   for(const foreignKey of foreignKeys) {
  //     const map = this.data.get(foreignKey);
  //     if(map.has(originKey)) {
  //       const value = map.get(originKey);
  //       map.delete(originKey);
  //       map.set(newKey, value);
  //     }
  //   }
  // }
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
  remove(where: Where): number {
    const list = this.select(where);
    const data = new Map<string, Value>();
    for(const item of list) {
      const childrenKey: string = "children";
      const value = this.childrenDeep(pick(item, [this.primary]), childrenKey);
      const temp = flatten(value, childrenKey, this.primary, this.foreign, this.foreignValue);
      for (const item of temp) {
        const key: string = get(item, this.primary);
        data.set(key, item);
        this.data.delete(key); // 删除子数据
      }
    }
    for (const map of this.data.values()) {
      for (const key of data.keys()) {
        map.delete(key); // 删除数据
      }
    }
    return data.size;
  }
  /** 清空整个 DB 数据 */
  clear (): void {
    const data = new Map();
    data.set(this.unknownKey, new Map());
    this.data = data
  }
  /** 清空某元素数据，只保留 primary & foreign 属性 */
  empty(where: Where): void {
    const array = this.select(where);
    for(const item of array) {
      const value = pick(item, [this.primary, this.foreign, this.indexKey]);
      const map = this.data.get(get(item, this.foreign));
      if (map) {
        map.set(get(item, this.primary), value as Value);
      }
    }
  }
}