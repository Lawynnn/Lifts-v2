const Discord = require('discord.js');

const Clients = new Map();

async function createClient(token) {
    const client = new Discord.Client({
        intents: [ new Discord.IntentsBitField(32767), Discord.GatewayIntentBits.MessageContent ]
    });
    let cli = await client.login(token).catch(err => { return {
        "error": true,
        "code": err.code
    }});
    if(cli.error) {
        return console.log(cli.code);
    }
    Clients.set("1", {client: client, timeout: setTimeout(() => { 
        Clients.delete("1");
        console.log("Client 1 deleted");
    }, 5000)});
    console.log("Client 1 added with timeout of 10 seconds");
    return client;
}

console.log(new Date(new Date().setSeconds(50)).getTime() - new Date().getTime())

createClient("MTAwMzM3NzU4MjczOTMxMjY5MA.GFmNrf.ko2MDcJfUZG_CkaLH4mCoIIoAQ5GV5u3rY25v8").then(cli => {
    clearTimeout(Clients.get("1").timeout);
    Clients.delete("1");
});
