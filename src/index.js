/**
 * @file 数组查询
 * @author svon.me@gmail.com
 */

const _ = require('lodash');

const Where = Symbol('where');
const Matcher = Symbol('matcher');
const IsMatch = Symbol('isMatch');

class Basis {
  constructor(result) {
    this.data = [].concat(result || []);
  }
  /**
   * 返回对象是否具有给定的 key：value 集合
   * @param data   要匹配的对象
   * @param where  要查询的条件
   * @param link   是否模糊查询
   */


  [IsMatch](data, where, like) {
    if (!data) {
      return false;
    }

    const keys = _.keys(where);

    const length = keys.length;
    let status = true;

    if (like) {
      for (let i = 0; i < length; i++) {
        const key = keys[i];

        if (data.hasOwnProperty(key) && _.includes(where[key], data[key])) {
          continue;
        } else {
          status = false;
          break;
        }
      }

      return status;
    }

    for (let i = 0; i < length; i++) {
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


  [Matcher](where, like) {
    return value => {
      return this[IsMatch](value, where, like || false);
    };
  }
  /**
   * 查询任务
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   * @param data  查询的数据
   * @param like  是否模糊查询
   */


  [Where](where = {}, limit = 0, data, like) {
    let result = [];

    if (_.keys(where).length === 0) {
      if (limit > 0) {
        result = data.slice(0, limit);
      } else {
        result = [].concat(data);
      }
    } else {
      const match = this[Matcher](where, like);

      for (let i = 0, len = data.length; i < len; i++) {
        const item = data[i];
        const status = match(item);

        if (status) {
          result.push(item); // 假如查询数据长度达到限制

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


  like(where, limit) {
    return this[Where](where, limit, this.data, true);
  }
  /**
   * 匹配查询
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   */


  select(where, limit) {
    return this[Where](where, limit, this.data, false);
  }
  /**
   * 匹配查询且只返回第一条结果
   * @param where 要查询的条件
   */


  selectOne(where) {
    const result = this.select(where, 1);
    return result[0] || void 0;
  }
  /**
   * 添加数据
   * @param row
   */


  insert(row) {
    if (!row) {
      return false;
    }

    const data = [].concat(row);

    for (let i = 0, len = data.length; i < len; i++) {
      this.data.push(data[i]);
    }

    return true;
  }
  /**
   * 修改
   * @param where 需要修改的数据的查询条件
   * @param value 新的数据
   * @param limit 限制受影响的行数
   */


  update(where, value, limit) {
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


  remove(where) {
    if (_.keys(where).length < 1) {
      return 0;
    }

    const data = this.data;
    const match = this[Matcher](where); // 剩余的数据(排除需要删除的数据)

    const surplus = [];
    const size = data.length;

    for (let i = 0; i < size; i++) {
      const item = data[i];
      const status = match(item);

      if (status) {
        continue;
      } else {
        surplus.push(item);
      }
    }

    if (surplus.length < size) {
      this.data = surplus;
      return size - surplus.length;
    }

    return 0;
  }

}

class DB extends Basis {
  /** DB 名称 */

  /** 主健 */

  /** 外健 */
  constructor(name, list = [], primaryKey, foreignKey) {
    super(list); // 设置数据库名称

    this.setName(name || `table-${parseInt(Math.random() * 10000, 10)}`);
    this.primaryKey = primaryKey;
    this.foreignKey = foreignKey;
  }

  setName(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  clone(callback) {
    const list = [];

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


  flatten(list, childrenKey) {
    if (!this.primaryKey || !this.foreignKey) {
      throw new Error('primaryKey & foreignKey cannot be empty');
    }

    const data = [];

    const deep = (array, foreignKey = 0) => {
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

        const children = [].concat(item[childrenKey] || []);
        data.push(value);

        if (children.length > 0) {
          deep(children, primaryKey);
        }
      }
    };

    deep(list);
    return data;
  }
  children(where, limit = 0) {
    if (!this.primaryKey || !this.foreignKey) {
      throw new Error('primaryKey & foreignKey cannot be empty');
    }
    const itemList = this.select(where);
    const result = new Array();
    for (let i = 0, len = itemList.length; i < len; i++) {
      if (i >= limit && limit > 0) {
        break;
      }

      const item = itemList[i];
      const childrenWhere = {};
      childrenWhere[this.foreignKey] = item[this.primaryKey];
      const children = this.select(childrenWhere);
      const array = _.compact([].concat(item, children));

      result.push(array);
    }
    return result;
  }
  childrenDeep(where, limit) {
    const deep = result => {
      let deepResult = [];
      _.each(result, list => {
        const children = list.slice(1);
        const array = [].concat(list.slice(0, 1));
        for(let i = 0, len = children.length; i < len; i++) {
          const node = children[i];
          const childrenWhere = {};
          childrenWhere[this.primaryKey] = node[this.primaryKey];
          const temp = deep(this.children(childrenWhere));
          array.push(...temp);
        }
        deepResult.push(...array);
      });
      return deepResult;
    };
    return deep(this.children(where, limit));
  }
  parent(where, limit = 0) {
    if (!this.primaryKey || !this.foreignKey) {
      throw new Error('primaryKey & foreignKey cannot be empty');
    }
    const itemList = this.select(where);
    const result = new Array();
    for (let i = 0, len = itemList.length; i < len; i++) {
      if (i >= limit && limit > 0) {
        break;
      }
      const item = itemList[i];
      const parenWhere = {};
      parenWhere[this.primaryKey] = item[this.foreignKey];
      const parent = this.select(parenWhere);
      const array = _.compact([].concat(item, parent));
      result.push(array);
    }
    return result;
  }
  parentDeep(where, limit) {
    const deep = result => {
      let deepResult = [];
      _.each(result, list => {
        const parents = list.slice(1);
        const array = [].concat(list.slice(0, 1));
        console.log(array, parents);

        for(let i = 0, len = parents.length; i < len; i++) {
          const node = parents[i];
          const parenWhere = {};
          parenWhere[this.primaryKey] = node[this.primaryKey];
          const temp = deep(this.parent(parenWhere));
          array.push(...temp);
        }
        deepResult.push(...array);
      });
      return deepResult;
    };
    return deep(this.parent(where, limit));
  }

}

module.exports = DB;
exports.default = DB;