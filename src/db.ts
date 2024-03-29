import * as _ from "./util";

export const Add = Symbol("add");
export const Get = Symbol("Get");
export const Remove = Symbol("Remove");
export const Update = Symbol("Update");
export const Matcher = Symbol("Matcher");
export const IsMatch = Symbol("IsMatch");
export const GetTable = Symbol("GetTable");
export const GetPrimary = Symbol("GetPrimary");

export const DefForeignValue = -1;
export const DefPrimary = "id";
export const DefForeign = "pid";
export const DefChildrenKey = "children";

export class DB<Value = object> {
  protected db: Map<string | number, Map<string | number, any>>;
  constructor(readonly primary: string = "id") {
    this.db = new Map<string | number, Map<string | number, any>>();
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
  static flatten<T>(
    list: T | T[], 
    childrenKey: string = DefChildrenKey, 
    primary: string = DefPrimary, 
    foreign: string = DefForeign, 
    foreignValue: string | number = DefForeignValue,
    iteratee?: (value: T) => T
  ){
    const data: T[] = [];
    if (!list) {
      return data;
    }
    const array = _.concat<T>(list as any);
    for (let i = 0, size = array.length; i < size; i++) {
      const item = array[i];
      // 判断主键是否存在
      if (!_.hasOwnProperty(item, primary)) {
        _.set(item, primary, _.UUid());
      }
      // 判断外键是否存在
      if (!_.hasOwnProperty(item, foreign)) {
        _.set(item, foreign, foreignValue);
      }
      const key = _.get(item, primary);
      const value = _.omit(item, [childrenKey]);
      if (iteratee && typeof iteratee === "function") {
        data.push(iteratee(value));
      } else {
        data.push(value);
      }
      if (_.hasOwnProperty(item, childrenKey)) {
        const children = DB.flatten(
          _.get(item, childrenKey), 
          childrenKey, 
          primary, 
          foreign, 
          key, 
          iteratee
        );
        if (children && children.length > 0) {
          data.push(...children);
        }
      }
    }
    return data;
  }
  /**
   * 数据长度
   * @returns 
   */
  size(): number {
    const table = this.db.get(this.primary);
    return table?.size || 0;
  }
  /**
   * 清空数据
   */
  clear(): void {
    this.db = new Map<string | number, Map<string | number, any>>();
  }
  /**
   * 查询所有数据
   * @returns 
   */
  toData(): Array<Map<string | number, any>> {
    const table = this.db.get(this.primary);
    const keys = _.concat(table?.keys() || []);
    const list: Map<string | number, any>[] = [];
    for (let i = 0, len = keys.length; i < len; i++) {
      const id = keys[i];
      const value = this[GetTable](id);
      list.push(value);
    }
    return list;
  }
  /**
   * 返回对象是否具有给定的 key：value 集合
   * @param data   要匹配的对象
   * @param where  要查询的条件
   * @param link   是否模糊查询
   */
  private [IsMatch](data: Map<string | number, any>, key: string | number, value: any, link: boolean = false): boolean {
    if (link) {
      return _.compareLikeArray(data.get(key), value);
    }
    return _.compareArray(data.get(key), value);
  }

  /**
   * 创建匹配任务
   * @param primary 
   * @param link   是否模糊查询
   * @returns 
   */
  protected [Matcher](primary: string | number | Map<string | number, any>, link?: boolean): (key: string | number, value: any) => boolean {
    let table: Map<string | number, any>;
    if (typeof primary === "object") {
      table = primary;
    } else {
      table = this[GetTable](primary) as Map<string | number, any>;
    }
    return (key: string | number, value: any): boolean => {
      return this[IsMatch](table, key, value, link);
    };
  }
  /**
   * 根据主键匹配出相关的数据
   * @param primary 
   * @returns 
   */
  private [GetTable](primary: string | number) {
    const data = new Map<string | number, any>();
    const keys = _.concat(this.db.keys());
    for (let index = 0, size = keys.length; index < size; index++) {
      const key = keys[index];
      const table = this.db.get(key);
      const value = table?.get(primary);
      data.set(key, value);
    }
    return data;
  }
  /**
   * 根据条件筛选出所有符合的主键
   * @param key   
   * @param value 
   * @param like  是否模糊匹配
   * @param limit 限制数据条数
   * @returns 
   */
  private [GetPrimary](key: string | number, value: any, like: boolean = false, limit: number = 0) {
    const primaryList: Array<string | number> = [];
    const table = this.db.get(key);
    if (table) {
      const keys = _.concat(table.keys());
      for (let index = 0, size = keys.length;  index < size; index++) {
        const key = keys[index];
        const item = table.get(key);
        if (like && _.compareLikeArray(item, value)) {
          primaryList.push(key);
        } else if (_.compareArray(item, value)) {
          primaryList.push(key);
        }
        if (limit > 0 && primaryList.length >= limit) {
          break;
        }
      }
    }
    return primaryList;
  }
  private [Add] (item: Value): string | number {
    if (!_.hasOwnProperty(item, this.primary)) {
      _.set(item, this.primary, _.UUid());
    }
    const keys = _.keys(item);
    const primary = _.get(item, this.primary);
    for (let index = 0, size = keys.length; index < size; index++) {
      const key = keys[index];
      const value = _.get(item, key);
      let table;
      if (this.db.has(key)) {
        table = this.db.get(key);
        if (table) {
          table.set(primary, value);
          continue;
        }
      }
      table = new Map<string | number, any>();
      this.db.set(key, table);
      table.set(primary, value);
    }
    return primary;
  }
  protected [Update](data: Value) {
    const keys = _.keys(data);
    const primary = _.get(data, this.primary);
    for (let index = 0, size = keys.length; index < size; index++) {
      const key = keys[index];
      const value = _.get(data, key);
      let table = this.db.get(key);
      if (table) {
        table.set(primary, value);
      } else {
        table = new Map<string | number, any>();
        table.set(primary, value);
        this.db.set(key, table);
      }
    }
  }
  /**
   * 添加数据
   * @param row 数据列表 
   * @returns 
   */
  insert(row: Value[]): Array<string | number> {
    const list: Array<string | number> = [];
    for (let index = 0, len = row.length; index < len; index++) {
      const value = row[index];
      list.push(this[Add](value));
    }
    return list;
  }
  /**
   * 根据主键删除相关数据
   * @param primary 
   * @returns 
   */
  protected [Remove](primary: string | number): boolean {
    let status = false;
    const list = _.concat(this.db.values());
    for (let i = 0, len = list.length; i < len; i++) {
      const table = list[i];
      if (table.has(primary)) {
        status = true;
        table.delete(primary);
      }
    }
    return status;
  }
  /**
   * 根据 key value 查询相关的所有数据
   * @param key 
   * @param value 
   * @param like  是否模糊匹配
   * @param limit 限制数据条数
   * @returns 
   */
  protected [Get](key: string | number, value: string | number, like: boolean = false, limit?: number): Map<string | number, any>[] {
    const list: Map<string | number, any>[] = [];
    const primaryList = this[GetPrimary](key, value, like, limit);
    for (let i = 0, len = primaryList.length; i < len; i++) {
      const id = primaryList[i];
      const value = this[GetTable](id);
      list.push(value);
    }
    return list;
  }
};