module.exports = function(telegram, logger, utils) {
	require('fs').readdirSync(__dirname).forEach(function(file) {
		file === 'index.js' || require(`${__dirname}/${file}`)(telegram, logger, utils);
	});
}
