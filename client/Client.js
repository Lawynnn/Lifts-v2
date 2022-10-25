const Discord = require('discord.js');
const { Bot } = require('../database/schema/Bot');
const { compiler } = require('../compiler/compiler');
const { DError, errorStore } = require('../compiler/errors/store');
const { embedReader } = require('../compiler/plugins/embed');

class client {
    constructor() {
        /**
         * @type {Discord.Client[]}
         */
        this.clients = [];
    }

    /**
     * 
     * @param {Discord.Client} client 
     * @returns true if Client is in the clients list and false if otherwise
     */
    inListClient(client) {
        return this.clients.find(c => c.user?.username === client.user?.username && c.user?.discriminator === client.user?.discriminator) ? true : false;
    }


    /**
     * 
     * @param {string} token 
     * @param {string} _id 
     * @returns 
     */
    async joinClient(token, _id, expire_timestamp = new Date().getTime(), intents = [ new Discord.IntentsBitField(32767), Discord.GatewayIntentBits.MessageContent ]) {
        const client = new Discord.Client({
            intents: intents
        });
        let success = await client.login(token).catch(err => {return false});
        if(!success) return false;

        let dupes = this.clients.findIndex(cl => cl._id === _id);
        if(dupes > -1) {
            this.clients.splice(dupes, 1);
        }

        this.clients.push({
            _id: _id,
            expire: expire_timestamp,
            client: client
        });

        console.log(`Added ${client.user.tag} [total: ${this.clients.length}]`);
        return true;
    }

    /**
     * 
     * @param {string} _id 
     * @returns 
     */
    async leaveClient(_id) {
        let found = this.clients.findIndex(cl => cl._id === _id);
        if(found <= -1) return false;

        let client = this.clients[found];
        client.client.destroy();
        this.clients.splice(found, 1);
        console.log(`Removed ${client.client.user.tag} [total: ${this.clients.length}]`);

        return true;
    }

    /**
     * 
     * @param {string} _id 
     * @returns 
     */
    existingClient(_id) {
        let found = this.clients.findIndex(cl => cl._id === _id);
        if(found <= -1) return false;

        return true;
    }

    /**
     * 
     * @param {Discord.Client} client 
     */
    async addClient(client, token = null, reqUser = null) {
        client.token = token;
        this.removeClient(client);
        let clientReturn = null;
        client.login(token).then(async () => {
            console.log("Logged before inListClient function.");
            if (!this.inListClient(client)) {
                clientReturn = client;
                this.clients.push(client);
                let data = await Bot.findOne({owner: reqUser.id, "data.id": client.user.id}).exec();
                console.log(`Client ${client.user.tag} added! [${this.clients.length}]`);
                client.on('messageCreate', (message) => {
                    if(message.author.bot) return false;
                    /**
                     * TODO: Add script compiler here;
                     */
                    let trigger = message.content.trim().split(" ")[0];

                    data.commands.forEach(command => {
                        if (command.trigger === trigger) {
                            let script = command.script;
                            script = compiler.compile(script, message, client);
                            if(!errorStore.canExecute()) {
                                message.channel.send({embeds: [errorStore.get()[0].embed]});
                                return;
                            }
                            
                            if(embedReader.embedList.length > 0) {
                                if(script) {
                                    message.channel.send({content: script, embeds: embedReader.embedList.map(c => c.embed)});
                                }
                                else {
                                    message.channel.send({embeds: embedReader.embedList.map(c => c.embed)});
                                }
                                embedReader.embedList = [];
                            }
                            else {
                                if(script) {
                                    message.channel.send(script);
                                }
                            }
                        }
                    })
                    // message.channel.send(`Im online!`);
                })
                
            }
        }).catch(err => {
            console.log(err);
        })

        return clientReturn;
    }

    /**
     * Update every active client
     */
    async Update() {
        this.clients.forEach(client => {
            if(client.expire < new Date().getTime()) {
                this.leaveClient(client._id);
            }
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Discord.Client} client
     * @param {Bot} data
     */
    messageHook(message, client, data) {
        if(message.author.bot) return false;

        let trigger = message.content.trim().split(" ")[0];

        data.commands.forEach(command => {
            if (command.trigger === trigger) {
                let script = command.script;
                script = compiler.compile(script, message, client);
                if(!errorStore.canExecute()) {
                    message.channel.send({embeds: [errorStore.get()[0].embed]});
                    return;
                }
                
                if(embedReader.embedList.length > 0) {
                    if(script) {
                        message.channel.send({content: script, embeds: embedReader.embedList.map(c => c.embed)});
                    }
                    else {
                        message.channel.send({embeds: embedReader.embedList.map(c => c.embed)});
                    }
                    embedReader.embedList = [];
                }
                else {
                    if(script) {
                        message.channel.send(script);
                    }
                }
            }
        })
    }

    /**
     * Add new client on the servers
     * 
     * @param {string} token - Bot token
     */
    async addClient(token) {
        let client = new Discord.Client({
            intents: [Object.keys(Discord.Intents.FLAGS)]
        });

        let logged = await client.login(token).catch(e => {return false});
        if(!logged) {
            return null;
        }

        let found = this.clients.find(c => c.user.id.toString() === client.user.id.toString());
        if(found) {
            found.destroy();
            this.clients.splice(this.clients.indexOf(found), 1);
        }
        this.clients.push(client);
        console.log(`Client ${client.user.tag} added! [${this.clients.length}]`);

        client.on('messageCreate', async (message) => {
            let data = await Bot.findOne({token: token, "data.id": client.user.id}).exec();
            this.messageHook(message, client, data);
        })
        return client;
    }

    /**
     * @param {Discord.Client} client
     */
    async refreshClient(token, user = null) {
        let client = this.clients.find(c => c.token === token);
        if(!client) {
            return null;
        }
        client.destroy();
        this.clients.splice(this.clients.indexOf(client), 1);

        let newClient = new Discord.Client({intents: [Object.keys(Discord.Intents.FLAGS)]});
        let logged = await newClient.login(token);
        if(!logged) {
            return null;
        }
        newClient.on('messageCreate', async (message) => {
            let data = await Bot.findOne({token: token, "data.id": client.user.id}).exec();
            this.messageHook(message, newClient, data);
        })
        console.log(`Client ${newClient.user.tag} refreshed! [${new Date().toDateString()}]`);
        return client;
    }

    /**
     * 
     * @param {Discord.Client} client 
     */
    removeClient(client) {
        if (this.inListClient(client)) {
            client.destroy();
            console.log(`Client ${client.user.tag} removed! [${this.clients.length}]`);
            this.clients.splice(this.clients.indexOf(client), 1);
        }
    }
}

module.exports.Clients = new client();