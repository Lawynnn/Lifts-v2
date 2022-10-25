const Discord = require('discord.js');
const { varsReader } = require('./vars');
const { DError, errorStore } = require('../errors/store');
module.exports.embedReader = {
    embedList: [],
    read(script) {
        let regex_embed = /@messageEmbed\((.*?)\)(->)?(.*)?/g;
        let embed = new Discord.MessageEmbed();

        [...script.matchAll(regex_embed)].forEach(match => {
            let embed_ref = {
                name: '',
                embed: {},
            };
            let name = match[1];
            let params = match[3];
            if (params) {
                let param = params.split('->').map(p => p.trim());
                param.forEach(p => {
                    [...p.matchAll(/setTitle\((.*?)\)/g)].forEach(titleMatch => {
                        embed.setTitle(titleMatch[1]);
                    });
                    [...p.matchAll(/setDescription\((.*?)\)/g)].forEach(titleMatch => {
                        embed.setDescription(titleMatch[1]);
                    });
                    [...p.matchAll(/setColor\((.*?)\)/g)].forEach(titleMatch => {
                        // if(!titleMatch[1].startsWith('#')) {
                        //     return new DError(`${titleMatch[1]} is not a valid color for embed ${name}.`, 0x23331, match.index);
                        // }

                        let rgb = null;
                        [...titleMatch[1].matchAll(/@rgb\((.*)\)/g)].forEach(colorMatch => {
                            rgb = colorMatch[1].split(',').map(c => parseInt(c));
                            if(rgb.length < 3) {
                                return new DError(`@rgb function has not enough parameters. ( @rgb(r, g, b) ).`, 0x2334231, match.index);
                            }
                            embed.setColor(rgb);
                        })
                        if(!rgb)
                            embed.setColor(titleMatch[1]);
                    });
                    [...p.matchAll(/setThumbnail\((.*?)\)/g)].forEach(titleMatch => {
                        embed.setThumbnail(titleMatch[1]);
                    });
                    [...p.matchAll(/setImage\((.*?)\)/g)].forEach(titleMatch => {
                        embed.setImage(titleMatch[1]);
                    });
                    [...p.matchAll(/setAuthor\((.*?)\)/g)].forEach(titleMatch => {
                        embed.setAuthor({
                            name: titleMatch[1],
                        });
                    });
                    [...p.matchAll(/setAuthorIcon\((.*?)\)/g)].forEach(titleMatch => {
                        embed.author.iconURL = titleMatch[1];
                    });
                    [...p.matchAll(/setAuthorURL\((.*?)\)/g)].forEach(titleMatch => {
                        embed.author.url = titleMatch[1];
                    });
                    [...p.matchAll(/setFooter\((.*?)\)/g)].forEach(titleMatch => {
                        embed.setFooter({
                            text: titleMatch[1],
                        });
                    });
                    [...p.matchAll(/setFooterIcon\((.*?)\)/g)].forEach(titleMatch => {
                        embed.footer.iconURL = titleMatch[1];
                    });
                    [...p.matchAll(/setTimestamp\((.*?)\)/g)].forEach(titleMatch => {
                        embed.setTimestamp(Date.now());
                    });
                    [...p.matchAll(/setURL\((.*?)\)/g)].forEach(titleMatch => {
                        embed.setURL(titleMatch[1]);
                    });
                    [...p.matchAll(/addField\((.*?)\)/g)].forEach(titleMatch => {
                        let params = titleMatch[1].split(',').map(p => p.trim());
                        if (params.length < 2) {
                            return new DError(`@messageEmbed field ${params[0]} is missing a value. ( @messageEmbed->addField(name*, value*, inline) )`, 0x5432, match.index);
                        }
                        let name = params[0];
                        let value = params[1];
                        let inline = false;
                        if (params.length == 3) {
                            inline = params[2].toLowerCase() === 'yes' || params[2].toLowerCase() === 'true'
                        }
                        embed.addField(name, value, inline);
                    })
                })
            }
            embed_ref.embed = embed;
            embed_ref.name = name;
            this.embedList.push(embed_ref);
            script = script.replace(match[0], '');
        });

        let regex_emebd_setTitle = /@setTitle\((.*)\)/g;
        [...script.matchAll(regex_emebd_setTitle)].forEach(match => {
            let params = match[1].split(',').map(p => p.trim());
            if (params.length < 1) {
                return new DError(`@setTitle is missing a value. ( @setTitle(embedID, title) )`, 0x543232, match.index);
            }
            let embedID = params[0];
            let title = params.map((p, i) => i > 0 ? p : null).join('');
            let embed = this.embedList.find(e => e.name === embedID)?.embed;
            if (!embed) {
                return new DError(`@setTitle embed ${embedID} does not exist. ( @setTitle(embedID, title) )`, 0x54323322, match.index);
            }
            embed.setTitle(title);
            script = script.replace(match[0], '');
        })

        let regex_emebd_setDescription = /@setDescription\((.*)\)/g;
        [...script.matchAll(regex_emebd_setDescription)].forEach(match => {
            let params = match[1].split(',').map(p => p.trim());
            if (params.length < 1) {
                return new DError(`@setDescription is missing a value. ( @setDescription(embedID, title) )`, 0x54323211, match.index);
            }
            let embedID = params[0];
            let title = params.map((p, i) => i > 0 ? p : null).join('');
            let embed = this.embedList.find(e => e.name === embedID)?.embed;
            if (!embed) {
                return new DError(`@setDescription embed ${embedID} does not exist. ( @setDescription(embedID, title) )`, 0x51113322, match.index);
            }
            embed.setDescription(title);
            script = script.replace(match[0], '');
        })

        return script;
    }
}