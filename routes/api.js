const express = require("express");
const route = express.Router();
const { Auth } = require("../auth/middleware");

const Discord = require("discord.js");
const { Bot } = require("../database/schema/Bot");

const clientStore = require("../client/clientStore");

const { recaptcha } = require("../auth/recaptcha");
const fetch = require("node-fetch");

const CryptoJS = require("crypto-js");
const Compiler = require("../compiler/compiler");
const slowDown = require("express-slow-down");
require("dotenv").config();

clientStore.eventEmitter.on("client.store", (client, expire, timeout, _id) => {
  client.on("messageCreate", async (message) => {
    let bot = await Bot.findOne({ _id });
    let commands = bot.commands;
    let variables = bot.variables;

    commands.forEach(async (command) => {
      const args = message.content
        .replace(command.trigger, "")
        .trimStart()
        .split(/ +/g);
      const cmd = message.content.slice(0, command.trigger.length);
      let content = command.script;
      if (command.trigger === cmd) {
        let embeds = [];
        let errors = [];
        if (content) {
          content = Compiler.compile(content, message, client, args);

          errors = Compiler.errors;
          embeds = Compiler.embeds.map((e) => e.emb);
          Compiler.clean();
        }
        if (errors.length > 0) {
          await message.channel.send({
            embeds: [
              new Discord.EmbedBuilder()
                .setTitle(":x: Error")
                .setColor("#ff0000")
                .setDescription(
                  `Here is error message\n\`\`\`\n${errors
                    .map((e) => `${e.message}`)
                    .join("\n")}\`\`\``
                )
                .setTimestamp(new Date()),
            ],
          });
          return;
        }
        await message.channel.send({ content, embeds }).catch((err) => {
          message.channel.send({
            embeds: [
              new Discord.EmbedBuilder()
                .setTitle(":x: Error")
                .setColor("#ff0000")
                .setDescription(
                  `Here is error message\n\`\`\`\n${err.message}\`\`\``
                )
                .setTimestamp(new Date()),
            ],
          });
        });
      }
    });
  });
  console.log(
    `Added: ${client.user.tag}, expire: ${(
      expire - new Date().getTime()
    ).toFixed(5)}`
  );
});

clientStore.eventEmitter.on("client.reload", (client, expire, timeout) => {
  console.log(
    `Reloaded: ${client.user.tag}, expire: ${expire - new Date().getTime()}`
  );
});

route.post("/", (req, res, next) => {
  res.json({
    message: "Welcome to the API",
    version: "1.0.0",
  });
});

route.get("/bot/:id/variable", Auth, async (req, res, next) => {
  let id = req.params.id;
  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
    return null;
  });

  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  res.status(200).json({
    success: true,
    message: "Variables retrieved successfully",
    variables: bot.variables.sort(
      (a, b) => b.createdAt && new Date(b.createdAt) - new Date(a.createdAt)
    ),
  });
});

route.post("/bot/:id/variable", Auth, async (req, res, next) => {
  let id = req.params.id;
  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
    return null;
  });

  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  if (bot.variables.length > req.user.tier.maxBotVariables) {
    return res.status(400).json({
      success: false,
      error: {
        code: "variables_limit",
        message: `You have gain variables limit of ${req.user.tier.maxBotVariables}`,
      },
    });
  }

  let { name, value } = req.body;
  if (!name) {
    return res.status(400).json({
      success: false,
      error: { code: 5431111, message: "Please put a name to your variable" },
    });
  }

  if (bot.variables.find((v) => v.name === name)) {
    return res.status(400).json({
      success: false,
      error: { code: 5431432, message: "Name already exists" },
    });
  }

  bot.variables.push({
    name,
    value: {
      global: name,
      servers: [],
      users: [],
    },
  });
  bot.save();
  res.status(200).json({
    success: true,
    message: "Variable created successfully.",
    variable: { name, value: value || null },
  });
});

