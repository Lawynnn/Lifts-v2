// no-strict
const { varsReader } = require('./vars');
const { paramReader } = require('./params');

function checkCondition(cond) {
    let splitter = null;
    if (cond.indexOf('==') > -1) {
        splitter = '==';
    }
    else if (cond.indexOf('!=') > -1) {
        splitter = '!=';
    }
    else if (cond.indexOf('>') > -1) {
        splitter = '>';
    }
    else if (cond.indexOf('<') > -1) {
        splitter = '<';
    }
    else if (cond.indexOf('>=') > -1) {
        splitter = '>=';
    }
    else if (cond.indexOf('<=') > -1) {
        splitter = '<=';
    }
    else {
        return false;
    }

    let [left, right] = cond.split(splitter);
    left = left.trim();
    right = right.trim();
    if (splitter == '==') {
        return left == right;
    }
    else if (splitter == '!=') {
        return left != right;
    }
    else if (splitter == '>') {
        return left > right;
    }
    else if (splitter == '<') {
        return left < right;
    }
    else if (splitter == '>=') {
        return left >= right;
    }
    else if (splitter == '<=') {
        return left <= right;
    }
    else {
        return false;
    }
}

module.exports.ifReader = {
    ifList: [],
    safe(script) {
        let regex_if = /{\s*if\s*(.*)\s*}([\S\s]*?){\s*\/if\s*}/g;
        [...script.matchAll(regex_if)].forEach(match => {
            let condition = match[1];
            condition = varsReader.get(condition);
            if (!checkCondition(condition)) {
                script = script.replace(match[0], '');
                script = script.replace(condition, '');
                script = script.replace(match[2], '');
            }
        })
        return script;
    },
    read(script) {
        module.exports.ifReader.clear();
        let regex_if = /{\s*if\s*(.*)\s*}([\S\s]*?){\s*\/if\s*}/g;
        [...script.matchAll(regex_if)].forEach(match => {
            let content = match[2];
            let condition = match[1];

            // Condition plugins
            condition = varsReader.get(condition);

            module.exports.ifReader.ifList.push({
                condition: match[1],
                content: content,
                conditionStatus: checkCondition(match[1])
            });
            if (!checkCondition(match[1])) {
                script = script.replace(match[0], '');
            }
            else {
                content = varsReader.read(content);
                content = paramReader.read(content);
                script = script.replace(match[0], content);
            }
        })
        
        return script;
    },
    clear() {
        module.exports.ifReader.ifList = [];
    }
}