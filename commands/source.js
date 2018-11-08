const Sauce = require('sagiri');
const sauce = new Sauce(require('../config').SauceNAO.Token);
const tmpDir = require('os').tmpdir();

module.exports = (bot, logger) => {
	bot.on('message', msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;

		if(msgText.toLowerCase() === 'source') {
			logger.log('notice', 'User %s Used Source Command in %s(%s)', `${username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
			if(!msg.photo && !msg.reply_to_message.photo) {
				return bot.sendMessage(msg.chat.id, 'No photo detected!', { reply_to_message_id: msg.message_id });
			}

			const photoObj = msg.photo ? msg.photo : msg.reply_to_message.photo, photo = photoObj[photoObj.length - 1];
			bot.downloadFile(photo.file_id, tmpDir).then(filePath => {
				sauce.getSauce(filePath).then(sauceInfo => {
					var sauceData = sauceInfo[0], sauceUrl = sauceData.original.data.pawoo_id ? `${sauceData.url}/${sauceData.original.data.pawoo_id}` : sauceData.url, toSendMsgs = [];
					toSendMsgs.push(`<a href="${sauceUrl}">View on ${sauceData.site}</a>`);
					toSendMsgs.push(`Similarity: ${sauceData.similarity}`);
					return bot.sendMessage(msg.chat.id, toSendMsgs.join('\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
				});
			});
		}
	});
}