route.delete("/bot/:id/host", Auth, async (req, res, next) => {
  let id = req.params.id;

  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
    return null;
  });
  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  if (new Date().getTime() > bot.hostingEnd) {
    return res.status(400).json({
      success: false,
      error: { code: "bot_host_one_time", message: "Bot its already stopped" },
    });
  }

  clientStore.remove(id);
  bot.hostingEnd = new Date();
  bot.updatedAt = new Date();
  await bot.save();
  res.status(200).json({
    success: true,
    message: "Hosting time stopped",
  });
});

route.post(
  "/bot/:id/host",
  recaptcha.middleware.verify,
  Auth,
  async (req, res, next) => {
    let id = req.params.id;

    // if(req.recaptcha.error) {
    //     return res.status(400).json({
    //         success: false,
    //         error: { code: code.error.invalid_recaptcha_code, message: "Invalid recaptcha code provided" }
    //     })
    // }
    // let captchaCode = req.body.captchaCode || null;
    // if(captchaCode != req.session.captchaCode) {
    //     return res.status(400).json({
    //         success: false,
    //         error: { code: 8532, message: "Invalid captcha code" }
    //     })
    // }
    req.session.captchaCode = (Math.random() + 1).toString(36).substring(7);

    let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
      return null;
    });
    if (!bot) {
      return res.status(400).json({
        success: false,
        error: {
          code: "bot_not_found",
          message: "You dont own this bot or no longer exists",
        },
      });
    }

    if (new Date().getTime() < bot.hostingEnd) {
      return res.status(400).json({
        success: false,
        error: {
          code: "bot_host_one_time",
          message: "You cant host your bot for more than once time",
          time_left: Math.floor(bot.hostingEnd - new Date().getTime()),
        },
      });
    }

    let now = new Date();
    let multiplier =
      now.getTime() < bot.hostingEnd ? bot.hostingEnd : now.getTime();
    let hostTime = new Date(multiplier);
    if (req.user.tier.isPremiumUser)
      hostTime.setMonth(hostTime.getMonth() + 999);
    else hostTime.setMinutes(hostTime.getMinutes() + 30);
    bot.hostingEnd = hostTime.getTime();

    let serverClient = await clientStore.store(
      CryptoJS.AES.decrypt(
        bot.token.toString(),
        process.env.ENCRYPT_BOT_TOKEN
      ).toString(CryptoJS.enc.Utf8),
      bot._id.toString(),
      hostTime.getTime()
    );
    if (!serverClient) {
      return res.status(400).json({
        success: false,
        error: {
          code: "invalid_bot_token",
          message: "Your bot token is invalid or your id doesnt match",
        },
      });
    }
    bot.updatedAt = new Date();
    await bot.save();
    res.status(200).json({
      success: true,
      message: "Hosting time extended",
      hostTime: hostTime,
      hostEnd: bot.hostingEnd,
    });
  }
);

route.get("/bot/:id/host", Auth, async (req, res, next) => {
  let id = req.params.id;

  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
    return null;
  });
  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  if (bot.hostingEnd > new Date()) {
    const diffTime = Math.abs(bot.hostingEnd - new Date());
    let seconds = Math.floor((diffTime / 1000) % 60);
    let minutes = Math.floor((diffTime / 1000 / 60) % 60);
    let hours = Math.floor((diffTime / 1000 / 60 / 60) % 24);
    let days = Math.floor((diffTime / 1000 / 60 / 60 / 24) % 7);
    let weeks = Math.floor(diffTime / 1000 / 60 / 60 / 24 / 7);

    res.status(200).json({
      success: true,
      message: "Hosting time recived",
      format: `${weeks > 0 ? weeks + "w " : ""}${days > 0 ? days + "d " : ""}${
        hours > 0 ? hours + "h " : ""
      }${minutes > 0 ? minutes + "m " : ""}${seconds + "s"}`,
      expired: false,
      timestamp: bot.hostingEnd.getTime(),
      time: {
        seconds: seconds,
        minutes: minutes,
        hours: hours,
        days: days,
        weeks: weeks,
      },
    });
  } else {
    res.status(200).json({
      success: true,
      message: "Hosting time expired",
      format: `Expired`,
      expired: true,
    });
  }
});

