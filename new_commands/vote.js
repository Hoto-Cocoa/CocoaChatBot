const jsonQuery = require('json-query');

module.exports = {
	title: 'Vote Command',
	description: 'The command for manage votes.',
	subcommands: {
		create: 'Create a vote. Usage: vote create {Vote Name}, {Vote Type[public(Anyone can see voters, counter)|anonymous(Anyone can\'t see voters, counter before vote closed in chat where vote opened)|counter(Anyone can see counter)]}, {Selection1}, {Selection2}...',
		view: 'Display vote that you entered number. Usage: vote view {Vote Id}'
	},
	alias: 'vote',
	function: async (msg, logger, utils) => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'vote');
		var msgArr = msg.command_text.substring(5).split(' ');
		const action = msgArr.shift().toLowerCase();
		msgArr = msgArr.join(' ').split(',');
		for(let i = 0; i < msgArr.length; i++) msgArr[i] = msgArr[i].trim();

		const actions = {
			create: async () => {
				logger.log('notice', 'User %s Used Vote Command(Create %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msgArr.join(', '), msg.chat.title, msg.chat.id);
				const name = msgArr.shift();
				if(![ 'public', 'anonymous', 'counter' ].includes(type = msgArr.shift().toLowerCase())) return { message: getLanguage('wrongType') };
				const res = await utils.database.query('INSERT INTO vote(date, groupId, userId, username, name, data) VALUES(?, ?, ?, ?, ?, ?);', [ Date.now(), msg.chat.id, msg.from.id, msg.from.parsed_username, name, JSON.stringify({ type: type, selections: msgArr }) ]);
				return { message: getLanguage('created', name, res.insertId) };
			},
			view: async () => {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(View %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT * FROM vote WHERE id=?;', id), votingData = await utils.database.query('SELECT v1.username, v1.value FROM voting v1 WHERE date = (SELECT MAX(date) FROM voting v2 WHERE v1.userId = v2.userId ORDER BY v2.id LIMIT 1) AND v1.voteId = ?;', id);
				if(voteData.deleted) return { message: getLanguage('wasDeleted') };
				voteData.data = JSON.parse(voteData.data);
				let selections = [], inlineBtnArr = [];
				for(let i = 0; i < voteData.data.selections.length; i++) {
					let q = jsonQuery(`[**][*value=${i}].username`, { data: { data: votingData }}).value;
					selections.push(`<b>${voteData.data.selections[i]}</b>: ${q.length}${q.length && voteData.data.type === 'public' ? `(${q.join(', ')})` : ''}`);
					inlineBtnArr.push( [ { text: voteData.data.selections[i], callback_data: JSON.stringify({ action: 'VoteVoting', vote: id, value: i })} ] );
				}
				return { message: `<b>${voteData.name}</b>${(voteData.data.type === 'public' || voteData.data.type === 'counter') ? '\n\n' + selections.join('\n') : ''}`, options: { parse_mode: 'HTML', reply_markup: { inline_keyboard: inlineBtnArr }}};
			},
			open: async () => {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Open %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id);
				if(parseInt(voteData.groupId) !== msg.chat.id) return { message: getLanguage('notThisChat') };
				if(voteData.deleted) return { message: getLanguage('wasDeleted') };
				if(!voteData.closed) return { message: getLanguage('alreadyOpened') };
				return utils.database.query('UPDATE vote SET closed=0 WHERE id=?;', id).then(() => { return { message: getLanguage('opened', voteData.name, id) }}).catch((e) => { return { message: e.stack, error: true }});
			},
			close: async () => {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Close %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id);
				if(parseInt(voteData.groupId) !== msg.chat.id) return { message: getLanguage('notThisChat') };
				if(voteData.deleted) return { message: getLanguage('wasDeleted') };
				if(voteData.closed) return { message: getLanguage('alreadyClosed') };
				utils.database.query('UPDATE vote SET closed=1 WHERE id=?;', id).then(() => { return { message: getLanguage('closed', voteData.name, id) }}).catch((e) => { return { message: e.stack, error: true }});
			},
			result: async () => {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Result %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT groupId, name, data, closed, deleted FROM vote WHERE id=?;', id), votingData = await utils.database.query('SELECT v1.username, v1.value FROM voting v1 WHERE date = (SELECT MAX(date) FROM voting v2 WHERE v1.userId = v2.userId ORDER BY v2.id LIMIT 1) AND v1.voteId = ?;', id);
				if(parseInt(voteData.groupId) !== msg.chat.id) return { message: getLanguage('notThisChat') };
				if(voteData.deleted) return { message: getLanguage('deleted') };
				voteData.data = JSON.parse(voteData.data);
				let selections = [];
				for(let i = 0; i < voteData.data.selections.length; i++) {
					let q = jsonQuery(`[**][*value=${i}].username`, { data: { data: votingData }}).value;
					selections.push(`<b>${voteData.data.selections[i]}</b>: ${q.length}${q.length && voteData.data.type === 'public' ? `(${q.join(', ')})` : ''}`);
				}
				return { message: `<b>${voteData.name}</b>\n\n${selections.join('\n')}`, options: { parse_mode: 'HTML' }};
			},
			aresult: async () => {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(AResult %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT groupId, name, data, closed, deleted FROM vote WHERE id=?;', id), votingData = await utils.database.query('SELECT v1.username, v1.value FROM voting v1 WHERE date = (SELECT MAX(date) FROM voting v2 WHERE v1.userId = v2.userId ORDER BY v2.id LIMIT 1) AND v1.voteId = ?;', id);
				if(parseInt(voteData.groupId) !== msg.chat.id) return { message: getLanguage('notThisChat') };
				if(voteData.deleted) return { message: getLanguage('wasDeleted') };
				voteData.data = JSON.parse(voteData.data);
				let selections = [];
				for(let i = 0; i < voteData.data.selections.length; i++) {
					let q = jsonQuery(`[**][*value=${i}].username`, { data: { data: votingData }}).value;
					selections.push(`<b>${voteData.data.selections[i]}</b>: ${q.length}${q.length ? `(${q.join(', ')})` : ''}`);
				}
				return { message: `<b>${voteData.name}</b>\n\n${selections.join('\n')}`, options: { parse_mode: 'HTML' }};
			},
			delete: async () => {
				const id = msgArr.shift();
				logger.log('notice', 'User %s Used Vote Command(Delete %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
				const voteData = await utils.database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id);
				if(parseInt(voteData.groupId) !== msg.chat.id) return { message: getLanguage('notThisChat') };
				if(voteData.deleted) return { message: getLanguage('wasDeleted') };
				if(!voteData.closed) return telegram.bot.sendMessage(msg.chat.id, getLanguage('notClosed'), { reply_to_message_id: msg.message_id });
				return utils.database.query('UPDATE vote SET deleted=1 WHERE id=?;', id).then(() => { return { message: getLanguage('deleted', voteData.name, id) }}).catch((e) => { return { message: e.stack, error: true }});
			}
		}

		return Object.keys(actions).includes(action) ? actions[action]() : { message: getLanguage('invaildAction') };
	}
}