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
;
;
var _UUIDIndex = 1;
function UUid() {
    var id = "DBList_" + _UUIDIndex++;
    var key = String(Math.random()).slice(2);
    return id + "_" + key;
}
var Basis = (function () {
    function Basis(list, primaryKey, foreignKey, foreignKeyValue) {
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
    Basis.prototype.IsMatchLike = function (data, where) {
        var keys = _.keys(where);
        var status = true;
        for (var i = 0, length = keys.length; i < length; i++) {
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
        for (var i = 0, length = keys.length; i < length; i++) {
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
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e;
        if (where === void 0) { where = {}; }
        if (limit === void 0) { limit = 0; }
        var keys = Object.keys(where);
        if (keys.length === 0) {
            return this.whereAll(limit);
        }
        var flag = true;
        var result = [];
        if (keys.length === 1 && !like) {
            if (where[this.foreignKey] === this.foreignKeyValue || where[this.primaryKey] === this.foreignKeyValue) {
                return this.whereAll(0);
            }
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
                            result.push.apply(result, __spread(map.values()));
                        }
                        else {
                            for (var item in map.values()) {
                                result.push(item);
                                if (result.length >= limit) {
                                    flag = false;
                                    break;
                                }
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
                            for (var _f = (e_3 = void 0, __values(this.data.values())), _g = _f.next(); !_g.done; _g = _f.next()) {
                                var map = _g.value;
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
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_g && !_g.done && (_c = _f["return"])) _c.call(_f);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        if (!flag) {
                            break;
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (primaryKeys_1_1 && !primaryKeys_1_1.done && (_b = primaryKeys_1["return"])) _b.call(primaryKeys_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                return result;
            }
        }
        var match = this.Matcher(where, like);
        try {
            for (var _h = __values(this.data.keys()), _j = _h.next(); !_j.done; _j = _h.next()) {
                var key = _j.value;
                var map = this.data.get(key);
                try {
                    for (var _k = (e_5 = void 0, __values(map.keys())), _l = _k.next(); !_l.done; _l = _k.next()) {
                        var index = _l.value;
                        var item = map.get(index);
                        var status = item ? match(item) : false;
                        if (status) {
                            result.push(item);
                            if (limit > 0 && result.length >= limit) {
                                flag = false;
                                break;
                            }
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (_l && !_l.done && (_e = _k["return"])) _e.call(_k);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
                if (!flag) {
                    break;
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_j && !_j.done && (_d = _h["return"])) _d.call(_h);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return result;
    };
    Basis.prototype.like = function (where, limit) {
        return this.Where(where, limit, true);
    };
    Basis.prototype.select = function (where, limit) {
        return this.Where(where, limit, false);
    };
    Basis.prototype.insert = function (row) {
        var e_6, _a;
        if (!row) {
            return 0;
        }
        var list = [].concat(row);
        for (var i = 0, len = list.length; i < len; i++) {
            var item = list[i];
            if (!(this.primaryKey in item)) {
                item[this.primaryKey] = UUid();
            }
            if (this.foreignKey in item) {
                try {
                    for (var _b = (e_6 = void 0, __values([].concat(item[this.foreignKey]))), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var pid = _c.value;
                        var map = this.data.get(pid);
                        if (!map) {
                            this.data.set(pid, new Map());
                            map = this.data.get(pid);
                        }
                        map.set(item[this.primaryKey], item);
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            }
            else {
                var map = this.data.get(this.unknownKey);
                map.set(item[this.primaryKey], item);
            }
        }
        return list.length;
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
                var origin = originList_1_1.value;
                var key = origin[this.primaryKey];
                if (this.primaryKey in value) {
                    primaryKeyHooks[key] = value[this.primaryKey];
                    foreignKeyHooks[key] = value[this.primaryKey];
                }
                if (this.foreignKey in value) {
                    foreignKeyHooks[origin[this.foreignKey]] = value[this.foreignKey];
                }
                try {
                    for (var _e = (e_10 = void 0, __values(this.data.values())), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var map = _f.value;
                        if (map.has(key)) {
                            map.set(key, Object.assign({}, origin, value));
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
    return Basis;
}());
var DB = (function (_super) {
    __extends(DB, _super);
    function DB(name, list, primaryKey, foreignKey, foreignKeyValue) {
        if (name === void 0) { name = UUid(); }
        if (list === void 0) { list = []; }
        if (primaryKey === void 0) { primaryKey = 'id'; }
        if (foreignKey === void 0) { foreignKey = 'pid'; }
        if (foreignKeyValue === void 0) { foreignKeyValue = '0'; }
        var _this = _super.call(this, list, primaryKey, foreignKey, foreignKeyValue) || this;
        _this.setName(name);
        return _this;
    }
    DB.prototype.setName = function (name) {
        this.name = name;
    };
    DB.prototype.getName = function () {
        return this.name;
    };
    DB.prototype.selectOne = function (where) {
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
        var item = this.selectOne(where);
        if (item) {
            var childrenWhere = {};
            childrenWhere[this.foreignKey] = item[this.primaryKey];
            var children = this.select(childrenWhere);
            return [].concat(item, children);
        }
        return [item];
    };
    DB.prototype.childrenDeep = function (where) {
        var _this = this;
        var result = [];
        var deep = function (query) {
            var list = _this.children(query);
            if (list[0]) {
                result.push(list[0]);
            }
            var children = list.slice(1);
            for (var i = 0, len = children.length; i < len; i++) {
                var node = children[i];
                var childrenWhere = {};
                childrenWhere[_this.primaryKey] = node[_this.primaryKey];
                deep(childrenWhere);
            }
        };
        deep(where);
        return result;
    };
    DB.prototype.parent = function (where) {
        var result = [];
        var item = this.selectOne(where);
        if (item) {
            result.push(item);
            if (this.foreignKeyValue !== item[this.foreignKey]) {
                var parentWhere = {};
                parentWhere[this.primaryKey] = item[this.foreignKey];
                var parent = this.selectOne(parentWhere);
                if (parent) {
                    result.push(parent);
                }
            }
        }
        return result;
    };
    DB.prototype.parentDeep = function (where) {
        var _this = this;
        var result = [];
        var deep = function (list) {
            if (list[0]) {
                result.push(list[0]);
            }
            if (list[1]) {
                var parent = list[1];
                var select = {};
                select[_this.primaryKey] = parent[_this.primaryKey];
                deep(_this.parent(select));
            }
        };
        deep(this.parent(where));
        return result;
    };
    return DB;
}(Basis));
module.exports = DB;
exports["default"] = DB;
