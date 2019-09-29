const schoolMeal = new (require('../modules/SchoolMeal'))();

module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'school');

		if(msg.command_text.startsWith('school ')) {
			const msgArr = msg.command_text.substring(7).split(' ');
			logger.log('notice', 'User %s Used School Command(Get %s of %s %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msgArr[0], msgArr[1], msgArr[2], msg.chat.title, msg.chat.id);
			const schools = await schoolMeal.findSchool(msgArr[1], msgArr[2]).catch(e => {
				switch(e) {
					case 'SHORT_NAME': telegram.bot.sendMessage(msg.chat.id, getLanguage('tooShortName'), { reply_to_message_id: msg.message_id }); break;
					case 'SSL_CERTIFICATE_ERROR': telegram.bot.sendMessage(msg.chat.id, getLanguage('sslError'), { reply_to_message_id: msg.message_id }); break;
					case 'NO_SUCH_DEPARTMENT': telegram.bot.sendMessage(msg.chat.id, getLanguage('noSuchDepartment', getLanguage('departments')), { reply_to_message_id: msg.message_id }); break;
					case 'NO_SUCH_SCHOOL': telegram.bot.sendMessage(msg.chat.id, getLanguage('noSuchSchool'), { reply_to_message_id: msg.message_id }); break;
					default: logger.log('error', e) && telegram.bot.sendMessage(msg.chat.id, getLanguage('error'), { reply_to_message_id: msg.message_id });
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
					return telegram.bot.sendMessage(msg.chat.id, (schools.length > 10) ? [ getLanguage('choice'), getLanguage('tooManyResults', schools.length) ].join('\n') : getLanguage('choice'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: inlineBtnArr }});
				}
				const school = schools[0];
				const meal = await schoolMeal.getMeal(msgArr[0], school.code).catch(e => {
					switch(e) {
						case 'NOT_SUPPORTED': telegram.bot.sendMessage(msg.chat.id, `Not supported school! (Type: ${school.code.substring(0, 1)})`, { reply_to_message_id: msg.message_id }); break;
						case 'NO_DATA': telegram.bot.sendMessage(msg.chat.id, 'No data!', { reply_to_message_id: msg.message_id }); break;
						default: logger.log('error', e) && telegram.bot.sendMessage(msg.chat.id, 'ERROR!', { reply_to_message_id: msg.message_id });
					}
				});
				if(meal) return telegram.bot.sendMessage(msg.chat.id, `<b>${school.name}</b>: ${meal}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
			}
		}
	});
}
