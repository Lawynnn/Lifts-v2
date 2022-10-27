const Discord = require("discord.js");

module.exports = {
  errors: [],
  embeds: [],

  clean() {
    module.exports.errors = [];
    module.exports.embeds = [];
  },
  /**
   *
   * @param {string} script
   * @param {Discord.Message} msg
   * @param {Discord.Client} client
   */
  compile(script, msg, client, Gargs) {
    // errorStore.clear();

    let deleteMessage = script.match(/@deleteMessage/g);
    if (deleteMessage && deleteMessage.length > 0 && deleteMessage[0]) {
      script = script.replace(deleteMessage[0], "");
      if (msg.deletable) msg.delete();
    }

    [...script.matchAll(/^@arg\[(.*?)\]/gm)].forEach((match) => {
      if (Gargs) {
        let splits = module.exports
          .compile(match[1], msg, client, Gargs)
          .split(";");
        let firstNr = splits[0] || null;
        let secondNr = splits[1] || null;
        if (!firstNr) {
          module.exports.errors.push({
            message: `Missing argument index on @arg[] (Usage: @arg[argNumber])`,
          });
        } else {
          if (secondNr) {
            // Argumentele dintre
            script = script.replace(
              match[0],
              Gargs.map((s, i) =>
                i >= +firstNr - 1 && i <= +secondNr - 1 ? s : ""
              ).join(" ")
            );
          } else {
            // Doar un argument
            script = script.replace(match[0], Gargs[+firstNr - 1] || "");
          }
        }
      }
    });

    [...script.matchAll(/^@embed\[(.*)\]/gm)].forEach((match) => {
      let emb = new Discord.EmbedBuilder();
      let embId = module.exports.compile(match[1], msg, client, Gargs);
      if (!embId) {
        embId = "__";
      }
      module.exports.embeds.push({ embId: embId, emb });
      script = script.replace(match[0], "");
    });

    [...script.matchAll(/^@setTitle\[(.*)\]/gm)].forEach((match) => {
      let splits = match[1]
        .split(";")
        .map((s) => (s = module.exports.compile(s, msg, client, Gargs)));

      if (!splits[0]) splits[0] = "__";
      console.log("setTitle", splits);
      let foundEmb = module.exports.embeds.find((e) => e.embId === splits[0]);
      if (!foundEmb) {
        module.exports.errors.push({
          message: `Failed to find embed with id \`${splits[0]}\` in @setTitle`,
        });
      } else {
        if (splits[1] && splits[1].length >= 1)
          foundEmb.emb.setTitle(splits[1] || null);
        else {
          module.exports.errors.push({
            message: `Invalid title lenght for embed with id \`${splits[0]}\` in @setTitle`,
          });
        }
      }
      script = script.replace(match[0], "");
    });

    [...script.matchAll(/^@setDescription\[(.*)\]/gm)].forEach((match) => {
      let splits = match[1]
        .split(";")
        .map((s) => (s = module.exports.compile(s, msg, client, Gargs)));
      if (!splits[0]) splits[0] = "__";
      console.log("setDescription", splits);
      let foundEmb = module.exports.embeds.find((e) => e.embId === splits[0]);
      if (!foundEmb) {
        module.exports.errors.push({
          message: `Failed to find embed with id \`${splits[0]}\` in @setDescription`,
        });
      } else {
        foundEmb.emb.setDescription(splits[1] || null);
      }
      script = script.replace(match[0], "");
    });

    [...script.matchAll(/^@setColor\[(.*)\]/gm)].forEach((match) => {
      let splits = match[1]
        .split(";")
        .map((s) => (s = module.exports.compile(s, msg, client, Gargs)));
      if (!splits[0]) splits[0] = "__";
      console.log("setColor", splits);
      let foundEmb = module.exports.embeds.find((e) => e.embId === splits[0]);
      if (!foundEmb) {
        module.exports.errors.push({
          message: `Failed to find embed with id \`${splits[0]}\` in @setColor`,
        });
      } else {
        try {
          foundEmb.emb.setColor(splits[1]);
        } catch {
          module.exports.errors.push({
            message: `Invalid color \`${splits[1]}\` for embed with id \`${splits[0]}\` in @setColor`,
          });
        }
      }
      script = script.replace(match[0], "");
    });

    [...script.matchAll(/^@setFooter\[(.*)\]/gm)].forEach((match) => {
      let splits = match[1]
        .split(";")
        .map((s) => (s = module.exports.compile(s, msg, client, Gargs)));
      if (!splits[0]) splits[0] = "__";
      console.log("setFooter", splits);
      let foundEmb = module.exports.embeds.find((e) => e.embId === splits[0]);
      if (!foundEmb) {
        module.exports.errors.push({
          message: `Failed to find embed with id \`${splits[0]}\` in @setFooter`,
        });
      } else {
        foundEmb.emb.setFooter({
          text: splits[1] || null,
          iconURL: splits[2] || null,
        });
      }
      script = script.replace(match[0], "");
    });

    [...script.matchAll(/^@setAuthor\[(.*)\]/gm)].forEach((match) => {
      let splits = match[1]
        .split(";")
        .map((s) => (s = module.exports.compile(s, msg, client, Gargs)));
      if (!splits[0]) splits[0] = "__";
      console.log("setAuthor", splits);
      let foundEmb = module.exports.embeds.find((e) => e.embId === splits[0]);
      if (!foundEmb) {
        module.exports.errors.push({
          message: `Failed to find embed with id \`${splits[0]}\` in @setAuthor`,
        });
      } else {
        foundEmb.emb.setAuthor({
          name: splits[1] && splits[1].length >= 1 ? splits[1] : "-",
          iconURL: splits[2] || null,
          url: splits[3] || null,
        });
      }
      script = script.replace(match[0], "");
    });

    [...script.matchAll(/^@setTimestamp\[(.*)\]/gm)].forEach((match) => {
      console.log("setTimestamp", match[1]);
      if (!match[1]) match[1] = "__";
      let foundEmb = module.exports.embeds.find((e) => e.embId === match[1]);
      if (!foundEmb) {
        module.exports.errors.push({
          message: `Failed to find embed with id \`${match[1]}\` in @setTimestamp`,
        });
      } else {
        foundEmb.emb.setTimestamp(new Date());
      }
      script = script.replace(match[0], "");
    });

    [...script.matchAll(/^@addField\[(.*)\]/gm)].forEach((match) => {
      let splits = match[1]
        .split(";")
        .map((s) => (s = module.exports.compile(s, msg, client, Gargs)));
      if (!splits[0]) splits[0] = "__";
      console.log("addField", splits);
      let foundEmb = module.exports.embeds.find((e) => e.embId === splits[0]);
      if (!foundEmb) {
        module.exports.errors.push({
          message: `Failed to find embed with id \`${splits[0]}\` in @addField`,
        });
      } else {
        let name = splits[1] || null;
        let value = splits[2] || "";
        let inline =
          splits[3] && splits[3].toLowerCase() === "yes" ? true : false;
        foundEmb.emb.addFields({ name, value, inline });
      }
      script = script.replace(match[0], "");
    });

    [...script.matchAll(/^@id\[(.*)\]/gm)].forEach((match) => {
      match[1] = module.exports.compile(match[1], msg, client, Gargs);
      console.log("@id", match[1]);
      if (!match[1]) {
        match[1] = msg.member.user.tag;
      }
      let found =
        msg.guild.members.cache.find((u) => u.user.tag === match[1]) || null;
      if (!found) {
        found =
          msg.guild.members.cache.find((u) => u.user.username === match[1]) ||
          null;
      }
      if (found) {
        script = script.replace(match[0], found.user.id);
      } else {
        script = script.replace(match[0], "");
      }
    });

    [...script.matchAll(/^@discriminator\[(.*)\]/gm)].forEach((match) => {
      match[1] = module.exports.compile(match[1], msg, client, Gargs);
      console.log("@discriminator", match[1]);

      let found =
        msg.guild.members.cache.get(match[1] || msg.member.user.id) || null;
      if (found) {
        script = script.replace(match[0], found.user.discriminator);
      } else {
        script = script.replace(match[0], "");
      }
    });

    [...script.matchAll(/^@avatar\[(.*)\]/gm)].forEach((match) => {
      match[1] = module.exports.compile(match[1], msg, client, Gargs);
      console.log("@avatar", match[1]);

      let found =
        msg.guild.members.cache.get(match[1] || msg.member.user.id) || null;
      if (found) {
        script = script.replace(match[0], found.user.avatarURL());
      } else {
        script = script.replace(match[0], "");
      }
    });

    [...script.matchAll(/^@username\[(.*)\]/gm)].forEach((match) => {
      match[1] = module.exports.compile(match[1], msg, client, Gargs);
      console.log("@username", match[1]);

      let found =
        msg.guild.members.cache.get(match[1] || msg.member.user.id) || null;
      if (found) {
        script = script.replace(match[0], found.user.username);
      } else {
        script = script.replace(match[0], "");
      }
    });

    return script;
  },
};
