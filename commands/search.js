module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'search');
		if(msg.command_text.startsWith('//')) {
			logger.log('notice', 'User %s Used Search Command(Search %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.command_text.substring(2), msg.chat.title, msg.chat.id);
			var toSendMsgs = [];
			const result = await new (require('../modules/GoogleSearch'))(20).getResult(msg.command_text.substring(2));
			for(var i = 0; i < result.length; i++) {
				if(toSendMsgs.length >= 3) break;
				if(result[i].description && result[i].href) toSendMsgs.push(`<a href="${result[i].href}">${result[i].title.replace('<', '&lt;').replace('>', '&gt;')}</a>\n${result[i].description.replace('<', '&lt;').replace('>', '&gt;').replace('\n', ' ')}`);
			}
			return telegram.bot.sendMessage(msg.chat.id, toSendMsgs.join('\n\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id }).catch(() => {
				return telegram.bot.sendMessage(msg.chat.id, getLanguage('noResult'), { reply_to_message_id: msg.message_id });
			});
		}
	});
}
