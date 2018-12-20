const util = require('util');

module.exports = (bot, logger, utils) => {
	bot.on('message', msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
		const language = utils.getLanguage(msg.from.language_code).get;

		if(msgText.startsWith('get ')) {
			const id = parseInt(msgText.substring(4));
			const readableId = msg.from.language_code && msg.from.language_code.substring(0, 2) === 'en' ? id + (id === 1 ? 'st' : id === 2 ? 'nd' : id === 3 ? 'rd' : 'th') : id;
			logger.log('notice', 'User %s Used Get Command(Get %s) in %s(%s)', `${username}(${msg.from.id})`, msgText.substring(4), msg.chat.title, msg.chat.id);
			if(!id) return bot.sendMessage(msg.chat.id, language.wrongNumber, { reply_to_message_id: msg.message_id });
			return bot.sendMessage(msg.chat.id, util.format(language.result, readableId), { reply_to_message_id: id }).catch(() => {
				return bot.sendMessage(msg.chat.id, util.format(language.noResult, readableId), { reply_to_message_id: msg.message_id });
			})
		}
	});
}