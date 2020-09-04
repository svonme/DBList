
interface DataItem {
  [key: string]: any;
}

interface Where extends DataItem{
}

declare class Basis {
  constructor(result?: any[])
  /**
   * 模糊查询
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   */
  like<T>(where?: Where, limit?: number): T[]
  /**
   * 匹配查询
   * @param where 要查询的条件
   * @param limit 限定查询结果条数
   */
  select<T>(where?: Where, limit?: number): T[]
  /**
   * 添加数据
   * @param row
   */
  insert(row: object): boolean
  /**
   * 修改
   * @param where 需要修改的数据的查询条件
   * @param value 新的数据
   */
  update(where: Where, value: object): number
  /**
   * 删除数据
   * @param where 需要删除的数据的查询条件
   */
  remove(where: Where): number
}

declare class DB extends Basis {
  constructor(list?: any[], primaryKey?: string, foreignKey?: string)
  /**
   * 匹配查询且只返回第一条结果
   * @param where 要查询的条件
   */
  selectOne<T>(where?: Where): T
  /**
   * 复制一份数据
   * @param callback 可以对每一个元素作处理
   */
  clone<T>(callback?: Function): T[]
  /**
   * /**
   * 将递归数据转换为一维数组
   * 以下法必须配置 primaryKey & foreignKey
   * @param list 需要转换的数组
   * @param childrenKey 以什么字段进行深层递归
   * @description
   * const list = [
   *  {
   *    value: 1,
   *    children: [      // 此处 children 对应 childrenKey
   *      {
   *        value: 2,
   *        children: [
   *          {
   *            value: 3
   *          }
   *        ]
   *      }
   *    ]
   *  }
   * ]
   */
  flatten<T>(list: Array<DataItem>, childrenKey?: string): T[]
  /**
   * 查询元素子级数据
   * @param where 查询条件
   */
  children<T>(where: Where) : T[]
  /**
   * 查询所有子级数据，相对 children 方法，该方法会进行递归查询
   * @param where 
   * @param childrenKey  子级数据的键名
   */
  childrenDeep<T>(where: Where, childrenKey?: string): T[]
  /**
   * childrenDeep + flatten
   * 把 childrenDeep 的数据做降维处理 
   * @param where 
   * @param childrenKey  子级数据的键名
   */
  childrenDeepFlatten<T>(where: Where, childrenKey?: string): T[]
  /**
   * 查询父级数据，与 children 方法进行相反方向查询
   * @param where 
   */
  parent<T>(where: Where): T
  /**
   * 查询所有父级数据，与 childrenDeep 方法进行相反方向查询
   * @param where 
   * @param parentKey  父级数据的键名
   */
  parentDeep<T>(where: Where, parentKey?: string): T[]
  /**
   * parentDeep + flatten
   * 把 parentDeep 的结果做降维处理
   * @param where 
   * @param parentKey  父级数据的键名
   */
  parentDeepFlatten<T>(where: Where, parentKey?: string): T[]
  /**
   * 查询兄弟元素
   * @param where 
   */
  siblings<T>(where: Where): T[]
}

export = DB;
export as namespace DB;
