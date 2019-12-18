const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.db');

db.serialize(function(){
	// Create Starboard table
	db.run('CREATE TABLE IF NOT EXISTS `leaderboard` (`userid` TEXT, userstring TEXT, `nickname` TEXT, `points` INTEGER, PRIMARY KEY(`userid`))', (err) => {
		if(err){
			console.error(err);
		}
	});

	console.log('[Database] Ready!');
	db.close();

});