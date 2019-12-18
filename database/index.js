const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.db');

db.serialize(function(){
	db.run('CREATE TABLE IF NOT EXISTS `messages` (`id` TEXT, `claimed` INTEGER, PRIMARY KEY(`id`))', (err) => {
		if(err){
			console.error(err);
		}
	});
	db.run('CREATE TABLE IF NOT EXISTS `points` (`messageid` TEXT, `userid` TEXT, `points` INTEGER, PRIMARY KEY(`messageid`))', (err) => {
		if(err){
			console.error(err);
		}
	});

	console.log('[Database] Points DB Ready!');
	db.close();

});