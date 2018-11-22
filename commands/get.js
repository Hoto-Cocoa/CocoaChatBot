module.exports = (bot, logger) => {
	bot.on('message', msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;

		if(msgText.startsWith('get')) {
			const id = parseInt(msgText.substring(4));
			const readableId = id + (id === 1 ? 'st' : id === 2 ? 'nd' : 'rd');
			logger.log('notice', 'User %s Used Get Command(Get %s) in %s(%s)', `${username}(${msg.from.id})`, msgText.substring(4), msg.chat.title, msg.chat.id);
			if(!id) return bot.sendMessage(msg.chat.id, 'Wrong number!', { reply_to_message_id: msg.message_id });
			try { return bot.sendMessage(msg.chat.id, `Here ${readableId} message!`, { reply_to_message_id: id }); } catch(e) { return bot.sendMessage(msg.chat.id, `Cannot find ${readableId} message!`, { reply_to_message_id: msg.message_id }); }
		}
	});
}