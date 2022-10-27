const express = require("express");
const handlebars = require("express-handlebars");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const Store = require("connect-mongo");

require("handlebars-helpers")();
const { db } = require("./database/connect");
require("dotenv").config();

const app = express()
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(
    session({
      secret: process.env.SESSION_ENCRYPT,
      saveUninitialized: true,
      cookie: { maxAge: 1000 * 60 * 60 * 24 },
      resave: false,
      store: Store.create(db.connection),
    })
  )
  .use(passport.initialize())
  .use(passport.session())
  .use(express.static("./public"))
  .set("view engine", "hbs")
  .set("views", "./views")
  .engine(
    "hbs",
    handlebars.engine({
      extname: ".hbs",
      defaultLayout: "home",
      runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
      },
    })
  )
  .use("/api/v1/", require("./routes/api"))
  .use("/", require("./routes/slash"))
  .use("*", (req, res, next) => {
    res.status(404);
    res.render("error", {
      layout: false,
      user: req.user,
      code: res.statusCode,
      description: `Could not found this page.`,
    });
  })
  .use(cookieParser());

app.listen(process.env.PORT || 8080, () => {
  console.log("Server is running on port: " + (process.env.PORT || 8080));
});
