import * as _ from "../util";

const Add = Symbol("add");
const GetTable = Symbol("GetTable");
const GetPrimary = Symbol("GetPrimary");

export default class DB<Value = object> {
  private db: Map<string | number, Map<string | number, any>>;
  constructor(
    readonly primary: string = "id",
    readonly foreign: string = "pid",
    readonly foreignValue: string | number = 0,
  ) {
    this.db = new Map<string | number, Map<string | number, any>>();
  }
  /**
   * 返回对象是否具有给定的 key：value 集合
   * @param data   要匹配的对象
   * @param where  要查询的条件
   * @param link   是否模糊查询
   */
   protected (data: Value, where: object): boolean {
    
  }

  /**
   * 创建匹配任务
   * @param where  要查询的条件
   * @param link   是否模糊查询
   */
   private Matcher(primary: string | number): Function {
    return (value: Value) => {
      return this.IsMatch(value, where);
    };
  }
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
  protected [GetTable](key: string | number): Map<string | number, any> {
    if (this.db.has(key)) {
      return this.db.get(key)!;
    }
    const table = new Map<string | number, any>();
    this.db.set(key, table);
    return table;
  }
  private [Add] (item: Value): string | number {
    const keys = _.keys(item);
    const primary = _.get(item, this.primary);
    for (let index = 0, size = keys.length; index < size; index++) {
      const key = keys[index];
      const value = _.get(item, key);
      const table = this[GetTable](key);
      table.set(primary, value);
    }
    return primary;
  }
  insert(row?: Value | Value[]): Array<string | number> {
    const primaryList: Array<string | number> = [];
    if (!row) {
      return primaryList;
    }
    const list = _.flatten<Value>(
      _.concat<Value>(row as Value[]), 
      "children", 
      this.primary, 
      this.foreign, 
      this.foreignValue
    );
    for (let index = 0, size = list.length; index < size; index++) {
      const value = list[index];
      
      if (!_.hasOwnProperty(value, this.primary)) {
        _.set(value, this.primary, _.UUid());
      }
      if (!_.hasOwnProperty(value, this.foreign)) {
        _.set(value, this.foreign, this.foreignValue);
      }
      primaryList.push(this[Add](value));
    }
    return primaryList;
  }
  protected get(key: string | number, value: string | number): Value[] {
    const list: Value[] = [];
    const primaryList = this[GetPrimary](key, value);
    for (const id of primaryList) {
      const data = {};
      const names = _.concat(this.db.keys());
      for (let index = 0, size = names.length; index < size; index++) {
        const name = names[index];
        const table = this.db.get(name);
        _.set(data, String(name), table?.get(id));
      }
      list.push(data as Value);
    }
    return list;
  }
};