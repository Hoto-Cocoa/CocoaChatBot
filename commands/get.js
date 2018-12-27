const util = require('util');

module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'get');

		if(msg.text.startsWith('get ')) {
			const id = parseInt(msg.text.substring(4));
			const readableId = msg.from.language_code && msg.from.language_code.substring(0, 2) === 'en' ? id + (id === 1 ? 'st' : id === 2 ? 'nd' : id === 3 ? 'rd' : 'th') : id;
			logger.log('notice', 'User %s Used Get Command(Get %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.text.substring(4), msg.chat.title, msg.chat.id);
			if(!id) return telegram.bot.sendMessage(msg.chat.id, getLanguage('wrongNumber'), { reply_to_message_id: msg.message_id });
			return telegram.bot.sendMessage(msg.chat.id, getLanguage('result', readableId), { reply_to_message_id: id }).catch(() => {
				return telegram.bot.sendMessage(msg.chat.id, getLanguage('noResult', readableId), { reply_to_message_id: msg.message_id });
			})
		}
	});
}