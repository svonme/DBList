
let _UUIDIndex = 1;

export const UUid = function() {
  const id = `uuid_${ _UUIDIndex++ }`;
  const key = String(Math.random()).slice(2);
  return `${id}_${key}`;
}

export const keys = function<T = object>(value: T): string[] {
  return value ? Object.keys(value as object) : [];
}

export const hasOwnProperty = function(value: any, key: string) {
  if (value && key && value.hasOwnProperty) {
    return value.hasOwnProperty(key);
  }
  if (value && key && typeof value === "object") {
    if (key in value) {
      return true;
    }
  }
  return false;
}

export const get = function(value: any, key: string) {
  if (hasOwnProperty(value, key)) {
    return value[key];
  }
}

export const set = function<T = object>(data: T, key: string | number, value: any): T {
  if (data instanceof Map) {
    data.set(key, value);
  } else {
    // @ts-ignore
    Object.assign(data, { [key]: value });
  }
  return data;
}


// export const size = function(value: string | Array<any> | object): number {
//   if (typeof value === "string" || Array.isArray(value)) {
//     return value.length;
//   }
//   if (typeof value === "object") {
//     return size(keys(value));
//   }
//   return 0;
// }

// export const forEach = function<T>(list: T[] | IterableIterator<T>, iteratee: (value: T, index: number, list: T[]) => boolean | void) {
//   const array = Array.isArray(list) ? list : concat(list);
//   const size = array.length;
//   if (size === 0 || !iteratee) {
//     return;
//   }
//   for (let index = 0; index < size; index++) {
//     const quit = iteratee(array[index], index, array);
//     if (quit) {
//       break;
//     }
//   }
// }

export const includes = function(value: string | string[] | number[], target: string | number, like: boolean = false): boolean {
  let status: boolean = false;
  if (target && value && Array.isArray(value)) {
    // @ts-ignore
    status = value.includes(target);
  } else if (target && value) {
    status = String(value).includes(target as string);
  }
  if (like && !status) {
    const text = (Array.isArray(value) ? JSON.stringify(value) : String(value)).trim().toLowerCase();
    const keyworkd = String(target).toLowerCase().replace(/[\s\*]+/g, ""); // 转换为小写并且过滤空格与*号
    const res: string[] = [];
    let data = text.slice(0);
    for (let index = 0, len = keyworkd.length; index < len; index++) {
      const char = keyworkd[index];
      const i = data.indexOf(char);
      if (i >= 0) {
        res.push(char);
        data = data.slice(i + 1);
      } else {
        break;
      }
    }
    if (res.length >= keyworkd.length) {
      status = true;
    }
  }
  return status;
}

export const omit = function<T = object, Value = T>(data: T, keyList: string[]): Value {
  if (keyList.length < 1) {
    return data as any;
  }
  const value = {};
  const list = keys(data as object);
  for (let i = 0, size = list.length; i < size; i++) {
    const key = list[i];
    if (includes(keyList, key)) {
      continue;
    }
    set(value, key, get(data, key));
  }
  return value as Value;
}

// export const pick = function<T = object, Value = T>(data: T, keyList: string[]): Value {
//   const value = {};
//   for (let i = 0, size = keyList.length; i < size; i++) {
//     set(value, keyList[i], get(data, keyList[i]));
//   }
//   return value as Value;
// }



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

export const compare = function(origin: any, value: any, like: boolean = false): boolean {
  const type = typeof origin;
  let status = false;
  // 判断两个元素类型是否相同
  if (type === typeof value) {
    if (type === "string" || type === "number") {
      if (like) {
        status = includes(origin, value, true);
      } else {
        // 字符串或者数字类型时直接使用值判断
        status = origin === value;
      }
      return status;
    }
    if (Array.isArray(origin) && origin.length === value.length) {
      // 如果是数组，则判断每一个元素的值是否相同
      for (let i = 0, len = origin.length; i < len; i++) {
        status = compare(origin[i], value[i], like);
        if (status) {
          // 继续判断下一个元素
          continue;
        } else {
          break;
        }
      }
    }
  }
  return status;
}
export const compareArray = function(origin: any, value: any): boolean {
  if (value instanceof Set) {
    return value.has(origin);
  }
  if (Array.isArray(value)) {
    return compareArray(origin, new Set(value));
  }
  return compare(origin, value, false);
}
export const compareLikeArray = function(origin: any, value: any): boolean {
  if (value instanceof Set) {
    let status = false;
    const list = concat(value);
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      status = compareLikeArray(origin, item);
      if (status) {
        break;
      }
    }
    return status;
  }
  if (Array.isArray(value)) {
    return compareLikeArray(origin, new Set(value));
  }
  return compare(origin, value, true);
}

export const concat = function<T>(...args: Array<T | T[] | IterableIterator<T>>): T[] {
  const list: T[] = [];
  for (let i = 0, size = args.length; i < size; i++) {
    const item = args[i];
    if (Array.isArray(item)) {
      const temp = [].concat(item as any);
      list.push(...concat<T>(...temp));
    } else if (isIterator(item)){
      // @ts-ignore
      list.push(...item);
    } else {
      // @ts-ignore
      list.push(item);
    }
  }
  return list;
}