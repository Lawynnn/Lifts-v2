module.exports.paramReader = {
    paramsList: [],

    /**
     * 
     * @param {string} script 
     */
    read(script) {
        module.exports.paramReader.clear();
        let regex_innerparams = /<param(.*)\/>/g;
        let regex_params_name = /name\s*=\s*\'(.*?)\'/g;
        let regex_params_value = /value\s*=\s*\'(.*?)\'/g;
        [...script.matchAll(regex_innerparams)].forEach(match => {
            [...match[1].matchAll(regex_params_name)].forEach(nameMatch => {
                [...match[1].matchAll(regex_params_value)].forEach(valueMatch => {
                    module.exports.paramReader.paramsList.push({
                        name: nameMatch[1],
                        value: valueMatch[1]
                    });
                    script = script.replace(match[0], ''); // Replace all line with nothing
                });
            });
        });
        return script;
    },

    clear() {
        module.exports.paramReader.paramsList = [];
    }
}