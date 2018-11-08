module.exports = function(bot, logger, database) {
	require('fs').readdirSync(__dirname).forEach(function(file) {
		file == 'index.js' || require(`${__dirname}/${file}`)(bot, logger, database);
	});
}
