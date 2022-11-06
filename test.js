const Discord = require("discord.js");

const client = new Discord.Client({
  intents: [
    "GuildMembers",
    "GuildMessages",
    "MessageContent",
    "Guilds",
    "DirectMessages",
    "GuildPresences",
  ],
});

client.login(
  "MTAyMTExNjgxNzc0MzI5NDUzNQ.G3MJyn.-sfwpPnvQwCWLjPA4_Cocn5RGrXwqr3s9lrjFU"
);

/*
@userID[@username[@userID[@username[@userID[Lawyn]]]]] @userID[Lawyn]
@userID[Lawyn] @userID[Lawyn]
@username[@userID[Lawyn]]
asdf@userID[Lawyn] @userID[Lawyn]

@username[@userID[@arg[0]]]

Tag Explode: @tag[@userID[@username[@userID[@username[@userID[@username[@userID[@arg[0]]]]]]]]]

@tag[@userID[@username[@userID[@arg[0]]]]]

@test[@userID[Lawyn];@username[@userID[Lawyn]]]

@tag[1000914472422084618]
Commits: \`@total\`
ExecTime: \`@execTime\`
*/

let script = `
@username[@userID[Lawyn]] @userID[Matusamiu]
Commits: \`@total\`
ExecTime: \`@execTime\`
`;

let backUp = script;
let total = 0;

/**
 * @param {string} script
 * @param {Discord.Message} message
 */
const compile = (script, message, args) => {
  [...script.matchAll(/(.*)(@userID\[(.*?)\])/gm)].forEach((match) => {
    total++;
    let first = match[1];
    let value = match[3];
    let entire = match[2];

    value = compile(value, message, args);
    // first = compile(first, message, args);
    console.table({
      "UserID.first": first,
      "UserID.value": value,
      "UserID.entire": entire,
    });
    console.log(total, "MATCHING USERID", value);
    let foundUser = message.guild.members.cache.find(
      (c) =>
        c.user.username === value || c.user.tag === value || c.user.id === value
    );
    if (foundUser) {
      script = script.replace(entire, foundUser.user.id);
    } else {
      script = script.replace(entire, "Invalid User ID");
    }
  });
  [...script.matchAll(/(.*)(@username\[(.*?)\])/gm)].forEach((match) => {
    total++;
    let first = match[1];
    let value = match[3];
    let entire = match[2];

    value = compile(value, message, args);
    // first = compile(first, message, args);
    console.table({
      "username.first": first,
      "username.value": value,
      "username.entire": entire,
    });
    console.log(total, "MATCHING USERNAME", value);
    let foundUser = message.guild.members.cache.find(
      (c) =>
        c.user.username === value || c.user.tag === value || c.user.id === value
    );
    if (foundUser) {
      script = script.replace(entire, foundUser.user.username);
    } else {
      script = script.replace(entire, "Invalid User Name");
    }
  });
  return script;
};

client.on("ready", () => {
  console.log(client.user.tag);
});

client.on("messageCreate", (message) => {
  let args = message.content.split(/ +/g).slice(1);
  let cmd = message.content.split(/ +/g).slice(0, 1)[0];
  let startTime = performance.now();
  if (cmd === ".test") {
    script = compile(script, message, args);
    script = script.replace(/@total/g, total);
    script = script.replace(/@ob/g, "[");
    script = script.replace(/@cb/g, "]");
    script = script.replace(
      /@execTime/g,
      `${(performance.now() - startTime).toFixed(3)}ms`
    );
    message.channel.send(script).catch((e) => console.log("empty message", e));
    script = backUp;
    total = 0;
  }
});
