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
var _ = require('lodash');
;
;
var Basis = (function () {
    function Basis(list) {
        this.data = [].concat(list || []);
    }
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
    Basis.prototype.Where = function (where, limit, like) {
        if (where === void 0) { where = {}; }
        if (limit === void 0) { limit = 0; }
        var result = [];
        if (_.keys(where).length === 0) {
            if (limit > 0) {
                result.push.apply(result, this.data.slice(0, limit));
            }
            else {
                result.push.apply(result, this.data);
            }
        }
        else {
            var match = this.Matcher(where, like);
            for (var i = 0, len = this.data.length; i < len; i++) {
                var item = this.data[i];
                var status = match(item);
                if (status) {
                    result.push(item);
                    if (limit > 0 && result.length >= limit) {
                        break;
                    }
                }
            }
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
        if (!row) {
            return 0;
        }
        var list = [].concat(row);
        for (var i = 0, len = list.length; i < len; i++) {
            this.data.push(list[i]);
        }
        return list.length;
    };
    Basis.prototype.update = function (where, value, limit) {
        var list = this.select(where, limit);
        for (var i = 0, len = list.length; i < len; i++) {
            Object.assign(list[i], value);
        }
        return list.length;
    };
    Basis.prototype.remove = function (where) {
        if (_.keys(where).length < 1) {
            return 0;
        }
        var data = this.data;
        var match = this.Matcher(where);
        var surplus = [];
        var length = data.length;
        for (var i = 0; i < length; i++) {
            var item = data[i];
            var status = match(item);
            if (status) {
                continue;
            }
            else {
                surplus.push(item);
            }
        }
        if (surplus.length < length) {
            this.data = surplus;
            return length - surplus.length;
        }
        return 0;
    };
    return Basis;
}());
var DB = (function (_super) {
    __extends(DB, _super);
    function DB(name, list, primaryKey, foreignKey, foreignKeyValue) {
        if (list === void 0) { list = []; }
        var _this = _super.call(this, list) || this;
        var r = Math.random() * 10000;
        _this.setName(name || "table-" + parseInt(r, 10));
        _this.primaryKey = primaryKey;
        _this.foreignKey = foreignKey;
        _this.foreignKeyValue = foreignKeyValue || '0';
        return _this;
    }
    DB.prototype.setName = function (name) {
        this.name = name;
    };
    DB.prototype.getName = function () {
        return this.name;
    };
    DB.prototype.selectOne = function (where) {
        var data = this.select(where, 1)[0];
        return data;
    };
    DB.prototype.clone = function (callback) {
        var list = [];
        for (var i = 0, len = this.data.length; i < len; i++) {
            var item = Object.assign({}, this.data[i]);
            if (callback) {
                var value = callback(item);
                if (value) {
                    list.push(value);
                }
            }
            else {
                list.push(item);
            }
        }
        return list;
    };
    DB.prototype.flatten = function (list, childrenKey) {
        var _this = this;
        if (!this.primaryKey || !this.foreignKey) {
            throw new Error('primaryKey & foreignKey cannot be empty');
        }
        var data = [];
        var deep = function (array, foreignKey) {
            for (var i = 0, len = array.length; i < len; i++) {
                var item = array[i];
                if (!item[_this.primaryKey]) {
                    item[_this.primaryKey] = _.uniqueId('item_');
                }
                var primaryKey = item[_this.primaryKey];
                if (!item[_this.foreignKey]) {
                    item[_this.foreignKey] = foreignKey;
                }
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
        if (!this.primaryKey || !this.foreignKey) {
            throw new Error('primaryKey & foreignKey cannot be empty');
        }
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
        if (!this.primaryKey || !this.foreignKey) {
            throw new Error('primaryKey & foreignKey cannot be empty');
        }
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
