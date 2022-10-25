const { urlencoded } = require('express');
const express = require('express');
const handlebars = require('express-handlebars');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
var https = require("https");
var fs = require('node:fs');
const Store = require('connect-mongo');

require('handlebars-helpers')();
const {db} = require("./database/connect");

const { Clients } = require('./client/Client');

const app = express()
    .use(express.urlencoded({extended: true}))
    .use(express.json())
    .use(session({
        secret: "sha256_0382DJBA843JSA73MFA05JFA74JFA9784GFDS74H7GF32G2GF7GH5GF57SGH8BND8ADC8HYG7R",
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 * 24 },
        resave: false,
        store: Store.create(db.connection)
    }))
    .use(passport.initialize())
    .use(passport.session())
    .use(express.static('./public'))
    .set('view engine', 'hbs')
    .set('views', './views')
    .engine('hbs', handlebars.engine({
        extname: '.hbs',
        defaultLayout: 'home',
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true
        }
    }))
    .use("/api/v1/", require('./routes/api'))
    .use("/", require('./routes/slash'))
    .use(cookieParser());


// https
//     .createServer(
//       {
//         key: fs.readFileSync("server.key"),
//         cert: fs.readFileSync("server.cert"),
//       },
//       app
//     )
app
    .listen(process.env.PORT || 8080, () => {
    setInterval(() => {
        Clients.Update();
    }, 1500);
    console.log("Server is running on port: " + (process.env.PORT || 8080));
});