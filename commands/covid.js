const jsonQuery = require('json-query');

module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		if(msg.command_text.startsWith('covid ')) {
			var msgArr = msg.command_text.substring(6).split(' ');
			const action = msgArr.shift().toLowerCase();

			if(action === 'get') {
				logger.log('notice', 'User %s Used Covid Command(Get %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msgArr[0], msg.chat.title, msg.chat.id);
				let data = await utils.database.query('SELECT data, time FROM covid ORDER BY `index` DESC LIMIT 1;');
				if(data) {
					data.data = JSON.parse(data.data);
					const { value } = jsonQuery(`[name=${msgArr[0]}]`, { data: data.data });
					let toSendArr = [];
					toSendArr.push(`<b>COVID-19 Information of ${msgArr[0]}</b>`);
					toSendArr.push('');
					toSendArr.push(`<b>Count</b>: ${value.count}`);
					toSendArr.push(`<b>Death</b>: ${value.death}`);
					toSendArr.push(`<b>Active</b>: ${value.active}`);
					toSendArr.push(`<b>Release</b>: ${value.release}`);
					toSendArr.push(`<b>Updated (UTC)</b>: ${data.time}`);
					telegram.bot.sendMessage(msg.chat.id, toSendArr.join('\n'), { reply_to_message_id: msg.message_id, parse_mode: 'HTML' });
				} else {
					telegram.bot.sendMessage(msg.chat.id, `No data of ${msgArr[0]}. Please check supported area list by 'covid list'.`, { reply_to_message_id: msg.message_id });
				}
			}
			if(action === 'list') {
				logger.log('notice', 'User %s Used Covid Command(List) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
				const list = await utils.database.query('SELECT names FROM covid ORDER BY `index` DESC LIMIT 1;');
				console.log(list);
				telegram.bot.sendMessage(msg.chat.id, `Countries & Ship List: ${JSON.parse(list).join(', ')}`, { reply_to_message_id: msg.message_id });
			}
		}
	});
}