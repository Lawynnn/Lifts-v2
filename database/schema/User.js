const mongoose = require('mongoose');

module.exports.User = mongoose.model('Users', new mongoose.Schema({
    id: String,
    username: String,
    email: String,
    discriminator: String,
    avatar: String,
    verified: Boolean,
    locale: String,
    rank: {
        type: String,
        default: "Member"
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    updatedAt: {
        type: Date,
        default: new Date()
    },
    lastLogin: {
        type: Date,
        default: new Date()
    }
}));