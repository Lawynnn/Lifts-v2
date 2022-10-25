const {Message, Client} = require('discord.js');

module.exports.infoReader = {
    /**
     * 
     * @param {string} script 
     * @param {Message} msg 
     * @param {Client} client 
     */
    read(script, msg, client) {
        script = script.replace(/{author\.name}/g, msg.author.username);
        script = script.replace(/{author\.id}/g, msg.author.id);
        script = script.replace(/{author\.avatar}/g, msg.author.avatarURL);
        script = script.replace(/{author\.discriminator}/g, msg.author.discriminator);
        script = script.replace(/{author\.tag}/g, msg.author.tag);
        script = script.replace(/{author\.mention}/g, msg.author.toString());

        script = script.replace(/{channel\.name}/g, msg.channel.name);
        script = script.replace(/{channel\.id}/g, msg.channel.id);
        script = script.replace(/{channel\.createdAt}/g, msg.channel.createdAt.getTime());
        script = script.replace(/{channel\.type}/g, msg.channel.type);
        script = script.replace(/{channel\.invitable}/g, msg.channel.invitable);
        
        script = script.replace(/{guild\.name}/g, msg.guild.name);
        script = script.replace(/{guild\.id}/g, msg.guild.id);
        

        return script;
    }
}