route.post("/bot/:id/share", Auth, async (req, res, next) => {
  let id = req.params.id;
  let shareCode = req.body.code || null;

  if (!shareCode) {
    return res.status(400).json({
      success: false,
      error: { code: "missing_params", message: "Your params are missing" },
    });
  }

  let sharedBot = await Bot.findOne({ shareCode: code }).catch((e) => {
    return null;
  });
  if (!sharedBot || !sharedBot.useShareCode) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_share_code",
        message: "Your share code is invalid",
      },
    });
  }

  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
    return null;
  });
  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  if (bot.shareCode === sharedBot.shareCode) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_share_code",
        message: "You cant use this share code for this bot",
      },
    });
  }

  res.status(200).json({
    success: true,
    message: "Share code found",
    shared: {
      owner: sharedBot.owner,
      commands: sharedBot.commands,
      variables: sharedBot.variables,
      folders: sharedBot.folders,
    },
  });
});

route.patch("/bot/:id/folder", Auth, async (req, res, next) => {
  let id = req.params.id;

  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
    return null;
  });

  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  let folder_name = req.body.folder_name;

  if (!folder_name || folder_name === "~default~") {
    return res.status(400).json({
      success: false,
      error: {
        code: "missing_params",
        message: "Your params are missing or cant be main folder",
      },
    });
  }

  if (folder_name.length > 75 || folder_name.length < 1) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_param_length",
        message:
          "Your folder name must be at least 1 character and must not be more than 75 characters",
      },
    });
  }

  let slicePart = bot.folders.findIndex((f) => f.name === folder_name);
  if (slicePart < 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "folder_not_exists",
        message: "Cant find this folder in the folder list",
      },
    });
  }

  let commandsUpdated = [];
  bot.commands.map((cmd) => {
    if (cmd.folder === bot.folders[slicePart].name) {
      cmd.folder = "~default~";
      commandsUpdated.push(cmd.name);
    }
  });
  bot.folders.splice(slicePart, 1);
  bot.updatedAt = new Date();
  await bot.save();
  res.status(200).json({
    success: true,
    message: "Successfully removed a folder",
    folder: {
      name: folder_name,
      updated: commandsUpdated,
    },
  });
});

route.put("/bot/:id/folder", Auth, async (req, res, next) => {
  let id = req.params.id;

  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
    return null;
  });

  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  let folder_name = req.body.folder_name;

  if (!folder_name) {
    return res.status(400).json({
      success: false,
      error: {
        code: "missing_params",
        message: "Your folder name param is missing",
      },
    });
  }

  if (folder_name.length > 75 || folder_name.length < 1) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_param_length",
        message:
          "Your folder name must be at least 1 character and must not be more than 75 characters",
      },
    });
  }

  if (bot.folders.find((f) => f.name === folder_name)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "folder_already_exists",
        message: "You already have a folder with this name",
      },
    });
  }

  bot.folders.push({
    name: folder_name,
    createdAt: new Date(),
  });

  bot.updatedAt = new Date();
  await bot.save();
  res.status(200).json({
    success: true,
    message: "Successfully created a new folder",
    folder: {
      name: folder_name,
      createdAt: new Date(),
    },
  });
});

