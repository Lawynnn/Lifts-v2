const Discord = require('discord.js');
const eventsEmitter = require('events');

module.exports = {
    /**
     * @type {Map}
     */
    activeClients: new Map(),
    /**
     * @type {eventsEmitter}
     */
    eventEmitter: new eventsEmitter(),
    /**
     * Store a client to the websocket server
     * @param {string} token 
     * @param {ObjectID} _id Must be a string
     * @param {Number} expire_timestamp 
     * @param {Discord.IntentsBitField[]} intents 
     * @returns {Map} client on success
     */
    store: async (token, _id, expire_timestamp = new Date().getTime(), intents = [ new Discord.IntentsBitField(32767), Discord.GatewayIntentBits.MessageContent ]) => {
        let clients = module.exports.activeClients;
        const client = new Discord.Client({
            intents: intents
        });
        
        let success = await client.login(token).catch(err => {return false});
        if(!success) return false;
        
        module.exports.remove(_id);
        
        let timeout = setTimeout(() => {
            module.exports.eventEmitter.emit("client.end", client, expire_timestamp);
            // console.log(`Client ${client.user.username} ended by timeout`);
            module.exports.remove(_id);
        }, expire_timestamp - new Date().getTime())
        clients.set(_id, {client, expire_timestamp, timeout});
        module.exports.eventEmitter.emit("client.store", client, expire_timestamp, timeout, _id);
        
        // console.log(`Client ${client.user.username} added`);
        return {client: clients.get(_id), _id: _id};
    },
    /**
     * Remove a client from websocket connection
     * @param {ObjectID} _id Must be a string
     * @returns {Map} client on success
     */
    remove: (_id) => {
        let clients = module.exports.activeClients;
        if(!clients.has(_id)) {
            return false;
        }

        let client = clients.get(_id);
        module.exports.eventEmitter.emit("client.remove", client.client, client.expire_timestamp, client.timeout);
        client.client.destroy();
        clearTimeout(client.timeout);
        clients.delete(_id);
        return {client: clients.get(_id), _id: _id};
    },
    /**
     * Reload a client from the websocket server connection. 
     * This may be used for reloading a command or bot status, reloads all code
     * @param {ObjectID} _id Must be a string
     * @returns {Map} client on success
     */
    reload: async(_id) => {
        let clients = module.exports.activeClients;
        if(!clients.has(_id)) {
            console.log("Client has error")
            return false;
        }

        let client = clients.get(_id);
        if(client.expire_timestamp < new Date().getTime()) {
            client.client.destroy();
            console.log("Client expired error");
            return false;
        }

        let token = client.client.token;
        client.client.destroy();
        await client.client.login(token).catch(err => {return false});
        
        module.exports.eventEmitter.emit("client.reload", client.client, client.expire_timestamp, client.timeout);
        return {client, _id};
    }

}