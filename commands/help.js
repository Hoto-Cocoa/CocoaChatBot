module.exports = (bot, logger, utils) => {
	bot.on('message', async msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
		const language = (await utils.language.getLanguageData(msg.from.language_code, msg.from.id)).help;

		if(msgText.toLowerCase() === 'help' || msgText === '/start') {
			logger.log('notice', 'User %s Used Help Command in %s(%s)', `${username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
			const keys = Object.keys(language);
			var msgArr = [];
			for(var i = 0; i < keys.length; i++) {
				msgArr.push(`<b>${language[keys[i]].title}</b> - ${language[keys[i]].value}`);
			}
			bot.sendMessage(msg.chat.id, msgArr.join('\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
		}
	});
}