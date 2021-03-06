const config = require('../config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.db');

const admincmds = {
	'!leaderboard': (message) => leaderboard(message),
	'!mypoints': (message) => myPoints(message),
	'!spawn': (message)=> forceSpawn(message)
};
const cmds = {
	'!leaderboard': (message) => leaderboard(message),
	'!mypoints': (message) => myPoints(message)
};

const recents = {};

let default_channel;
let log_channel;
let command_channel;

client.on('ready', () => {
	console.log('[Discord Bot] Ready!');
	// client.user.setActivity('you', {type: 'PLAYING'});

	default_channel = client.channels.find(ch => ch.id === config.default_channel);
	console.log(`#${default_channel.name} set as default drop channel`);
	log_channel = client.channels.find(ch => ch.id === config.log_channel);
	console.log(`#${log_channel.name} set as log channel`);
	command_channel = client.channels.find(ch => ch.id === config.command_channel);
	console.log(`#${command_channel.name} set as command channel`);

});

client.on('message', (message)=>{
	if (!message.guild || message.author.bot){
		return;
	}

	if (message.content.length <= 3){
		return;
	}

	const cmd = message.content.split(' ', 1)[0];

	if (message.guild.id === config.server){
		if (cmd in admincmds && config.admins.indexOf(message.author.id) > -1) {
			return admincmds[cmd](message);
		}
		if (cmd in cmds && message.channel.id === config.command_channel) {
			return cmds[cmd](message);
		}
		if (config.ignore_channels.includes(message.channel.id)){
			return;
		}
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
	// console.log(num);

	if (num <= config.chance){
		charityInterval.refresh();
		sendEvent(message);
	}
}

function sendEvent(message){
	let channel, chname;
	if (!message){
		chname = 'general, 15m timeout drop';
		channel = default_channel;
		console.log(`${getDate()}[Timeout Spawn]`);
	} else {
		chname = message.channel.name;
		channel = message.channel;
	}
	channel.send('A Vampire has appeared!. React to kill it!').then((sentMessage)=>{
		db.run('INSERT INTO `messages` (id, claimed) VALUES (?,0);', [sentMessage.id], function(err){
			if(err && err.message === 'SQLITE_CONSTRAINT: UNIQUE constraint failed: messages.id'){
				return;
			} else if (err){
				console.log(err);
			}
		});	
		sentMessage.react('⚔️');
		log_channel.send(`Spawned a vampire in #${chname}`);
		console.log(`${getDate()}[Spawn] Spawned a vampire in #${chname}`);
	});
}

function claimEvent(reaction, user){
	const {count, emoji, message} = reaction;

	if (recents[user.id] && Date.now() - recents[user.id] < config.claim_timeout * 1000){
		reaction.remove();
		return;
	}

	if (emoji.name !== '⚔️'/* || count > 2*/){
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
		message.delete();
		recents[user.id] = Date.now();
		log_channel.send(`${user.tag} (${user.id}) killed a vampire in #${message.channel.name}`);
		console.log(`${getDate()}[Claim] ${user.tag} (${user.id}) killed a vampire in #${message.channel.name}`);
	});
}

function leaderboard(message){
	const richEmbed = {
		color: 0xaa98ae,
		title: 'Vampires Killed',
		timestamp: Date.now()
	};

	db.all('SELECT userid, COUNT(points) as points from points GROUP BY userid ORDER BY points DESC;', function(err, rows){
		if (err){
			console.error(err);
		}

		const fields = [];

		rows.forEach((row)=>{
			const username = getUser(message, row.userid);
			fields.push({
				name: username,
				value: row.points,
				inline: false
			});
		});

		richEmbed.fields = fields;

		message.channel.send({embed: richEmbed});
	});
}

function myPoints(message){
	const richEmbed = {
		color: 0xaa98ae,
		title: 'Vampires Killed',
		timestamp: Date.now()
	};

	db.get('SELECT userid, COUNT(points) as points from points WHERE userid = ?;',[message.author.id], function(err, row){
		if (err){
			console.error(err);
		}

		const username = getUser(message, row.userid);

		richEmbed.fields = [{
			name: username,
			value: row.points,
			inline: false
		}];

		message.channel.send({embed: richEmbed});
	});
}

function getUser(message, userid){
	const user = message.guild.members.get(userid);
	let username;
	if (user){
		username = `${user.displayName}`;
	} else {
		username = 'User Left Server';
	}
	
	return username;
}

function forceSpawn(message){
	sendEvent(message);
	console.log(`${getDate()}[Forced Spawn] ${message.author.tag} forced a spawn in #${message.channel.name}`);
	message.delete();
}

function getDate(){
	return (new Date()).toISOString() + ' :: ';
}