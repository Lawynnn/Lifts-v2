const passport = require('passport');
const { Strategy } = require('@oauth-everything/passport-discord');

const { User } = require('../database/schema/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
})
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findOne({id: id});
        return user ? done(null, user) : done(null, null);
    } catch(e) {
        console.log(e);
        done(e, null);
    }
});

passport.use(new Strategy({
    clientID: "1016397444038283304",
    clientSecret: "UXoCPI7t_IVbXU_1pNQ_WV6zIp-j96XF",
    scope: ['identify', 'email'],
    callbackURL: process.env.CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const findUser = await User.findOneAndUpdate({"id": profile._json.id}, {
            "username": profile._json.username,
            "discriminator": profile._json.discriminator,
            "email": profile._json.email,
            "avatar": profile._json.avatar,
            "verified": profile._json.verified,
            "locale": profile._json.locale,
            "lastLogin": new Date()
        }, {new: true}).lean();
    
        if(findUser) {
            console.log("User founded!");
            return done(null, findUser);
        } else {
            const newUser = await User.create({
                id: profile._json.id,
                username: profile._json.username,
                discriminator: profile._json.discriminator,
                email: profile._json.email,
                avatar: profile._json.avatar,
                verified: profile._json.verified,
                locale: profile._json.locale,
                createdAt: new Date(),
                lastLogin: new Date()
            })
            return done(null, newUser);
        }
    } catch(e) {
        console.log(e);
        return done(e, null);
    }
}))

module.exports = passport;