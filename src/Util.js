/*global _:true*/

(function() {
    "use strict";

    var utils = {};

    utils.product = function(sets) {
        var product2 = function(memos, set) {
                var ret = _.map(memos, function(memo) {
                    return _.map(set, function(element) {
                        return memo.concat(element);
                    });
                });
                return _.flatten(ret, true);
            };
        return _.reduce(sets, product2, [
            []
        ]);
    };

    utils.repeat = function(element, n) {
        return _.map(_.range(n), function() {
            return element;
        });
    };

    utils.checkContains = function(array, element) {
        if(!_.contains(array, element)) {
            throw "" + element + " not found in " + array;
        }
    };

    utils.constant = function(value) {
        value = _.clone(value);
        return function() {
            return _.clone(value);
        };
    };

    utils.pickRandom = function(collection) {
        if(_.isArray(collection)){
            return collection[_.random(collection.length - 1)];
        }else{
            var keys = _.keys(collection);
            return collection[keys[_.random(keys.length - 1)]];
        }
    };

    utils.add = function(vecA, b){
        return _.map(vecA, function(value, key){
            if(_.isNumber(b)){
                return value + b;
            }else{
                return value + b[key];
            }
        });
    };

    utils.multiply = function(vecA, b){
        return _.map(vecA, function(value, key){
            if(_.isNumber(b)){
                return value * b;
            }else{
                return value * b[key];
            }
        });
    };

    utils.subtract = function(vecA, vecB){
      return _.add(vecA, _.multiply(vecB, -1));
    };
    
    _.mixin(utils);

}());