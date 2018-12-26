const schoolMeal = new (require('../modules/SchoolMeal'))();

module.exports = (bot, logger, utils) => {
	bot.on('message', async msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'school');

		if(msgText.startsWith('school ')) {
			const msgArr = msgText.substring(7).split(' ');
			logger.log('notice', 'User %s Used School Command(Get %s of %s %s) in %s(%s)', `${username}(${msg.from.id})`, msgArr[0], msgArr[1], msgArr[2], msg.chat.title, msg.chat.id);
			const schools = await schoolMeal.findSchool(msgArr[1], msgArr[2]).catch(e => {
				switch(e) {
					case 'SHORT_NAME': bot.sendMessage(msg.chat.id, getLanguage('tooShortName'), { reply_to_message_id: msg.message_id }); break;
					case 'SSL_CERTIFICATE_ERROR': bot.sendMessage(msg.chat.id, getLanguage('sslError'), { reply_to_message_id: msg.message_id }); break;
					case 'NO_SUCH_DEPARTMENT': bot.sendMessage(msg.chat.id, getLanguage('noSuchDepartment', getLanguage('departments')), { reply_to_message_id: msg.message_id }); break;
					case 'NO_SUCH_SCHOOL': bot.sendMessage(msg.chat.id, getLanguage('noSuchSchool'), { reply_to_message_id: msg.message_id }); break;
					default: logger.log('error', e) && bot.sendMessage(msg.chat.id, getLanguage('error'), { reply_to_message_id: msg.message_id });
				}
			});
			if(schools) {
				if(schools.length > 1) {
					var inlineBtnArr = [];
					for(var i = 0; i < schools.length && i < 10; i++) {
						inlineBtnArr.push( [ {
							text: schools[i].name,
							callback_data: JSON.stringify({
								action: 'SchoolChoice',
								code: schools[i].code,
								type: msgArr[0]
							})
						} ] );
					}
					return bot.sendMessage(msg.chat.id, (schools.length > 10) ? [ getLanguage('choice'), getLanguage('tooManyResults', schools.length) ].join('\n') : getLanguage('choice'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: inlineBtnArr }});
				}
				const school = schools[0];
				const meal = await schoolMeal.getMeal(msgArr[0], school.code).catch(e => {
					switch(e) {
						case 'NOT_SUPPORTED': bot.sendMessage(msg.chat.id, `Not supported school! (Type: ${school.code.substring(0, 1)})`, { reply_to_message_id: msg.message_id }); break;
						case 'NO_DATA': bot.sendMessage(msg.chat.id, 'No data!', { reply_to_message_id: msg.message_id }); break;
						default: logger.log('error', e) && bot.sendMessage(msg.chat.id, 'ERROR!', { reply_to_message_id: msg.message_id });
					}
				});
				if(meal) return bot.sendMessage(msg.chat.id, `<b>${school.name}</b>: ${meal}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
			}
		}
	});
}
