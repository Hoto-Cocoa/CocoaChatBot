const schoolMeal = new (require('../modules/SchoolMeal'))();

module.exports = (telegram, logger, utils) => {
	telegram.events.on('callback_query', async msg => {
		if(msg.data.action === 'SchoolChoice') {
			logger.log('notice', 'User %s Used School Choice Button(School %s, Type %s) in %s(%s)', `${name}(${msg.message.from.id})`, msg.data.code, msg.data.type, msg.message.chat.title, msg.message.chat.id);
			const meal = await schoolMeal.getMeal(msg.data.type, msg.data.code).catch(e => {
				switch(e) {
					case 'NOT_SUPPORTED': telegram.bot.editMessageText(`Not supported school! (Type: ${msg.data.code.substring(0, 1)})`, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id }); break;
					case 'NO_DATA': telegram.bot.editMessageText('No data!', { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id }); break;
					default: logger.log('error', e) && telegram.bot.editMessageText('ERROR!', { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id });
				}
			});
			if(meal) return telegram.bot.editMessageText(meal, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id });
		}
	});
}