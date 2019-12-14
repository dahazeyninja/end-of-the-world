const config = require('../config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

const cmds = {};

let channel;

//const sqlite3 = require('sqlite3');
//const db = new sqlite3.Database('database.db');

client.on('ready', () => {
	console.log('[Discord Bot] Ready!');
	// client.user.setActivity('you', {type: 'PLAYING'});
});

client.on('message', (message)=>{
	if (!message.guild){
		return;
	}
	const cmd = message.content.split(' ', 1)[0];

	if (cmd in cmds) {
		cmds[cmd](message);
	}

	if (message.guild.id === config.server){
		if (!channel){
			channel = message.guild.channels.find(ch => ch.id === config.channel);
			console.log(`#${channel.name} set as event drop channel`);
		}

		messageChance();
	}
});

client.on('error', (error) => {
	console.error(error);
});

client.login(config.token);

let i = 0;
const charityTimeout = function(){
	return setTimeout(()=>{
		console.log('test' + i);
		i++;
		charityTimeout();
	}, 5000);
};

charityTimeout();

function messageChance(){
	const num = Math.random() * 100;

	clearTimeout(charityTimeout);

	if (num <= config.chance){
		console.log('RNGsus smiles upon you');
		channel.send('RNGsus smiles upon you');
	}
}