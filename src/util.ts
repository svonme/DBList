
import * as _ from "lodash-es";

export { sortBy, intersection } from "lodash-es";

let _UUIDIndex = 1;

export const UUid = function() {
  const id = `DBList_${ _UUIDIndex++ }`;
  const key = String(Math.random()).slice(2);
  return `${id}_${key}`;
}

export const keys = function<T = object>(value: T): string[] {
  return Object.keys(value as object);
}

export const hasOwnProperty = function(value: any, key: string) {
  if (value && key && value.hasOwnProperty) {
    return value.hasOwnProperty(key);
  }
  return false;
}

export const get = function(value: any, key: string) {
  if (hasOwnProperty(value, key)) {
    return value[key];
  }
}

export const set = function<T = object>(data: T, key: string, value: any): T {
  // @ts-ignore
  return Object.assign(data, { [key]: value });
}

export const size = function(value: string | Array<any> | object): number {
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length;
  }
  if (typeof value === "object") {
    return size(keys(value));
  }
  return 0;
}

export const forEach = function<T>(list: T[] | IterableIterator<T>, iteratee: (value: T, index: number, list: T[]) => boolean | void) {
  const array = Array.isArray(list) ? list : [...list];
  const size = array.length;
  if (size === 0 || !iteratee) {
    return;
  }
  for (let index = 0; index < size; index++) {
    const quit = iteratee(array[index], index, array);
    if (quit) {
      break;
    }
  }
}

export const includes = function(value: string | string[] | number[], target: string | number) {
  if (target && value && Array.isArray(value)) {
    // @ts-ignore
    return value.includes(target);
  }
  if (target && value) {
    return String(value).includes(target as string);
  }
  return false;
}

export const omit = function<T = object, Value = T>(data: T, keyList: string[]): Value {
  if (keyList.length < 1) {
    return data as any;
  }
  const value = {};
  const list = keys(data as object);
  for (let i = 0, size = list.length; i < size; i++) {
    const key = list[i];
    if (keyList.includes(key)) {
      continue;
    }
    set(value, key, get(data, key));
  }
  return value as Value;
}

export const pick = function<T = object, Value = T>(data: T, keyList: string[]): Value {
  const value = {};
  for (let i = 0, size = keyList.length; i < size; i++) {
    set(value, keyList[i], get(data, keyList[i]));
  }
  return value as Value;
}



export const isIterator = function(value: any): boolean {
  if (value) {
    if (typeof value === "string") {
      return false;
    }
    if (typeof value === "number") {
      return false;
    }
    if (typeof value[Symbol.iterator] === 'function') {
      return true;
    }
  }
  return false;
}

export const concat = function<T>(...args: Array<T[] | T[] | IterableIterator<T>>): T[] {
  const list: T[] = [];
  for (let i = 0, size = args.length; i < size; i++) {
    const item = args[i];
    if (Array.isArray(item)) {
      const temp = [].concat(item as any);
      list.push(...concat<T>(...temp));
    } else if (isIterator(item)){
      list.push(...item);
    } else {
      list.push(item as T);
    }
  }
  return list;
}

/**
 * 将多维数据打散，返回一个新的一维列表数据
 * @param list         列表
 * @param childrenKey  children 关键字
 * @param primary      以那个字段来区分数据的唯一性
 * @param foreign      打散后以那个字段来区分数据与数据之间的关系
 * @param foreignValue root 数据的ID
 * @returns 
 */
export const flatten = function<T>(
  list: T | T[], 
  childrenKey: string = "children", 
  primary: string = "id", 
  foreign: string = "pid", 
  foreignValue: string | number = 0
){
  if (!list) {
    throw "function flatten: list cannot be undefined"
  }
  const data: T[] = [];
  const array = concat<T>(list as any);
  for (let i = 0, size = array.length; i < size; i++) {
    const item = array[i];
    // 判断主键是否存在
    if (!hasOwnProperty(item, primary)) {
      set(item, primary, UUid());
    }
    // 判断外键是否存在
    if (!hasOwnProperty(item, foreign)) {
      set(item, foreign, foreignValue);
    }
    const key = get(item, primary);
    data.push(omit(item, [childrenKey]));
    if (hasOwnProperty(item, childrenKey)) {
      const children = flatten(get(item, childrenKey), childrenKey, primary, foreign, key);
      if (children && children.length > 0) {
        data.push(...children);
      }
    }
  }
  return data;
}