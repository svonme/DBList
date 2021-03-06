var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var _ = require('lodash');
var _UUIDIndex = 1;
function UUid() {
    var id = "DBList_" + _UUIDIndex++;
    var key = String(Math.random()).slice(2);
    return id + "_" + key;
}
var Basis = (function () {
    function Basis(list, primaryKey, foreignKey, foreignKeyValue, indexName) {
        if (indexName === void 0) { indexName = 'dbIndex'; }
        this.index = 1;
        this.indexName = indexName || '__index';
        this.data = new Map();
        this.primaryKey = primaryKey;
        this.foreignKey = foreignKey;
        this.foreignKeyValue = foreignKeyValue;
        this.unknownKey = "_unknownKey_" + UUid();
        this.data.set(this.unknownKey, new Map());
        this.insert(list);
    }
    Basis.prototype.size = function () {
        var number = 0;
        this.data.forEach(function (map) {
            number += map.size;
        });
        return number;
    };
    Basis.prototype.getIndex = function () {
        return this.index++;
    };
    Basis.prototype.IsMatchLike = function (data, where) {
        var keys = _.keys(where);
        var status = true;
        for (var i = 0, length_1 = keys.length; i < length_1; i++) {
            var key = keys[i];
            if (data.hasOwnProperty(key) && _.includes(data[key], where[key])) {
                continue;
            }
            else {
                status = false;
                break;
            }
        }
        return status;
    };
    Basis.prototype.IsMatch = function (data, where) {
        var keys = _.keys(where);
        var status = true;
        for (var i = 0, length_2 = keys.length; i < length_2; i++) {
            var key = keys[i];
            if (_.isArray(where[key])) {
                if (_.includes(where[key], data[key])) {
                    continue;
                }
                else if (_.isArray(data[key]) && _.size(_.intersection(where[key], data[key])) > 0) {
                    continue;
                }
                else {
                    status = false;
                    break;
                }
            }
            else {
                if (where[key] !== data[key] || !data.hasOwnProperty(key)) {
                    if (_.includes([].concat(data[key]), where[key])) {
                        continue;
                    }
                    else {
                        status = false;
                        break;
                    }
                }
            }
        }
        return status;
    };
    Basis.prototype.Matcher = function (where, like) {
        var _this = this;
        if (like === void 0) { like = false; }
        return function (value) {
            if (!value) {
                return false;
            }
            if (like) {
                return _this.IsMatchLike(value, where);
            }
            return _this.IsMatch(value, where);
        };
    };
    Basis.prototype.whereAll = function (limit) {
        if (limit === void 0) { limit = 0; }
        var result = [];
        this.data.forEach(function (map) {
            map.forEach(function (item) {
                result.push(item);
            });
        });
        return limit > 0 ? result.slice(0, limit) : result;
    };
    Basis.prototype.Where = function (where, limit, like) {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e, e_6, _f;
        if (where === void 0) { where = {}; }
        if (limit === void 0) { limit = 0; }
        var keys = Object.keys(where);
        if (keys.length === 0) {
            return this.whereAll(limit);
        }
        var flag = true;
        var result = [];
        if (keys.length === 1 && !like) {
            if (this.foreignKey in where) {
                var foreignKeys = [].concat(where[this.foreignKey]);
                try {
                    for (var foreignKeys_1 = __values(foreignKeys), foreignKeys_1_1 = foreignKeys_1.next(); !foreignKeys_1_1.done; foreignKeys_1_1 = foreignKeys_1.next()) {
                        var key = foreignKeys_1_1.value;
                        var map = this.data.get(key);
                        if (!map) {
                            continue;
                        }
                        if (limit === 0) {
                            var list = map.values();
                            result.push.apply(result, __spread(list));
                        }
                        else {
                            try {
                                for (var _g = (e_2 = void 0, __values(map.values())), _h = _g.next(); !_h.done; _h = _g.next()) {
                                    var item = _h.value;
                                    result.push(item);
                                    if (result.length >= limit) {
                                        flag = false;
                                        break;
                                    }
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (_h && !_h.done && (_b = _g["return"])) _b.call(_g);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                            if (!flag) {
                                break;
                            }
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (foreignKeys_1_1 && !foreignKeys_1_1.done && (_a = foreignKeys_1["return"])) _a.call(foreignKeys_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return result;
            }
            if (this.primaryKey in where) {
                var primaryKeys = [].concat(where[this.primaryKey]);
                try {
                    for (var primaryKeys_1 = __values(primaryKeys), primaryKeys_1_1 = primaryKeys_1.next(); !primaryKeys_1_1.done; primaryKeys_1_1 = primaryKeys_1.next()) {
                        var key = primaryKeys_1_1.value;
                        try {
                            for (var _j = (e_4 = void 0, __values(this.data.values())), _k = _j.next(); !_k.done; _k = _j.next()) {
                                var map = _k.value;
                                var value = map.get(key);
                                if (value) {
                                    result.push(value);
                                }
                                if (limit > 0 && result.length >= limit) {
                                    flag = false;
                                    break;
                                }
                            }
                        }
                        catch (e_4_1) { e_4 = { error: e_4_1 }; }
                        finally {
                            try {
                                if (_k && !_k.done && (_d = _j["return"])) _d.call(_j);
                            }
                            finally { if (e_4) throw e_4.error; }
                        }
                        if (!flag) {
                            break;
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (primaryKeys_1_1 && !primaryKeys_1_1.done && (_c = primaryKeys_1["return"])) _c.call(primaryKeys_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                return result;
            }
        }
        var match = this.Matcher(where, like);
        try {
            for (var _l = __values(this.data.keys()), _m = _l.next(); !_m.done; _m = _l.next()) {
                var key = _m.value;
                var map = this.data.get(key);
                try {
                    for (var _o = (e_6 = void 0, __values(map.keys())), _p = _o.next(); !_p.done; _p = _o.next()) {
                        var index = _p.value;
                        var item = map.get(index);
                        var status_1 = item ? match(item) : false;
                        if (status_1) {
                            result.push(item);
                            if (limit > 0 && result.length >= limit) {
                                flag = false;
                                break;
                            }
                        }
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (_p && !_p.done && (_f = _o["return"])) _f.call(_o);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
                if (!flag) {
                    break;
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_m && !_m.done && (_e = _l["return"])) _e.call(_l);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return result;
    };
    Basis.prototype.like = function (where, limit) {
        return this.Where(where, limit, true);
    };
    Basis.prototype.select = function (where, limit) {
        var array = this.Where(where, limit, false);
        return _.sortBy(array, [this.indexName]);
    };
    Basis.prototype.insert = function (row) {
        if (!row) {
            return void 0;
        }
        var keys = [];
        var list = [].concat(row);
        for (var i = 0, len = list.length; i < len; i++) {
            var item = list[i];
            var index = this.getIndex();
            if (!item.hasOwnProperty(this.primaryKey)) {
                item[this.primaryKey] = UUid();
            }
            if (!item.hasOwnProperty(this.indexName)) {
                item[this.indexName] = index;
            }
            keys.push(item[this.primaryKey]);
            if (item.hasOwnProperty(this.foreignKey)) {
                var _a = __read([].concat(item[this.foreignKey]), 1), pid = _a[0];
                var map = this.data.get(pid);
                if (!map) {
                    this.data.set(pid, new Map());
                    map = this.data.get(pid);
                }
                map.set(item[this.primaryKey], item);
            }
            else {
                var map = this.data.get(this.unknownKey);
                map.set(item[this.primaryKey], item);
            }
        }
        if (keys.length === 1) {
            return keys[0];
        }
        return keys;
    };
    Basis.prototype._updatePrimaryKey = function (originKey, newKey) {
        var e_7, _a;
        var foreignKeys = this.data.keys();
        try {
            for (var foreignKeys_2 = __values(foreignKeys), foreignKeys_2_1 = foreignKeys_2.next(); !foreignKeys_2_1.done; foreignKeys_2_1 = foreignKeys_2.next()) {
                var foreignKey = foreignKeys_2_1.value;
                var map = this.data.get(foreignKey);
                if (map.has(originKey)) {
                    var value = map.get(originKey);
                    map["delete"](originKey);
                    map.set(newKey, value);
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (foreignKeys_2_1 && !foreignKeys_2_1.done && (_a = foreignKeys_2["return"])) _a.call(foreignKeys_2);
            }
            finally { if (e_7) throw e_7.error; }
        }
    };
    Basis.prototype._updateforeignKey = function (originKey, newKey) {
        var e_8, _a;
        if (this.data.has(originKey)) {
            var map = this.data.get(originKey);
            try {
                for (var _b = __values(map.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var key = _c.value;
                    var value = map.get(key);
                    if (_.isArray(value[this.foreignKey])) {
                        var ids = [].concat(value[this.foreignKey], newKey);
                        value[this.foreignKey] = _.difference(ids, [originKey]);
                    }
                    else {
                        value[this.foreignKey] = newKey;
                    }
                    map.set(key, value);
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
                }
                finally { if (e_8) throw e_8.error; }
            }
            this.data["delete"](originKey);
            this.data.set(newKey, map);
        }
    };
    Basis.prototype.update = function (where, value) {
        var e_9, _a, e_10, _b, e_11, _c, e_12, _d;
        var primaryKeyHooks = {};
        var foreignKeyHooks = {};
        var originList = this.select(where);
        try {
            for (var originList_1 = __values(originList), originList_1_1 = originList_1.next(); !originList_1_1.done; originList_1_1 = originList_1.next()) {
                var origin_1 = originList_1_1.value;
                var key = origin_1[this.primaryKey];
                try {
                    for (var _e = (e_10 = void 0, __values(this.data.keys())), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var foreignKey = _f.value;
                        var map = this.data.get(foreignKey);
                        if (map.has(key)) {
                            if (foreignKey === this.unknownKey) {
                                if (this.foreignKey in value) {
                                    map["delete"](key);
                                    if (!(this.data.has(value[this.foreignKey]))) {
                                        this.data.set(value[this.foreignKey], new Map());
                                    }
                                    var temp = this.data.get(value[this.foreignKey]);
                                    temp.set(key, Object.assign({}, origin_1, value));
                                }
                                else {
                                    map.set(key, Object.assign({}, origin_1, value));
                                }
                            }
                            else {
                                map.set(key, Object.assign({}, origin_1, value));
                            }
                        }
                    }
                }
                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e["return"])) _b.call(_e);
                    }
                    finally { if (e_10) throw e_10.error; }
                }
                if (this.primaryKey in value) {
                    primaryKeyHooks[key] = value[this.primaryKey];
                    foreignKeyHooks[key] = value[this.primaryKey];
                }
                if (this.foreignKey in value) {
                    if (origin_1[this.foreignKey]) {
                        foreignKeyHooks[origin_1[this.foreignKey]] = value[this.foreignKey];
                    }
                }
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (originList_1_1 && !originList_1_1.done && (_a = originList_1["return"])) _a.call(originList_1);
            }
            finally { if (e_9) throw e_9.error; }
        }
        try {
            for (var _g = __values(Object.keys(primaryKeyHooks)), _h = _g.next(); !_h.done; _h = _g.next()) {
                var key = _h.value;
                var value_1 = primaryKeyHooks[key];
                this._updatePrimaryKey(key, value_1);
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (_h && !_h.done && (_c = _g["return"])) _c.call(_g);
            }
            finally { if (e_11) throw e_11.error; }
        }
        try {
            for (var _j = __values(Object.keys(foreignKeyHooks)), _k = _j.next(); !_k.done; _k = _j.next()) {
                var key = _k.value;
                var value_2 = foreignKeyHooks[key];
                this._updateforeignKey(key, value_2);
            }
        }
        catch (e_12_1) { e_12 = { error: e_12_1 }; }
        finally {
            try {
                if (_k && !_k.done && (_d = _j["return"])) _d.call(_j);
            }
            finally { if (e_12) throw e_12.error; }
        }
        return originList.length;
    };
    Basis.prototype.remove = function (where) {
        var e_13, _a, e_14, _b;
        if (_.keys(where).length < 1) {
            return 0;
        }
        var count = 0;
        var list = this.select(where);
        try {
            for (var list_1 = __values(list), list_1_1 = list_1.next(); !list_1_1.done; list_1_1 = list_1.next()) {
                var item = list_1_1.value;
                var id = item[this.primaryKey];
                try {
                    for (var _c = (e_14 = void 0, __values(this.data.values())), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var map = _d.value;
                        if (map["delete"](id)) {
                            count++;
                        }
                    }
                }
                catch (e_14_1) { e_14 = { error: e_14_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c["return"])) _b.call(_c);
                    }
                    finally { if (e_14) throw e_14.error; }
                }
            }
        }
        catch (e_13_1) { e_13 = { error: e_13_1 }; }
        finally {
            try {
                if (list_1_1 && !list_1_1.done && (_a = list_1["return"])) _a.call(list_1);
            }
            finally { if (e_13) throw e_13.error; }
        }
        return count;
    };
    Basis.prototype.clear = function () {
        var data = new Map();
        data.set(this.unknownKey, new Map());
        this.data = data;
    };
    Basis.prototype.empty = function (where) {
        var e_15, _a;
        var array = this.select(where);
        try {
            for (var array_1 = __values(array), array_1_1 = array_1.next(); !array_1_1.done; array_1_1 = array_1.next()) {
                var item = array_1_1.value;
                var value = _.pick(item, [this.primaryKey, this.foreignKey, this.indexName]);
                var map = this.data.get(item[this.foreignKey]);
                map.set(item[this.primaryKey], value);
            }
        }
        catch (e_15_1) { e_15 = { error: e_15_1 }; }
        finally {
            try {
                if (array_1_1 && !array_1_1.done && (_a = array_1["return"])) _a.call(array_1);
            }
            finally { if (e_15) throw e_15.error; }
        }
    };
    return Basis;
}());
var DB = (function (_super) {
    __extends(DB, _super);
    function DB(list, primaryKey, foreignKey, foreignKeyValue, indexName) {
        if (list === void 0) { list = []; }
        if (primaryKey === void 0) { primaryKey = 'id'; }
        if (foreignKey === void 0) { foreignKey = 'pid'; }
        if (foreignKeyValue === void 0) { foreignKeyValue = '0'; }
        if (indexName === void 0) { indexName = 'dbIndex'; }
        var _this = this;
        if (_.isString(list)) {
            console.warn('Dblist has removed the name field in version 0.2.4');
            list = primaryKey;
            primaryKey = foreignKey;
            foreignKey = String(foreignKeyValue);
            foreignKeyValue = '0';
            indexName = void 0;
        }
        _this = _super.call(this, list, primaryKey, foreignKey, foreignKeyValue, indexName) || this;
        return _this;
    }
    DB.prototype.selectOne = function (where) {
        if (!where) {
            throw "function selectOne: where cannot be undefined";
        }
        var _a = __read(this.select(where, 1), 1), data = _a[0];
        return data;
    };
    DB.prototype.clone = function (callback) {
        var array = this.select();
        if (callback) {
            var list = [];
            for (var i = 0, len = array.length; i < len; i++) {
                var value = callback(Object.assign({}, array[i]));
                if (value) {
                    list.push(value);
                }
            }
            return list;
        }
        return array;
    };
    DB.prototype.flatten = function (list, childrenKey) {
        var _this = this;
        if (childrenKey === void 0) { childrenKey = "children"; }
        if (!list) {
            throw "function flatten: list cannot be undefined";
        }
        var data = [];
        var deep = function (array, foreignKey) {
            for (var i = 0, len = array.length; i < len; i++) {
                var item = array[i];
                if (!(_this.primaryKey in item)) {
                    item[_this.primaryKey] = UUid();
                }
                if (!(_this.foreignKey in item)) {
                    item[_this.foreignKey] = foreignKey;
                }
                var primaryKey = item[_this.primaryKey];
                var value = _.omit(item, [childrenKey]);
                data.push(value);
                if (item[childrenKey]) {
                    var children = [].concat(item[childrenKey] || []);
                    if (children.length > 0) {
                        deep(children, primaryKey);
                    }
                }
            }
        };
        deep(list, this.foreignKeyValue);
        return data;
    };
    DB.prototype.children = function (where) {
        if (!where) {
            throw "function children: where cannot be undefined";
        }
        var item;
        if (this.primaryKey in where && this.foreignKey in where) {
            item = Object.assign({}, where);
        }
        else {
            item = Object.assign({}, this.selectOne(where));
        }
        if (item) {
            var childrenWhere = {};
            childrenWhere[this.foreignKey] = item[this.primaryKey];
            return _.map(this.select(childrenWhere), function (data) { return _.clone(data); });
        }
        return [];
    };
    DB.prototype.childrenDeep = function (where, childrenKey) {
        var e_16, _a;
        var _this = this;
        if (childrenKey === void 0) { childrenKey = 'children'; }
        var deep = function (query) {
            var e_17, _a;
            var list = _this.children(query);
            try {
                for (var list_2 = __values(list), list_2_1 = list_2.next(); !list_2_1.done; list_2_1 = list_2.next()) {
                    var item = list_2_1.value;
                    var array = deep(item);
                    if (array && array.length) {
                        item[childrenKey] = array;
                    }
                }
            }
            catch (e_17_1) { e_17 = { error: e_17_1 }; }
            finally {
                try {
                    if (list_2_1 && !list_2_1.done && (_a = list_2["return"])) _a.call(list_2);
                }
                finally { if (e_17) throw e_17.error; }
            }
            return _.sortBy(list, [_this.indexName]);
        };
        var result = [];
        if (!where) {
            where = {};
            where[this.foreignKey] = this.foreignKeyValue;
        }
        try {
            for (var _b = __values(this.select(where)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var item = _c.value;
                var data = Object.assign({}, item);
                var query = {};
                query[this.primaryKey] = data[this.primaryKey];
                var array = deep(query);
                if (array && array.length) {
                    data[childrenKey] = array;
                }
                result.push(data);
            }
        }
        catch (e_16_1) { e_16 = { error: e_16_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_16) throw e_16.error; }
        }
        return result;
    };
    DB.prototype.childrenDeepFlatten = function (where, childrenKey) {
        if (childrenKey === void 0) { childrenKey = 'children'; }
        var result = this.childrenDeep(where, childrenKey);
        var db = new DB([], this.primaryKey, this.foreignKey, this.foreignKeyValue);
        var array = db.flatten(result, childrenKey);
        db.insert(array);
        return db.clone();
    };
    DB.prototype.parent = function (where) {
        if (!where) {
            throw "function parent: where cannot be undefined";
        }
        if (this.foreignKey in where) {
            var parentWhere = {};
            parentWhere[this.primaryKey] = where[this.foreignKey];
            var value = this.selectOne(parentWhere);
            return value ? _.clone(value) : void 0;
        }
        else {
            var item = this.selectOne(where);
            if (item) {
                var parentWhere = {};
                parentWhere[this.primaryKey] = item[this.foreignKey];
                var value = this.selectOne(parentWhere);
                return value ? _.clone(value) : void 0;
            }
            return void 0;
        }
    };
    DB.prototype.parentDeep = function (where, parentKey) {
        var e_18, _a;
        var _this = this;
        if (parentKey === void 0) { parentKey = 'parent'; }
        var result = [];
        var deep = function (where) {
            var parent = _this.parent(where);
            if (parent) {
                parent[parentKey] = deep(parent);
            }
            return parent;
        };
        try {
            for (var _b = __values(this.select(where)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var item = _c.value;
                var data = Object.assign({}, item);
                var parent_1 = deep(data);
                if (parent_1) {
                    data[parentKey] = parent_1;
                }
                result.push(data);
            }
        }
        catch (e_18_1) { e_18 = { error: e_18_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_18) throw e_18.error; }
        }
        return result;
    };
    DB.prototype.parentDeepFlatten = function (where, childrenKey) {
        if (childrenKey === void 0) { childrenKey = 'children'; }
        var result = this.parentDeep(where, childrenKey);
        var db = new DB([], this.primaryKey, this.foreignKey, this.foreignKeyValue);
        var array = db.flatten(result, childrenKey);
        db.insert(array);
        return db.clone();
    };
    DB.prototype.siblings = function (where) {
        if (!where) {
            throw "function siblings: where cannot be undefined";
        }
        var item = this.selectOne(where);
        if (item) {
            var query = {};
            query[this.foreignKey] = item[this.foreignKey];
            return this.select(query);
        }
        return void 0;
    };
    return DB;
}(Basis));
module.exports = DB;
exports["default"] = DB;
