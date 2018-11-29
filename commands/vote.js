
const jsonQuery = require('json-query');

module.exports = (bot, logger, database) => {
	bot.on('message', async msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;

		if(msgText.toLowerCase().startsWith('vote ')) {
			var msgArr = msgText.substring(5).split(' ');
			const action = msgArr.shift().toLowerCase();
			msgArr = msgArr.join(' ').split(',');
			for(var i = 0; i < msgArr.length; i++) msgArr[i] = msgArr[i].trim();

			if(action === 'create') {
				logger.log('notice', 'User %s Used Vote Command(Create %s) in %s(%s)', `${username}(${msg.from.id})`, msgArr.join(', '), msg.chat.title, msg.chat.id);
				const name = msgArr.shift();
				if(!['public', 'anonymous', 'counter'].includes(type = msgArr.shift().toLowerCase())) {
					return bot.sendMessage(msg.chat.id, `Wrong type! (${type})`, { reply_to_message_id: msg.message_id });
				}
				const res = await database.query('INSERT INTO vote(date, groupId, userId, username, name, data) VALUES(?, ?, ?, ?, ?, ?);', [
					Date.now(), msg.chat.id, msg.from.id, username, name, JSON.stringify({
						type: type,
						selections: msgArr
					})
				]);
				return bot.sendMessage(msg.chat.id, `Created vote "${name}"(#${res.insertId}).`, { reply_to_message_id: msg.message_id });
			}

			if(action === 'view') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(View %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await database.query('SELECT * FROM vote WHERE id=?;', id), votingData = await database.query('SELECT username, value FROM voting WHERE voteId=? AND active=1;', id);
				if(voteData[0].deleted) return bot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				voteData[0].data = JSON.parse(voteData[0].data);
				var selections = [], inlineBtnArr = [];
				for(var i = 0; i < voteData[0].data.selections.length; i++) {
					var q = jsonQuery(`[**][*value=${i}].username`, { data: { data: votingData }}).value;
					selections.push(`<b>${voteData[0].data.selections[i]}</b>: ${q.length}${q.length && voteData[0].data.type === 'public' ? `(${q.join(', ')})` : ''}`);
					inlineBtnArr.push([{
						text: voteData[0].data.selections[i],
						callback_data: JSON.stringify({
							action: 'VoteVoting',
							vote: id,
							value: i
						})
					}]);
				}
				return bot.sendMessage(msg.chat.id, `<b>${voteData[0].name}</b>${(voteData[0].data.type === 'public' || voteData[0].data.type === 'counter') ? '\n\n' + selections.join('\n') : ''}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: inlineBtnArr }});
			}

			if(action === 'open') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Open %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id);
				if(parseInt(voteData[0].groupId) !== msg.chat.id) return bot.sendMessage(msg.chat.id, 'This vote not created in this chat. Please execute this command in chat that this vote created.', { reply_to_message_id: msg.message_id });
				if(voteData[0].deleted) return bot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				if(!voteData[0].closed) return bot.sendMessage(msg.chat.id, 'This vote not closed.', { reply_to_message_id: msg.message_id });
				database.query('UPDATE vote SET closed=0 WHERE id=?;', id).then(() => {
					return bot.sendMessage(msg.chat.id, `Vote ${voteData[0].name}(#${id}) opened.`, { reply_to_message_id: msg.message_id });
				});
			}

			if(action === 'close') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Close %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id);
				if(parseInt(voteData[0].groupId) !== msg.chat.id) return bot.sendMessage(msg.chat.id, 'This vote not created in this chat. Please execute this command in chat that this vote created.', { reply_to_message_id: msg.message_id });
				if(voteData[0].deleted) return bot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				if(voteData[0].closed) return bot.sendMessage(msg.chat.id, 'This vote already closed.', { reply_to_message_id: msg.message_id });
				database.query('UPDATE vote SET closed=1 WHERE id=?;', id).then(() => {
					return bot.sendMessage(msg.chat.id, `Vote ${voteData[0].name}(#${id}) closed.`, { reply_to_message_id: msg.message_id });
				});
			}

			if(action === 'result') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Result %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await database.query('SELECT groupId, name, data, closed, deleted FROM vote WHERE id=?;', id), votingData = await database.query('SELECT username, value FROM voting WHERE voteId=? AND active=1;', id);
				if(parseInt(voteData[0].groupId) !== msg.chat.id) return bot.sendMessage(msg.chat.id, 'This vote not created in this chat. Please execute this command in chat that this vote created.', { reply_to_message_id: msg.message_id });
				if(voteData[0].deleted) return bot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				voteData[0].data = JSON.parse(voteData[0].data);
				var selections = [];
				for(var i = 0; i < voteData[0].data.selections.length; i++) {
					var q = jsonQuery(`[**][*value=${i}].username`, { data: { data: votingData }}).value;
					selections.push(`<b>${voteData[0].data.selections[i]}</b>: ${q.length}${q.length && voteData[0].data.type === 'public' ? `(${q.join(', ')})` : ''}`);
				}
				return bot.sendMessage(msg.chat.id, `<b>${voteData[0].name}</b>\n\n${selections.join('\n')}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
			}

			if(action === 'aresult') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(AResult %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await database.query('SELECT groupId, name, data, closed, deleted FROM vote WHERE id=?;', id), votingData = await database.query('SELECT username, value FROM voting WHERE voteId=? AND active=1;', id);
				if(parseInt(voteData[0].groupId) !== msg.chat.id) return bot.sendMessage(msg.chat.id, 'This vote not created in this chat. Please execute this command in chat that this vote created.', { reply_to_message_id: msg.message_id });
				if(voteData[0].deleted) return bot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				voteData[0].data = JSON.parse(voteData[0].data);
				var selections = [];
				for(var i = 0; i < voteData[0].data.selections.length; i++) {
					var q = jsonQuery(`[**][*value=${i}].username`, { data: { data: votingData }}).value;
					selections.push(`<b>${voteData[0].data.selections[i]}</b>: ${q.length}${q.length ? `(${q.join(', ')})` : ''}`);
				}
				return bot.sendMessage(msg.chat.id, `<b>${voteData[0].name}</b>\n\n${selections.join('\n')}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
			}

			if(action === 'delete') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Delete %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id);
				if(parseInt(voteData[0].groupId) !== msg.chat.id) return bot.sendMessage(msg.chat.id, 'This vote not created in this chat. Please execute this command in chat that this vote created.', { reply_to_message_id: msg.message_id });
				if(voteData[0].deleted) return bot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				if(voteData[0].closed) return bot.sendMessage(msg.chat.id, 'This vote already closed.', { reply_to_message_id: msg.message_id });
				database.query('UPDATE vote SET deleted=1 WHERE id=?;', id).then(() => {
					return bot.sendMessage(msg.chat.id, `Vote ${res[0].name}(#${id}) deleted.`, { reply_to_message_id: msg.message_id });
				});
			}
		}
	});
}
