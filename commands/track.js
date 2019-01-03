const tracker = new (require('../modules/SweetTracker'))(require('../config').Track.Token);

module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'track');

		if(msg.command_text.toLowerCase().startsWith('track ')) {
			var msgArr = msg.command_text.substring(6).split(' ');
			const action = msgArr.shift().toLowerCase();

			if(action === 'list') {
				logger.log('notice', 'User %s Used Track Command(List Courier List) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
				return telegram.bot.sendMessage(msg.chat.id, getLanguage('list', tracker.getCourierList().join(', ')), { reply_to_message_id: msg.message_id });
			}

			if(action === 'view') {
				logger.log('notice', 'User %s Used Track Command(View %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msgArr.join(', '), msg.chat.title, msg.chat.id);
				const result = await tracker.getTrackingInfo(msgArr[0], msgArr[1]);
				if(result.status === false) return telegram.bot.sendMessage(msg.chat.id, (result.code === 404) ? getLanguage(`error${result.code}`, result.code, result.msg) : getLanguage(`error${result.code}`), { reply_to_message_id: msg.message_id });
				const latestTrackingData = result.trackingDetails[result.trackingDetails.length - 1];
				var toSendArr = [];
				toSendArr.push(`<b>${getLanguage('deliveryInfo')}</b>`);
				result.itemName && toSendArr.push(`<b>${getLanguage('itemName')}</b>: ${result.itemName}`);
				toSendArr.push(`<b>${getLanguage('deliveryStatus')}</b>: ${getLanguage(`status${result.level}`)}`);
				toSendArr.push('');
				toSendArr.push(`<b>${getLanguage('latestTrackingInfo')}</b>`);
				toSendArr.push(`<b>${getLanguage('time')}</b>: ${latestTrackingData.timeString}`);
				toSendArr.push(`<b>${getLanguage('where')}</b>: ${latestTrackingData.where}`);
				return telegram.bot.sendMessage(msg.chat.id, toSendArr.join('\n'), { reply_to_message_id: msg.message_id, parse_mode: 'HTML' });
			}
		}
	});
}