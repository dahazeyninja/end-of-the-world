const config = require('../config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.db');

const cmds = {};

let channel;

client.on('ready', () => {
	console.log('[Discord Bot] Ready!');
	// client.user.setActivity('you', {type: 'PLAYING'});

	channel = client.channels.find(ch => ch.id === config.channel);
	console.log(`#${channel.name} set as event drop channel`);
});

client.on('message', (message)=>{
	if (!message.guild || message.author.bot){
		return;
	}
	const cmd = message.content.split(' ', 1)[0];

	if (cmd in cmds) {
		cmds[cmd](message);
	}

	if (message.guild.id === config.server){
		messageChance(message);
	}
});

client.on('messageReactionAdd', (reaction, user) => {
	if (!reaction.message.guild || user.bot){
		return;
	}
	if (reaction.message.guild.id === config.server){
		claimEvent(reaction, user);
	}
});

client.on('error', (error) => {
	console.error(error);
});

client.login(config.token);

const charityInterval = setInterval(()=>{
	sendEvent();
}, config.charity * 60 * 1000);

function messageChance(message){
	const num = Math.random() * 100;

	if (message.channel.id === 341725276679438339 && num <= 5){
		charityInterval.refresh();
		sendEvent(message);
	}

	if (num <= config.chance){
		charityInterval.refresh();
		sendEvent(message);
	}
}

function sendEvent(message){
	channel.send(`A Vampire has appeared in #${message.channel.name}. React to kill it!`).then((sentMessage)=>{
		db.run('INSERT INTO `messages` (id, claimed) VALUES (?,0);', [sentMessage.id], function(err){
			if(err && err.message === 'SQLITE_CONSTRAINT: UNIQUE constraint failed: messages.id'){
				return;
			} else if (err){
				console.log(err);
			}
		});	
		sentMessage.react('⚔️');
	});
}

function claimEvent(reaction, user){
	const {count, emoji, message} = reaction;

	if (emoji.name !== '⚔️' || count > 2){
		return;
	}

	db.get('SELECT * FROM `messages` WHERE id = ?;', [message.id], function(err,row){
		if(err){
			console.error(err);
		}
		if(!row || row.claimed === 1){
			return;
		}

		db.run('UPDATE `messages` SET claimed = 1 WHERE id = ?;', [message.id], function(err){
			if(err){
				console.error(err);
			}
		});

		dbInsert(message, user);

	});

	
}

function dbInsert(message, user){
	db.run('INSERT INTO `points` (messageid, userid, points) VALUES (?,?,1);',[message.id, user.id], function(err){
		if(err && err.message === 'SQLITE_CONSTRAINT: UNIQUE constraint failed: points.messageid'){
			return;
		} else if (err){
			console.log(err);
		}
	});
}