const schoolMeal = require('../modules/SchoolMeal');

module.exports = (bot, logger) => {
	bot.on('message', msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;

		if(msgText.startsWith('school ')) {
			const msgArr = msgText.substring(7, msgText.length).split(' ');
			logger.log('notice', 'User %s Used School Command(Get %s of %s %s) in %s(%s)', `${username}(${msg.from.id})`, msgArr[0], msgArr[1], msgArr[2], msg.chat.title, msg.chat.id);
			schoolMeal.find(msgArr[1], msgArr[2], (err, emsg, res) => {
				if(err) return (logger.log('error', err) && bot.sendMessage(msg.chat.id, 'Error!', { reply_to_message_id: msg.message_id }));
				if(emsg) return bot.sendMessage(msg.chat.id, emsg, { reply_to_message_id: msg.message_id });
				if(res.length > 1) {
					var inlineBtnArr = [];
					for(var i = 0; i < res.length; i++) {
						inlineBtnArr.push([{
							text: res[i].name,
							callback_data: JSON.stringify({
								action: 'SchoolChoice',
								code: res[i].code,
								type: msgArr[0]
							})
						}]);
					}
					return bot.sendMessage(msg.chat.id, 'Choice your school.', { reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: inlineBtnArr }});
				}
				schoolMeal.get(msgArr[0], res[0].code, (err, res) => {
					if(err) return (logger.log('error', err) && bot.sendMessage(msg.chat.id, 'Error!', { reply_to_message_id: msg.message_id }));
					return bot.sendMessage(msg.chat.id, res, { reply_to_message_id: msg.message_id });
				});
			});
		}
	});
}
