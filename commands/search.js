const google = require('google');
google.resultsPerPage = 20;

module.exports = (bot, logger) => {
	bot.on('message', msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;

		if(msgText.startsWith('//')) {
			logger.log('notice', 'User %s Used Search Command(Search %s) in %s(%s)', `${username}(${msg.from.id})`, msgText.substring(2), msg.chat.title, msg.chat.id);
			google(msgText.substring(2), function(err, res) {
				if(err) logger.log('error', err);
				var toSendMsgs = [];
				for(var i = 0; i < res.links.length; i++) {
					if(toSendMsgs.length >= 3) break;
					var link = res.links[i];
					// Change below description to href to show webpage results, that like youtube.
					if(link.description) toSendMsgs.push(`<a href="${link.href}">${link.title}</a>\n${link.description.replace('<', '&lt;').replace('>', '&gt;')}`);
				}
				return bot.sendMessage(msg.chat.id, toSendMsgs.join('\n\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
			});
		}
	});
}