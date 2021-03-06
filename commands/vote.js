const jsonQuery = require('json-query');

module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'vote');

		if(msg.command_text.toLowerCase().startsWith('vote ')) {
			var msgArr = msg.command_text.substring(5).split(' ');
			const action = msgArr.shift().toLowerCase();
			msgArr = msgArr.join(' ').split(',');
			for(let i = 0; i < msgArr.length; i++) msgArr[i] = msgArr[i].trim();

			if(action === 'create') {
				logger.log('notice', 'User %s Used Vote Command(Create %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msgArr.join(', '), msg.chat.title, msg.chat.id);
				const name = msgArr.shift();
				if(![ 'public', 'anonymous', 'counter' ].includes(type = msgArr.shift().toLowerCase())) {
					return telegram.bot.sendMessage(msg.chat.id, getLanguage('wrongType', type), { reply_to_message_id: msg.message_id });
				}
				const res = await utils.database.query('INSERT INTO vote(date, groupId, userId, username, name, data) VALUES(?, ?, ?, ?, ?, ?);', [
					Date.now(), msg.chat.id, msg.from.id, msg.from.parsed_username, name, JSON.stringify({
						type: type,
						selections: msgArr
					})
				]);
				return telegram.bot.sendMessage(msg.chat.id, getLanguage('created', name, res.insertId), { reply_to_message_id: msg.message_id });
			}

			if(action === 'view') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(View %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT * FROM vote WHERE id=?;', id), votingData = await utils.database.query('SELECT v1.username, v1.value FROM voting v1 WHERE date = (SELECT MAX(date) FROM voting v2 WHERE v1.userId = v2.userId ORDER BY v2.id LIMIT 1) AND v1.voteId = ?;', id);
				if(voteData.deleted) return telegram.bot.sendMessage(msg.chat.id, getLanguage('wasDeleted'), { reply_to_message_id: msg.message_id });
				voteData.data = JSON.parse(voteData.data);
				let selections = [], inlineBtnArr = [];
				for(let i = 0; i < voteData.data.selections.length; i++) {
					let q = jsonQuery(`[**][*value=${i}].username`, { data: { data: votingData }}).value;
					selections.push(`<b>${voteData.data.selections[i]}</b>: ${q.length}${q.length && voteData.data.type === 'public' ? `(${q.join(', ')})` : ''}`);
					inlineBtnArr.push( [ {
						text: voteData.data.selections[i],
						callback_data: JSON.stringify({
							action: 'VoteVoting',
							vote: id,
							value: i
						})
					} ] );
				}
				return telegram.bot.sendMessage(msg.chat.id, `<b>${voteData.name}</b>${(voteData.data.type === 'public' || voteData.data.type === 'counter') ? '\n\n' + selections.join('\n') : ''}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: inlineBtnArr }});
			}

			if(action === 'open') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Open %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id);
				if(parseInt(voteData.groupId) !== msg.chat.id) return telegram.bot.sendMessage(msg.chat.id, getLanguage('notThisChat'), { reply_to_message_id: msg.message_id });
				if(voteData.deleted) return telegram.bot.sendMessage(msg.chat.id, getLanguage('wasDeleted'), { reply_to_message_id: msg.message_id });
				if(!voteData.closed) return telegram.bot.sendMessage(msg.chat.id, getLanguage('alreadyOpened'), { reply_to_message_id: msg.message_id });
				utils.database.query('UPDATE vote SET closed=0 WHERE id=?;', id).then(() => {
					return telegram.bot.sendMessage(msg.chat.id, getLanguage('opened', voteData.name, id), { reply_to_message_id: msg.message_id });
				});
			}

			if(action === 'close') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Close %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id);
				if(parseInt(voteData.groupId) !== msg.chat.id) return telegram.bot.sendMessage(msg.chat.id, getLanguage('notThisChat'), { reply_to_message_id: msg.message_id });
				if(voteData.deleted) return telegram.bot.sendMessage(msg.chat.id, getLanguage('wasDeleted'), { reply_to_message_id: msg.message_id });
				if(voteData.closed) return telegram.bot.sendMessage(msg.chat.id, getLanguage('alreadyClosed'), { reply_to_message_id: msg.message_id });
				utils.database.query('UPDATE vote SET closed=1 WHERE id=?;', id).then(() => {
					return telegram.bot.sendMessage(msg.chat.id, getLanguage('closed', voteData.name, id), { reply_to_message_id: msg.message_id });
				});
			}

			if(action === 'result') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Result %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT groupId, name, data, closed, deleted FROM vote WHERE id=?;', id), votingData = await utils.database.query('SELECT v1.username, v1.value FROM voting v1 WHERE date = (SELECT MAX(date) FROM voting v2 WHERE v1.userId = v2.userId ORDER BY v2.id LIMIT 1) AND v1.voteId = ?;', id);
				if(parseInt(voteData.groupId) !== msg.chat.id) return telegram.bot.sendMessage(msg.chat.id, getLanguage('notThisChat'), { reply_to_message_id: msg.message_id });
				if(voteData.deleted) return telegram.bot.sendMessage(msg.chat.id, getLanguage('deleted'), { reply_to_message_id: msg.message_id });
				voteData.data = JSON.parse(voteData.data);
				let selections = [];
				for(let i = 0; i < voteData.data.selections.length; i++) {
					let q = jsonQuery(`[**][*value=${i}].username`, { data: { data: votingData }}).value;
					selections.push(`<b>${voteData.data.selections[i]}</b>: ${q.length}${q.length && voteData.data.type === 'public' ? `(${q.join(', ')})` : ''}`);
				}
				return telegram.bot.sendMessage(msg.chat.id, `<b>${voteData.name}</b>\n\n${selections.join('\n')}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
			}

			if(action === 'aresult') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(AResult %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT groupId, name, data, closed, deleted FROM vote WHERE id=?;', id), votingData = await utils.database.query('SELECT v1.username, v1.value FROM voting v1 WHERE date = (SELECT MAX(date) FROM voting v2 WHERE v1.userId = v2.userId ORDER BY v2.id LIMIT 1) AND v1.voteId = ?;', id);
				if(parseInt(voteData.groupId) !== msg.chat.id) return telegram.bot.sendMessage(msg.chat.id, getLanguage('notThisChat'), { reply_to_message_id: msg.message_id });
				if(voteData.deleted) return telegram.bot.sendMessage(msg.chat.id, getLanguage('wasDeleted'), { reply_to_message_id: msg.message_id });
				voteData.data = JSON.parse(voteData.data);
				let selections = [];
				for(let i = 0; i < voteData.data.selections.length; i++) {
					let q = jsonQuery(`[**][*value=${i}].username`, { data: { data: votingData }}).value;
					selections.push(`<b>${voteData.data.selections[i]}</b>: ${q.length}${q.length ? `(${q.join(', ')})` : ''}`);
				}
				return telegram.bot.sendMessage(msg.chat.id, `<b>${voteData.name}</b>\n\n${selections.join('\n')}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
			}

			if(action === 'delete') {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Delete %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id);
				if(parseInt(voteData.groupId) !== msg.chat.id) return telegram.bot.sendMessage(msg.chat.id, getLanguage('notThisChat'), { reply_to_message_id: msg.message_id });
				if(voteData.deleted) return telegram.bot.sendMessage(msg.chat.id, getLanguage('wasDeleted'), { reply_to_message_id: msg.message_id });
				if(!voteData.closed) return telegram.bot.sendMessage(msg.chat.id, getLanguage('notClosed'), { reply_to_message_id: msg.message_id });
				utils.database.query('UPDATE vote SET deleted=1 WHERE id=?;', id).then(() => {
					return telegram.bot.sendMessage(msg.chat.id, getLanguage('deleted', voteData.name, id), { reply_to_message_id: msg.message_id });
				});
			}
		}
	});
}
