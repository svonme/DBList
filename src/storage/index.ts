
import DB from "./db";

import * as _ from "../util";

const Compare = Symbol("Compare");

export default class Storage<Value = object> extends DB<Value> {
  constructor(
    readonly primary: string = "id",
    readonly foreign: string = "pid",
    readonly foreignValue: string | number = 0
  ) {
    super(primary);
  }
  insert(row?: any): Array<string | number> {
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
      "children", 
      this.primary, 
      this.foreign, 
      this.foreignValue, 
      callback
    );
    return super.insert(list);
  }
  private [Compare] (list: Map<string | number, any>[], key: string | number, value: any) {
    const array: Map<string | number, any>[] = [];
    for (let i = 0, len = list.length; i < len; i++) {
      const data = list[i];
      // 从查询到集合中匹配符合条件的数据
      const matcher = this.Matcher(data);
      const status = matcher(key, value);
      if (status) {
        array.push(data);
      }
    }
    return array;
  }
  select(where: object, limit: number = 0) {
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
      if (limit > 0 && list.length === limit) {
        break;
      }
    }
    return list.map(Object.fromEntries);
  }
};