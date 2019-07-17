module.exports = {
	alias: 'info',
	function: async (msg, logger, utils) => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'info');

		logger.log('notice', 'User %s Used Info Command(Get %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.reply_to_message ? msg.reply_to_message.message_id : msg.message_id, msg.chat.title, msg.chat.id);
		const msgData = msg.reply_to_message ? msg.reply_to_message : msg;
		var toSendArr = [];
		toSendArr.push(`<b>${getLanguage('messageId')}</b>: ${msgData.message_id}`);
		toSendArr.push(`<b>${getLanguage('date')}</b>: ${msgData.date}`);``
		toSendArr.push('');
		toSendArr.push(`<b>${getLanguage('userId')}</b>: ${msgData.from.id}`);
		toSendArr.push(`<b>${getLanguage('userIsBot')}</b>: ${msgData.from.is_bot}`);
		toSendArr.push(`<b>${getLanguage('userFirstName')}</b>: ${msgData.from.first_name}`);
		if(msgData.from.last_name) toSendArr.push(`<b>${getLanguage('userLastName')}</b>: ${msgData.from.last_name}`);
		if(msgData.from.username) toSendArr.push(`<b>${getLanguage('userUsername')}</b>: ${msgData.from.username}`);
		if(msgData.from.language_code) toSendArr.push(`<b>${getLanguage('userLanguageCode')}</b>: ${msgData.from.language_code}`);
		toSendArr.push('');
		toSendArr.push(`<b>${getLanguage('chatId')}</b>: ${msgData.chat.id}`);
		if(msgData.chat.title) toSendArr.push(`<b>${getLanguage('chatTitle')}</b>: ${msgData.chat.title}`);
		toSendArr.push(`<b>${getLanguage('chatType')}</b>: ${msgData.chat.type}`);
		toSendArr.push('');
		toSendArr.push(`<b>${getLanguage('debug')}</b>: ${JSON.stringify(msgData)}`);
		return { message: toSendArr.join('\n'), options: { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }};
	}
}
