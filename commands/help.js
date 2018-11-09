const msgObj = {
	'//Search word': 'Search on the Web',
	'=Expression': 'Calculate Expression',
	'source': 'Find image source',
	'vote [create name, selection1, selection2...|view id|result id|aresult id|open id|close id|delete id]': 'Vote Command',
	'info': 'Get messsge info',
	'school [breakfast|lunch|dinner|snack] City SchoolName': 'Get school food menu',
	'help': 'Display this message',
	'Support Chat (ko-KR)': '@CocoaCafe'
};

module.exports = (bot, logger) => {
	bot.on('message', msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
		if(msgText.toLowerCase() === 'help' || msgText === '/start') {
			logger.log('notice', 'User %s Used Help Command in %s(%s)', `${username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
			const keys = Object.keys(msgObj);
			var msgArr = [];
			for(var i = 0; i < keys.length; i++) {
				msgArr.push(`<b>${keys[i]}</b> - ${msgObj[keys[i]]}`);
			}
			bot.sendMessage(msg.chat.id, msgArr.join('\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
		}
	});
}