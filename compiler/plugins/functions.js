const Discord = require('discord.js');
const { DError, errorStore } = require('../errors/store');
const { varsReader } = require('./vars');

module.exports.functionsReader = {
    functionsList: [],
    function_ref: {
        name: '',
        params: [],
        content: '',
        returns: '',
        id: ''
    },
    get(script) {
        let regex_call = /@call\((.*)\s*\s*{\s*(.*)\s*}\s*\)/g;
        [...script.matchAll(regex_call)].forEach(match => {
            let fName = match[1].split(",")[0].trim();
            let fParams = match[2].split(",").map(param => param.trim());

            console.log(fParams);
            let foundFunc = module.exports.functionsReader.functionsList.find(c => c.name === fName);
            if(foundFunc) {
                foundFunc.params.forEach((param, i) => {
                    if(i > fParams.length) {
                        return new DError(`Function ${fName} has more or less parameters than the @call has.`, 0x231, match.index);
                    }
                    param.value = fParams[i];
                })

                // Compile all plugins inside the found function content
                foundFunc.content = this.param(foundFunc.content, foundFunc);
                foundFunc.content = varsReader.read(foundFunc.content);
                foundFunc.content = this.read(foundFunc.content);
                foundFunc.content = this.get(foundFunc.content);
                
                script = script.replace(match[0], foundFunc.content)
                console.log(foundFunc.content);
            }
            else {
                return new DError(`Function ${fName} not found.`, 0x231, match.index);
            }
        })
        return script;
    },
    param(script, functionIn) {
        let regex_param = /@param\((.*)\)/g;
        [...script.matchAll(regex_param)].forEach(match => {
            let param = match[1].trim();
            if(!functionIn) {
                return new DError(`You cant use @param outside of a function`, 0x22, match.index);
            }
            let isSettingParam = param.split(",").length > 1 ? true : false;

            if(!isSettingParam) {
                let foundParam = functionIn.params.find(c => c.name === param);
                if(!foundParam) {
                    return new DError(`Cant find your param named '${param}' in function '${functionIn.name}'`, 0x22, match.index);
                }
                // Replace error
                script = script.replace(match[0], foundParam.value);
            }
            else {
                let paramName = param.split(",")[0];
                let paramValue = param.split(",")[1];
                let foundParam = functionIn.params.find(c => c.name === paramName);
                if(!foundParam) {
                    return new DError(`Cant set your param named '${paramName}' in function '${functionIn.name}'`, 0x22, match.index);
                }
                foundParam.value = paramValue;
                script = script.replace(match[0], "");
            }
        })
        return script;
    },
    read(script) {

        let regex_function = /@function\((\s*(.*)\s*,\s*{(.*)}.*)\)([\S\s]*?)@endFunction\((.*\2)\)/g;
        let regex_return = /((\n|.)*?)@return\((.*)\)'/g;
        [...script.matchAll(regex_function)].forEach(match => {
            
            //console.log(match);
            let fName = match[2];
            let fParams = match[3];
            let fContent = match[4];

            let paramSearch = fParams.trim().split(",");
            for(var i = 0; i < paramSearch.length; i++) {
                this.function_ref.params.push({
                    name: paramSearch[i].trim(),
                    value: '0',
                    initialValue: '0'
                })
            }
            
            this.function_ref.name = fName;
            this.function_ref.content = fContent;
            [...script.matchAll(regex_return)].forEach(returnMatch => {
                this.function_ref.content = returnMatch[1];
                this.function_ref.returns = returnMatch[2].trim();
            })

            this.function_ref.id = Date.now();
            module.exports.functionsReader.functionsList.push(this.function_ref);
            script = script.replace(match[0], '');
        })

        return script;
    }
}