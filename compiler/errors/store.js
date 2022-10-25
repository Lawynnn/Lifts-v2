const Discord = require('discord.js');

class DErrorStore {
    constructor() {
        this.errors = [];
    }
    add(error) {
        this.errors.push(error);
    }
    get() {
        return this.errors;
    }
    clear() {
        this.errors = [];
    }
    canExecute() {
        return this.errors.length === 0;
    }
}

const errorStore = new DErrorStore();

class DError {
    constructor(message, code, line) {
        this.message = message || "Error not specified";
        this.code = code || 0;
        this.line = line || 0;
        this.embed = new Discord.MessageEmbed()
                .setTitle(`Error (${errorStore.get().length})`)
                .setDescription(`\`\`\`${this.message} \`\`\`\n\`\`\`Line ${this.line}\`\`\``)
                .setColor("#ff0000")
        errorStore.add(this);
    }
}

module.exports.errorStore = errorStore;
module.exports.DError = DError;