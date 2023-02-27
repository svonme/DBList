import * as _ from "../util";

const Add = Symbol("add");
const IsMatch = Symbol("IsMatch");
const GetTable = Symbol("GetTable");
const GetPrimary = Symbol("GetPrimary");

export default class DB<Value = object> {
  private db: Map<string | number, Map<string | number, any>>;
  constructor(readonly primary: string = "id") {
    this.db = new Map<string | number, Map<string | number, any>>();
  }
  /**
   * 返回对象是否具有给定的 key：value 集合
   * @param data   要匹配的对象
   * @param where  要查询的条件
   * @param link   是否模糊查询
   */
  private [IsMatch](data: Map<string | number, any>, key: string | number, value: any): boolean {
    return _.compare(data.get(key), value);
  }

  /**
   * 创建匹配任务
   * @param where  要查询的条件
   * @param link   是否模糊查询
   */
   protected Matcher(primary: string | number | Map<string | number, any>): (key: string | number, value: any) => boolean {
    let table: Map<string | number, any>;
    if (typeof primary === "object") {
      table = primary;
    } else {
      table = this[GetTable](primary) as Map<string | number, any>;
    }
    return (key: string | number, value: any): boolean => {
      return this[IsMatch](table, key, value);
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
      _.set(data, key, value);
    }
    return data;
  }
  /**
   * 根据条件筛选出所有符合的主键
   * @param key   
   * @param value 
   * @returns 
   */
  private [GetPrimary](key: string | number, value: string | number) {
    const primaryList: string[] = [];
    const table = this.db.get(key);
    if (table) {
      const keys = _.concat(table.keys());
      for (let index = 0, size = keys.length;  index < size; index++) {
        const key = keys[index];
        const item = table.get(key);
        if (item === value) {
          primaryList.push(String(key));
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
  insert(row: Value[]): Array<string | number> {
    const list: Array<string | number> = [];
    for (let index = 0, len = row.length; index < len; index++) {
      const value = row[index];
      list.push(this[Add](value));
    }
    return list;
  }
  protected get(key: string | number, value: string | number): Map<string | number, any>[] {
    const list: Map<string | number, any>[] = [];
    const primaryList = this[GetPrimary](key, value);
    for (const id of primaryList) {
      const value = this[GetTable](id);
      list.push(value);
    }
    return list;
  }
};