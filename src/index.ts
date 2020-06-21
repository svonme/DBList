/**
 * @file DBList
 * @author svon.me@gmail.com
 */

const _ = require('lodash');

interface DataItem {
  [key: string]: any;
};

interface Where extends DataItem{
}; 

class Basis {
  public data: Array<DataItem>;
  constructor(list: Array<DataItem>) {
    this.data = [].concat(list || []);
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
   * 查询任务
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   * @param data  查询的数据
   * @param like  是否模糊查询
   */
  Where(where: Where = {}, limit: number = 0, like: boolean): Array<DataItem> {
    const result = [];
    if (_.keys(where).length === 0) {
      if (limit > 0) {
        result.push(...this.data.slice(0, limit));
      } else {
        result.push(...this.data);
      }
    } else {
      const match = this.Matcher(where, like);
      for (let i = 0, len = this.data.length; i < len; i++) {
        const item = this.data[i];
        const status = match(item);
        if (status) {
          result.push(item);
          // 假如查询数据长度达到限制
          if (limit > 0 && result.length >= limit) {
            break;
          }
        }
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
      this.data.push(list[i])
    }
    return list.length;
  }
  /**
   * 修改
   * @param where 需要修改的数据的查询条件
   * @param value 新的数据
   * @param limit 限制受影响的行数
   */
  update(where: Where, value: DataItem, limit: number): number {
    const list = this.select(where, limit);
    for (let i = 0, len = list.length; i < len; i++) {
      Object.assign(list[i], value);
    }
    return list.length;
  }
  /**
   * 删除数据
   * @param where 需要删除的数据的查询条件
   */
  remove(where: Where): number {
    if (_.keys(where).length < 1) {
      return 0;
    }
    const data = this.data;
    const match = this.Matcher(where); // 剩余的数据(排除需要删除的数据)
    const surplus = [];
    const length = data.length;
    for (let i = 0; i < length; i++) {
      const item = data[i];
      const status = match(item);
      if (status) {
        continue;
      } else {
        surplus.push(item);
      }
    }
    if (surplus.length < length) {
      this.data = surplus;
      return length - surplus.length;
    }
    return 0;
  }
}



class DB extends Basis {
  /** DB 名称 */
  protected name: string;
  /** 主健 */
  protected primaryKey: string;
  /** 外健 */
  protected foreignKey: string;
  /** 第一层外键值 */
  protected foreignKeyValue: string | number;
  constructor(name: string, list: Array<DataItem> = [], primaryKey?: string, foreignKey?: string, foreignKeyValue?: string) {
    super(list); // 设置数据库名称
    const r = Math.random() * 10000;
    this.setName(name || `table-${parseInt(r as any, 10)}`);
    this.primaryKey = primaryKey;
    this.foreignKey = foreignKey;
    this.foreignKeyValue = foreignKeyValue || '0';
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
    const list: Array<DataItem> = [];
    for (let i = 0, len = this.data.length; i < len; i++) {
      const item = Object.assign({}, this.data[i]);
      if (callback) {
        const value = callback(item);
        if (value) {
          list.push(value);
        }
      } else {
        list.push(item);
      }
    }
    return list;
  }
  /** 以下法必须配置 primaryKey & foreignKey */
  flatten(list: Array<DataItem>, childrenKey: string): Array<DataItem> {
    if (!this.primaryKey || !this.foreignKey) {
      throw new Error('primaryKey & foreignKey cannot be empty');
    }
    const data: Array<DataItem> = [];
    const deep = (array: Array<DataItem>, foreignKey: string | number) => {
      for (let i = 0, len = array.length; i < len; i++) {
        const item = array[i];
        // 判断主键是否存在
        if (!item[this.primaryKey]) {
          item[this.primaryKey] = _.uniqueId('item_');
        }
        const primaryKey = item[this.primaryKey];
        // 判断外键是否存在
        if (!item[this.foreignKey]) {
          item[this.foreignKey] = foreignKey;
        }
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
    if (!this.primaryKey || !this.foreignKey) {
      throw new Error('primaryKey & foreignKey cannot be empty');
    }
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
    deep(where);
    return result;
  }
  /**
   * 查询父级数据，与 children 方法进行相反方向查询
   * @param where 
   * @param limit 
   */
  parent(where: Where): Array<DataItem> {
    if (!this.primaryKey || !this.foreignKey) {
      throw new Error('primaryKey & foreignKey cannot be empty');
    }
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
    deep(this.parent(where));
    return result;
  }
}

module.exports = DB;
exports.default = DB;