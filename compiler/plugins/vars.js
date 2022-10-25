module.exports.varsReader = {
    varsList: [],
    errors: [],
    get(script) {
        let regex_getvar = /{\s*getVar\((.*?)\)\s*}/g;
        [...script.matchAll(regex_getvar)].forEach(match => {
            let varName = match[1];
            let foundVar = module.exports.varsReader.varsList.find(c => c.name === varName);
            if(foundVar) {
                script = script.replace(match[0], foundVar.value);
            }
            else {
                module.exports.varsReader.errors.push({
                    matchIndex: match.index,
                    matchLength: match[0].length,
                    error: `Variable ${varName} not found`,
                })
            }
        })
        return script;
    },
    read(script) {
        let regex_vars = /{\s*var(.*?)\s*}/g;
        let regex_vars_name = /name\s*=\s*\'(.*?)\'/g;
        let regex_vars_value = /value\s*=\s*\'(.*?)\'/g;
        [...script.matchAll(regex_vars)].forEach(match => {
            [...match[1].matchAll(regex_vars_name)].forEach(nameMatch => {
                [...match[1].matchAll(regex_vars_value)].forEach(valueMatch => {
                    if(module.exports.varsReader.varsList.find(c => c.name === nameMatch[1])) {
                        module.exports.varsReader.varsList.find(c => c.name === nameMatch[1]).value = valueMatch[1];
                    }
                    else {
                        module.exports.varsReader.varsList.push({
                            name: nameMatch[1],
                            value: valueMatch[1]
                        });
                    }
                    script = script.replace(match[0], ''); // Replace all line with nothing
                });
            });
        })

        return script;
    },
    clear() {
        module.exports.varsReader.varsList = [];
    }
}