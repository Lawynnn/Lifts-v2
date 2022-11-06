const express = require("express");
const route = express.Router();

const passport = require("../auth/discordAuth");
const { Auth } = require("../auth/middleware");

const { Bot } = require("../database/schema/Bot");

const { recaptcha } = require("../auth/recaptcha");

route.get("/", (req, res, next) => {
  res.render("home", {
    layout: false,
    user: req.user,
  });
});

route.get("/dashboard", Auth, async (req, res, next) => {
  let bots = await Bot.find({ owner: req.user.id });
  res.render("manage/dashboard", {
    layout: false,
    bots,
    user: req.user,
  });
});

route.get(
  "/dashboard/:id",
  recaptcha.middleware.render,
  Auth,
  async (req, res, next) => {
    let id = req.params.id;
    const bots = await Bot.find({ owner: req.user.id }).lean();
    let active = bots.find((b) => b._id.toString() === id) || null;
    let captchaCode = (Math.random() + 1).toString(36).substring(7);
    req.session.captchaCode = captchaCode;
    res.render("manage/dashboard", {
      layout: false,
      user: req.user,
      captcha: recaptcha.render(),
      captchaCode: req.session.captchaCode,
      bots,
      active,
      activeOnline:
        active && active.hostingEnd > new Date().getTime() ? true : false,
      activeAvatar:
        active &&
        active.data.avatar.split("/")[
          active.data.avatar.split("/").length - 1
        ] !== "null.png"
          ? true
          : false,
    });
  }
);

route.get("/dashboard/:id/command/:cmdid", Auth, async (req, res, next) => {
  let id = req.params.id;
  let cmdid = req.params.cmdid;
  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch(
    (e) => null
  );
  if (!bot) {
    return res.render("error", {
      layout: false,
      code: 404,
      description: `Cant find any bot with this id`,
      user: req.user,
    });
  }

  let command = bot.commands.find((c) => c._id.toString() == cmdid);
  if (!command) {
    return res.render("error", {
      layout: false,
      code: 404,
      description: `Cant find any command with this id`,
      user: req.user,
    });
  }

  res.render("command/manager", {
    layout: false,
    user: req.user,
    bot: bot,
    command: command,
  });
});

route.get("/dashboard/:id/command/", Auth, async (req, res, next) => {
  let id = req.params.id;
  let bot = await Bot.findOne({ owner: req.user.id, _id: id }).catch(
    (e) => null
  );
  if (!bot) {
    return res.render("error", {
      layout: false,
      code: 404,
      description: `Cant find any bot with this id`,
      user: req.user,
    });
  }

  res.render("command/list", {
    layout: false,
    user: req.user,
    bot: bot,
    commands: bot.commands,
  });
});

route.get("/auth/discord", passport.authenticate("discord"));
route.get(
  "/auth/discord/after",
  passport.authenticate("discord"),
  (req, res, next) => {
    res.redirect("https://m9t926.csb.app/");
  }
);
route.get("/logout", Auth, (req, res, next) => {
  req.session.destroy();
  res.redirect("https://m9t926.csb.app/");
});

module.exports = route;
