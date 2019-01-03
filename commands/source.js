const Sauce = require('sagiri');
const sauce = new Sauce(require('../config').SauceNAO.Token);
const tmpDir = require('os').tmpdir();

module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'source');

		if(msg.command_text.toLowerCase() === 'source') {
			logger.log('notice', 'User %s Used Source Command in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
			if(!msg.photo && (!msg.reply_to_message || !msg.reply_to_message.photo)) {
				return telegram.bot.sendMessage(msg.chat.id, getLanguage('noPhoto'), { reply_to_message_id: msg.message_id });
			}

			const photoObj = msg.photo ? msg.photo : msg.reply_to_message.photo, photo = photoObj[photoObj.length - 1];
			telegram.bot.downloadFile(photo.file_id, tmpDir).then(filePath => {
				sauce.getSauce(filePath).then(sauceInfo => {
					var sauceData = sauceInfo[0], sauceUrl = sauceData.original.data.pawoo_id ? `${sauceData.url}/${sauceData.original.data.pawoo_id}` : sauceData.url, toSendMsgs = [];
					toSendMsgs.push(`<a href="${sauceUrl}">${getLanguage('viewOn', sauceData.site)}</a>`);
					toSendMsgs.push(`${getLanguage('similarity')}: ${sauceData.similarity}`);
					return telegram.bot.sendMessage(msg.chat.id, toSendMsgs.join('\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
				});
			});
		}
	});
}