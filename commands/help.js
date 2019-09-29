module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		const language = (await utils.language.getLanguageData(msg.from.language_code, msg.from.id)).help;

		if(msg.command_text.toLowerCase() === 'help' || msg.command_text === '/start') {
			logger.log('notice', 'User %s Used Help Command in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
			const keys = Object.keys(language);
			var msgArr = [];
			for(var i = 0; i < keys.length; i++) {
				msgArr.push(`<b>${language[keys[i]].title}</b> - ${language[keys[i]].value}`);
			}
			telegram.bot.sendMessage(msg.chat.id, msgArr.join('\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
		}
	});
}