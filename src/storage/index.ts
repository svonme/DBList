
import DB from "./db";

import * as _ from "../util";

export default class Storage<Value = object> extends DB<Value> {
  select(where: object, limit: number = 0) {
    let data: Value[] = [];
    for (const key of _.keys(where)) {
      const value = _.get(where, key);
      if (data.length > 0) {
        console.log(data, key, value);
      } else {
        data = this.get(key, value);
      }
    }
    return data;
  }
};