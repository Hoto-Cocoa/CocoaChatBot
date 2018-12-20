module.exports = (bot, logger) => {
	bot.on('message', msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;

		if(msgText.toLowerCase() === 'info') {
			logger.log('notice', 'User %s Used Info Command(Get %s) in %s(%s)', `${username}(${msg.from.id})`, msg.reply_to_message ? msg.reply_to_message.message_id : msg.message_id, msg.chat.title, msg.chat.id);
			return bot.sendMessage(msg.chat.id, JSON.stringify(msg.reply_to_message ? msg.reply_to_message : msg), { reply_to_message_id: msg.message_id });
		}
	});
}