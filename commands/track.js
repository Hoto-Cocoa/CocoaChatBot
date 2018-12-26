const jsonQuery = require('json-query');
const tracker = new (require('../modules/SweetTracker'))(require('../config').Track.Token);

module.exports = (bot, logger, utils) => {
	bot.on('message', async msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'track');

		if(msgText.toLowerCase().startsWith('track ')) {
			var msgArr = msgText.substring(6).split(' ');
			const action = msgArr.shift().toLowerCase();

			if(action === 'list') {
				logger.log('notice', 'User %s Used Track Command(List Courier List) in %s(%s)', `${username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
				return bot.sendMessage(msg.chat.id, getLanguage('list', tracker.getCourierList().join(', ')), { reply_to_message_id: msg.message_id });
			}

			if(action === 'view') {
				logger.log('notice', 'User %s Used Track Command(View %s) in %s(%s)', `${username}(${msg.from.id})`, msgArr.join(', '), msg.chat.title, msg.chat.id);
				const result = await tracker.getTrackingInfo(msgArr[0], msgArr[1]);
				if(result.code) return bot.sendMessage(msg.chat.id, getLanguage(`error${result.code}`, code, msg), { reply_to_message_id: msg.message_id });
				const latestTrackingData = result.trackingDetails[result.trackingDetails.length - 1];
				var toSendArr = [];
				toSendArr.push(`<b>${getLanguage('latestTrackingInfo')}</b>`);
				toSendArr.push(`<b>${getLanguage('time')}</b>: ${latestTrackingData.time}`);
				toSendArr.push(`<b>${getLanguage('where')}</b>: ${latestTrackingData.where}`);
				toSendArr.push(`<b>${getLanguage('kind')}</b>: ${latestTrackingData.kind}`);
				return bot.sendMessage(msg.chat.id, toSendArr.join('\n'), { reply_to_message_id: msg.message_id, parse_mode: 'HTML' });
			}
		}
	});
}