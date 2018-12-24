module.exports = (bot, logger, utils) => {
	bot.on('message', async msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
		var getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'setting');

		if(msgText.startsWith('setting ')) {
			const msgArr = msgText.substring(8).split(' ');
			logger.log('notice', 'User %s Used Setting Command(Set "%s" to %s) in %s(%s)', `${username}(${msg.from.id})`, msgArr[0], msgArr[1], msg.chat.title, msg.chat.id);
			utils.database.query('SELECT id FROM setting WHERE userId=? AND `key`=? ORDER BY id DESC LIMIT 1', [ msg.from.id, msgArr[0] ]).then(id => {
				if(id) utils.database.query('UPDATE setting SET active=0 WHERE id=?', id);
				utils.database.query('INSERT INTO setting(date, userId, `key`, value) VALUES(?, ?, ?, ?);', [
					Date.now(), msg.from.id, msgArr[0], msgArr[1]
				]).then(async () => {
					getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'setting');
					bot.sendMessage(msg.chat.id, getLanguage('done'), { reply_to_message_id: msg.message_id });
				});
			});
		}
	});
}