module.exports = (bot, logger, utils) => {
	bot.on('message', async msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
		const getLanguage = await utils.getLanguage(msg.from.language_code, msg.from.id, 'info');

		if(msgText.toLowerCase() === 'info') {
			logger.log('notice', 'User %s Used Info Command(Get %s) in %s(%s)', `${username}(${msg.from.id})`, msg.reply_to_message ? msg.reply_to_message.message_id : msg.message_id, msg.chat.title, msg.chat.id);
			const msgData = msg.reply_to_message ? msg.reply_to_message : msg;
			var toSendArr = [];
			toSendArr.push(`<b>${getLanguage('messageId')}</b>: ${msgData.message_id}`);
			toSendArr.push(`<b>${getLanguage('date')}</b>: ${msgData.date}`);``
			toSendArr.push();
			toSendArr.push(`<b>${getLanguage('userId')}</b>: ${msgData.from.id}`);
			toSendArr.push(`<b>${getLanguage('userIsBot')}</b>: ${msgData.from.is_bot}`);
			toSendArr.push(`<b>${getLanguage('userFirstName')}</b>: ${msgData.from.first_name}`);
			if(msgData.from.last_name) toSendArr.push(`<b>${getLanguage('userLastName')}</b>: ${msgData.from.last_name}`);
			if(msgData.from.username) toSendArr.push(`<b>${getLanguage('userUsername')}</b>: ${msgData.from.username}`);
			if(msgData.from.language_code) toSendArr.push(`<b>${getLanguage('userLanguageCode')}</b>: ${msgData.from.language_code}`);
			toSendArr.push();
			toSendArr.push(`<b>${getLanguage('chatId')}</b>: ${msgData.chat.id}`);
			if(msgData.chat.title) toSendArr.push(`<b>${getLanguage('chatTitle')}</b>: ${msgData.chat.title}`);
			toSendArr.push(`<b>${getLanguage('chatType')}</b>: ${msgData.chat.type}`);
			toSendArr.push();
			toSendArr.push(`<b>${getLanguage('debug')}</b>: ${JSON.stringify(msgData)}`);
			return bot.sendMessage(msg.chat.id, toSendArr.join('\n'), { reply_to_message_id: msg.message_id, parse_mode: 'HTML' });
		}
	});
}
