/**
 * @file DBList
 * @author svon.me@gmail.com
 */







class DB extends Basis {
  constructor(list: Array<DataItem> = [], primaryKey: string = 'id', foreignKey: string = 'pid', foreignKeyValue: string | number = '0', indexName: string = 'dbIndex') {
    // 如果第一个参数为字符串，则为无效参数（旧版本有该参数，0.2.4版本时已取消）
    if (_.isString(list)) {
      console.warn('Dblist has removed the name field in version 0.2.4');
      list = primaryKey as any
      primaryKey = foreignKey
      foreignKey = String(foreignKeyValue)
      foreignKeyValue = '0'
      indexName = void 0
    }
    super(list, primaryKey, foreignKey, foreignKeyValue, indexName);
  }
  selectOne<T extends DataItem>(where: Where): T {
    if (!where) {
      throw "function selectOne: where cannot be undefined"
    }
    const [ data ]: T[] = this.select<T>(where, 1);
    return data;
  }
  /**
   * 复制一份数据
   * @param callback 可以对每一个元素作处理
   */
  clone<T extends DataItem>(callback?: Function): T[] {
    const array: T[] = this.select<T>();
    if (callback) {
      const list: T[] = [];
      for (let i = 0, len = array.length; i < len; i++) {
        const value = callback(Object.assign({}, array[i]));
        if (value) {
          list.push(value);
        }
      }
      return list;
    }
    return array;
  }
  /** 以下法必须配置 primaryKey & foreignKey */
  flatten<T extends DataItem>(list: T[], childrenKey: string = "children"): T[] {
    if (!list) {
      throw "function flatten: list cannot be undefined"
    }
    const data: T[] = [];
    const deep = (array: T[], foreignKey: string | number): void => {
      for (let i = 0, len = array.length; i < len; i++) {
        const item: DataItem = array[i];
        // 判断主键是否存在
        if (!(this.primaryKey in item)) {
          item[this.primaryKey] = UUid();
        }
        // 判断外键是否存在
        if (!(this.foreignKey in item)) {
          item[this.foreignKey] = foreignKey;
        }
        const primaryKey = item[this.primaryKey];
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
   */
  children<T extends DataItem>(where: Where): T[] {
    if (!where) {
      throw "function children: where cannot be undefined"
    }
    let item: T;
    if (this.primaryKey in where && this.foreignKey in where) {
      item = Object.assign({}, where) as T;
    } else {
      item = Object.assign({}, this.selectOne<T>(where)) as T;
    }
    if (item) {
      const childrenWhere: Where = {};
      childrenWhere[this.foreignKey] = item[this.primaryKey];
      return _.map(this.select<T>(childrenWhere), (data: DataItem) => _.clone(data));
    }
    return [];
  }
  /**
   * 查询所有子级数据，相对 children 方法，该方法会进行递归查询
   * @param where 
   * @param childrenKey 
   */
  childrenDeep<T extends DataItem>(where: Where, childrenKey: string = 'children'): T[] {
    const deep = (query: Where): Array<DataItem> => {
      const list: any = this.children<T>(query);
      for(const item of list) {
        const array = deep(item as Where);
        if (array && array.length) {
          item[childrenKey] = array
        }
      }
      return _.sortBy(list, [this.indexName]) as T[];
    };
    const result: T[] = [];
    if (!where) {
      where = {};
      where[this.foreignKey] = this.foreignKeyValue;
    }
    for(const item of this.select<T>(where)) {
      const data: DataItem = Object.assign({}, item);
      const query: Where = {};
      query[this.primaryKey] = data[this.primaryKey];
      const array = deep(query);
      if (array && array.length) {
        data[childrenKey] = array
      }
      result.push(data as T);
    }
    return result;
  }
  /**
   * childrenDeep + Flatten 组合
   * @param list 
   * @param childrenKey 
   */
  childrenDeepFlatten<T extends DataItem>(where: Where, childrenKey: string = 'children'): T[] {
    const result = this.childrenDeep(where, childrenKey);
    const db = new DB([], this.primaryKey, this.foreignKey, this.foreignKeyValue);
    const array = db.flatten(result, childrenKey);
    db.insert(array);
    return db.clone<T>()
  }
  /**
   * 查询父级数据，与 children 方法进行相反方向查询
   * @param where 
   */
  parent<T extends DataItem>(where: Where): T {
    if (!where) {
      throw "function parent: where cannot be undefined"
    }
    if (this.foreignKey in where) {
      const parentWhere: Where = {};
      parentWhere[this.primaryKey] = where[this.foreignKey];
      const value: T = this.selectOne<T>(parentWhere)
      return value ? _.clone(value) : void 0;
    } else {
      const item = this.selectOne<T>(where);
      if (item) {
        const parentWhere: Where = {};
        parentWhere[this.primaryKey] = item[this.foreignKey];
        const value: T = this.selectOne<T>(parentWhere)
        return value ? _.clone(value) : void 0;
      }
      return void 0;
    }
  }
  /**
   * 查询所有父级数据，与 childrenDeep 方法进行相反方向查询
   * @param where 
   * @param parentKey 
   */
  parentDeep<T extends DataItem>(where: Where, parentKey: string = 'parent'): T[] {
    const result: T[] = []
    const deep = (where: Where): DataItem => {
      const parent = this.parent(where);
      if (parent) {
        parent[parentKey] = deep(parent);
      }
      return parent;
    }
    for(const item of this.select(where)) {
      const data: DataItem = Object.assign({}, item);
      const parent = deep(data);
      if (parent) {
        data[parentKey] = parent
      }
      result.push(data as T);
    }
    return result;
  }
  /**
   * parentDeep + Flatten 组合
   * @param list 
   * @param childrenKey 
   */
  parentDeepFlatten<T extends DataItem>(where: Where, childrenKey: string = 'children'): T[] {
    const result = this.parentDeep(where, childrenKey);
    const db = new DB([], this.primaryKey, this.foreignKey, this.foreignKeyValue);
    const array = db.flatten(result, childrenKey);
    db.insert(array);
    return db.clone<T>()
  }
  /**
   * 查询兄弟元素
   * @param where 
   */
  siblings<T extends DataItem>(where: Where): T[] {
    if (!where) {
      throw "function siblings: where cannot be undefined"
    }
    const item = this.selectOne<T>(where);
    if (item) {
      const query: Where = {};
      query[this.foreignKey] = item[this.foreignKey];
      return this.select<T>(query);
    }
    return void 0;
  }
}


module.exports = DB;
exports.default = DB;