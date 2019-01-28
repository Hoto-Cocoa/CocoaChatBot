module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		var getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'setting');

		if(msg.command_text.startsWith('setting ')) {
			const msgArr = msg.command_text.substring(8).split(' ');
			logger.log('notice', 'User %s Used Setting Command(Set "%s" to %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msgArr[0], msgArr[1], msg.chat.title, msg.chat.id);
			utils.database.query('INSERT INTO setting(date, userId, `key`, value) VALUES(?, ?, ?, ?);', [
				Date.now(), msg.from.id, msgArr[0], msgArr[1]
			]).then(async () => {
				getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'setting');
				telegram.bot.sendMessage(msg.chat.id, getLanguage('done'), { reply_to_message_id: msg.message_id });
			});
		}
	});
}