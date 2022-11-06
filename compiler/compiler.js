const Discord = require("discord.js");

module.exports = class Compiler {
  /**
   * @param {{args: [...string], client: Discord.Client, message: Discord.Message}} data
   */
  constructor(data) {
    this.errors = [];
    this.embeds = [];
    this.data = data;
  }

  compile(script) {
    /*
     * 3 -> value (ca 1)
     * 2 -> all captured (ca 0)
     */
    script = this.compileOthers(script);
    script = this.compileUser(script);
    script = this.compileEmbed(script);
    
    
    script = this.compileClean(script);

    return script;
  }

  compileOthers(script) {
    if (this.data.args.length > 0) {
      [...script.matchAll(/@arg\[(.*?)\]/gm)].forEach((match) => {
        let pharanteses = match[1].split("[").length;
        for (let i = 0; i < pharanteses - 1; i++) {
          match[1] += "]";
        }
        match[1] = this.compile(match[1]);
        script = script.replace(match[0], this.data.args[match[1] - 1] || "");
      });
    }
    return script;
  }

  compileUser(script) {
    [...script.matchAll(/@userID\[(.*?)\]/gm)].forEach((match) => {
      let pharanteses = match[1].split("[").length;
      for (let i = 0; i < pharanteses - 1; i++) {
        match[1] += "]";
      }
      match[1] = this.compile(match[1]);
      let userFound = this.data.message.guild.members.cache.find(
        (c) =>
          c.user.username === match[1].replace(/\]/g, "") ||
          c.user.tag === match[1].replace(/\]/g, "")
      );
      if (userFound) script = script.replace(match[0], userFound.id);
      else {
        script = script.replace(match[0], "");
      }
    });

    [...script.matchAll(/@username\[(.*?)\]/gm)].forEach((match) => {
      let pharanteses = match[1].split("[").length;
      for (let i = 0; i < pharanteses - 1; i++) {
        match[1] += "]";
      }
      match[1] = this.compile(match[1]);
      let foundUser = this.data.message.guild.members.cache.get(
        match[1].replace(/\]/g, "")
      );
      if (foundUser) script = script.replace(match[0], foundUser.user.username);
      else {
        script = script.replace(match[0], "");
      }
    });
    return script;
  }

  compileEmbed(script) {
    return script;
  }

  compileClean(script) {
    script = script.replace(/\]/g, "");
    // script = script.replace(/@/g)
    return script;
  }
};
