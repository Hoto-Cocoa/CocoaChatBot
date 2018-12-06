module.exports = function(bot, logger, utils) {
	require('fs').readdirSync(__dirname).forEach(function(file) {
		file === 'index.js' || require(`${__dirname}/${file}`)(bot, logger, utils);
	});
}