route.post(
  "/bot/:id/command/:cmdid",
  Auth,
  slowDown({
    windowMs: 20 * 1000,
    delayMs: 500,
    delayAfter: 5,
  }),
  async (req, res, next) => {
    let id = req.params.id;
    let cmdId = req.params.cmdid;

    let cmd_name = req.body.cmd_name || null;
    let cmd_trigger = req.body.cmd_trigger || null;
    let cmd_script = req.body.cmd_script || null;
    let cmd_folder = req.body.cmd_folder || null;

    if (req.slowDown.delay > 0) {
      return res.status(429).json({
        success: false,
        error: {
          code: 429,
          message: "You are on slow down, please wait before another request",
        },
      });
    }

    let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
      return null;
    });

    if (!bot) {
      return res.status(400).json({
        success: false,
        error: {
          code: "bot_not_found",
          message: "You dont own this bot or no longer exists",
        },
      });
    }

    let cmd = bot.commands.find((cmd) => cmd._id.toString() === cmdId);
    if (!cmd) {
      return res.status(400).json({
        success: false,
        error: {
          code: 9875294,
          message: "This command is not available anymore",
        },
      });
    }

    if (!cmd_name) cmd_name = cmd.name;
    if (!cmd_trigger) cmd_trigger = cmd.trigger;
    if (!cmd_folder) cmd_folder = cmd.folder;

    if (!cmd_name || !cmd_trigger) {
      return res.status(400).json({
        success: false,
        error: {
          code: "missing_params",
          message: "You are missing some params in the request",
        },
      });
    }

    if (cmd_name.length > 75 || cmd_name.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: "invalid_param_length",
          message:
            "Your command name must be at least 2 characters and must not be more than 75 characters",
        },
      });
    }

    if (cmd_trigger.length > 125 || cmd_trigger.length < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: "invalid_param_length",
          message:
            "Your command trigger must be at least 1 character and must not be more than 125 characters",
        },
      });
    }

    if (!bot.folders.find((f) => f.name === cmd_folder)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "invalid_folder",
          message:
            "Could not find any folder with this name to put command into",
        },
      });
    }

    cmd.name = cmd_name;
    cmd.trigger = cmd_trigger;
    cmd.script = cmd_script;
    cmd.folder = cmd_folder;
    cmd.updatedAt = new Date();
    bot.save();
    res.status(200).json({
      success: true,
      message: "Successfully edited a new command",
      cmd,
    });
  }
);

route.put("/bot/:id/command/", Auth, async (req, res, next) => {
  let id = req.params.id;

  let cmd_name = req.body.cmd_name;
  let cmd_trigger = req.body.cmd_trigger;
  let cmd_script = req.body.cmd_script || null;
  let cmd_folder = req.body.cmd_folder || "~default~";

  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
    return null;
  });

  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  if (bot.commands.length > req.user.tier.maxBotCommands) {
    return res.status(400).json({
      success: false,
      error: {
        code: "commands_limit",
        message: `You have gain commands limit of ${req.user.tier.maxBotCommands}`,
      },
    });
  }

  if (!cmd_name || !cmd_trigger) {
    return res.status(400).json({
      success: false,
      error: {
        code: "missing_params",
        message: "You are missing some params in the request",
      },
    });
  }

  if (cmd_name.length > 75 || cmd_name.length < 2) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_param_length",
        message:
          "Your command name must be at least 2 characters and must not be more than 75 characters",
      },
    });
  }

  if (cmd_trigger.length > 125 || cmd_trigger.length < 1) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_param_length",
        message:
          "Your command trigger must be at least 1 character and must not be more than 125 characters",
      },
    });
  }

  if (!bot.folders.find((f) => f.name === cmd_folder)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_folder",
        message: "Could not find any folder with this name to put command into",
      },
    });
  }

  bot.commands.push({
    name: cmd_name,
    trigger: cmd_trigger,
    script: cmd_script,
    folder: cmd_folder,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  bot.updatedAt = new Date();
  bot.save();
  let reloaded = await clientStore.reload(id);

  res.status(200).json({
    success: true,
    message: "Successfully created a new command",
    reloaded: reloaded ? true : false,
    command: {
      name: cmd_name,
      trigger: cmd_trigger,
      script: cmd_script,
      folder: cmd_folder === "~default~" ? "Default folder" : cmd_folder,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    },
  });
});

