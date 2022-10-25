module.exports.Auth = function Auth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/auth/discord");
}