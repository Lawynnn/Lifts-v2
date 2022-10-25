const Discord = require('discord.js');
const Compiler = require('../compiler');

module.exports = {
    compile: (script) => {
        let embeds = [];
        let errors = [];
        [...script.matchAll(/@embed\[(.*)\]/g)].forEach(match => {
            let emb = new Discord.EmbedBuilder();
            let embId = match[1];
            embeds.push({embId: embId ? embId : embeds.length, emb});
            script = script.replace(match[0], "");
        });

        [...script.matchAll(/@setTitle\[(.*)\]/g)].forEach(match => {
            let splits = match[1].split(";");
            let foundEmb = embeds.find(e => e.embId === splits[0]);
            if(!foundEmb) {
                errors.push({message: `Failed to find embed with id \`${splits[0]}\``});
            }
            else {
                foundEmb.emb.setTitle(splits[1]);
            }
            script = script.replace(match[0], "");
        });

        [...script.matchAll(/@setDescription\[(.*)\]/g)].forEach(match => {
            let splits = match[1].split(";");
            let foundEmb = embeds.find(e => e.embId === splits[0]);
            if(!foundEmb) {
                errors.push({message: `Failed to find embed with id \`${splits[0]}\``});
            }
            else {
                foundEmb.emb.setDescription(splits[1]);
            }
            script = script.replace(match[0], "");
        });

        [...script.matchAll(/@setColor\[(.*)\]/g)].forEach(match => {
            let splits = match[1].split(";");
            let foundEmb = embeds.find(e => e.embId === splits[0]);
            if(!foundEmb) {
                errors.push({message: `Failed to find embed with id \`${splits[0]}\``});
            }
            else {
                foundEmb.emb.setColor(splits[1]);
            }
            script = script.replace(match[0], "");
        });
        
        return {embeds, errors, script};
    }
}