route.delete("/bot/:id", Auth, async (req, res, next) => {
  let id = req.params.id;

  clientStore.remove(id);
  let bot = await Bot.findOneAndDelete({ owner: req.user.id, _id: id }).catch(
    (e) => {
      return false;
    }
  );
  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  res.status(200).json({
    success: true,
    bot: bot,
    message: "Successfully deleted this bot",
  });
});

route.get("/bot", Auth, async (req, res, next) => {
  let bots = await Bot.find({ owner: req.user.id });
  return res.status(200).json({
    user: req.user,
    bots: bots.map((bot) => {
      return {
        _id: bot._id,
        data: bot.data,
        folders: bot.folders,
        commands: bot.commands,
        variables: bot.variables,
        online: clientStore.activeClients.has(bot._id.toString())
          ? true
          : false,
        createdAt: new Date(bot.createdAt),
        updatedAt: new Date(bot.updatedAt),
      };
    }),
  });
});

route.post("/bot/", Auth, async (req, res, next) => {
  let started = new Date().getTime();

  let token = req.body.token;
  let useShareCode = req.body.useShareCode || false;
  if (typeof useShareCode !== "boolean") useShareCode = false;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: {
        code: "missing_params",
        message: "You are missing the bot token param",
      },
    });
  }

  let bots = await Bot.find({ owner: req.user.id });
  if (bots.length > req.user.tier.maxBots) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_limit",
        message: `You have gain bot limit of ${req.user.tier.maxBots}`,
      },
    });
  }

  let searchDupe = await Bot.findOne({ owner: req.user.id, token: token });
  if (searchDupe) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_duplicated",
        message: "You already have an bot using this token",
      },
    });
  }

  let data = await fetch(`https://discord.com/api/v6/users/@me`, {
    method: "GET",
    headers: {
      Authorization: `Bot ${token}`,
    },
  }).then((r) => r.json());
  if (!data || data.code === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_bot_token",
        message: "You provided an invalid token for the bot",
      },
    });
  }
  let encrypedToken = CryptoJS.AES.encrypt(
    token,
    process.env.ENCRYPT_BOT_TOKEN
  ).toString();
  let bot = new Bot({
    token: encrypedToken,
    owner: req.user.id,
    data: {
      id: data.id,
      username: data.username,
      discriminator: data.discriminator,
      avatar: `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdAtMine: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    folders: [
      {
        name: "~default~",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    commands: [
      {
        name: "My first command",
        trigger: "!ping",
        script: "Pong!",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    variables: [
      {
        name: "Doggo",
        createdAt: new Date(),
        updatedAt: new Date(),
        value: {
          global: "Ham",
          servers: [],
          users: [],
        },
      },
    ],
  });

  await bot.save();
  res.status(200).json({
    success: true,
    bot: bot,
    response_time: new Date().getTime() - started,
  });
});

route.delete("/bot/:id/command/:cmdid", Auth, async (req, res, next) => {
  let id = req.params.id;
  let cmd_id = req.params.cmdid;

  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
    return null;
  });

  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  let cmd = bot.commands.findIndex((cmd) => cmd._id.toString() === cmd_id);
  if (cmd < 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "command_not_found",
        message: "Cant find an command with this id",
      },
    });
  }

  let backup = bot.commands[cmd];

  bot.commands.splice(cmd, 1);
  await bot.save();
  res.status(200).json({
    success: true,
    message: "Successfully removed a command",
    command: backup,
  });
});

route.get("/bot/:id/command", Auth, async (req, res, next) => {
  let id = req.params.id;
  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch((e) => {
    return null;
  });

  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  let foldered = [];
  bot.folders.forEach((folder) => {
    foldered.push({
      name: folder.name,
      cmds: bot.commands
        .map((cmd) => (cmd.folder === folder.name ? cmd : null))
        .filter((cmd) => cmd != null),
    });
  });

  res.status(200).json(foldered.reverse());
});

module.exports = route;
