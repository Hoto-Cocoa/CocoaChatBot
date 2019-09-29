module.exports = (telegram, logger) => {
	telegram.events.on('message', async msg => {
		if(msg.command_text.toLowerCase().startsWith('admin ')) {
			var msgArr = msg.command_text.substring(6).split(' ');
			const action = msgArr.shift().toLowerCase();

			if(action === 'exec') {
				if(msg.from.id !== require('../config').Telegram.Owner) return telegram.bot.sendMessage(msg.chat.id, 'https://www.youtube.com/watch?v=4B5BauNBH0A', { reply_to_message_id: msg.message_id });
				logger.log('notice', 'User %s Used Admin Command(Exec %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msgArr.join(' '), msg.chat.title, msg.chat.id);
				const result = await require('util').promisify(require('child_process').exec)(process.platform === 'win32' ? `bash -c "${msgArr.join(' ')}"` : msgArr.join(' '), { stdio: 'inherit' }).catch((e) => { return e; });
				if(result.stdout) return telegram.bot.sendMessage(msg.chat.id, result.stdout, { reply_to_message_id: msg.message_id });
				if(result.stderr) return telegram.bot.sendMessage(msg.chat.id, result.stderr, { reply_to_message_id: msg.message_id });
				return telegram.bot.sendMessage(msg.chat.id, 'No STDOUT/STDERR.', { reply_to_message_id: msg.message_id });
			}

			if(action === 'ip') {
				if(msg.from.id !== require('../config').Telegram.Owner) return telegram.bot.sendMessage(msg.chat.id, 'https://www.youtube.com/watch?v=4B5BauNBH0A', { reply_to_message_id: msg.message_id });
				logger.log('notice', 'User %s Used Admin Command(See IP) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
				const netInterfaceList = require('os').networkInterfaces();
				var toSendArr = [];
				Object.keys(netInterfaceList).forEach((interfaceName) => netInterfaceList[interfaceName].forEach((data) => toSendArr.push(`${interfaceName}: ${data.address}`)));
				return telegram.bot.sendMessage(msg.chat.id, toSendArr.join('\n'), { reply_to_message_id: msg.message_id });
			}

			if(action === 'eval') {
				if(msg.from.id !== require('../config').Telegram.Owner) return telegram.bot.sendMessage(msg.chat.id, 'https://www.youtube.com/watch?v=4B5BauNBH0A', { reply_to_message_id: msg.message_id });
				return telegram.bot.sendMessage(msg.chat.id, eval(msgArr.join(' ')), { reply_to_message_id: msg.message_id }); // eslint-disable-line no-eval
			}
		}
	});
}
