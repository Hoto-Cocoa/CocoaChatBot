const jsonQuery = require('json-query');

module.exports = (telegram, logger, utils) => {
	telegram.events.on('callback_query', async msg => {
		if(msg.data.action === 'VoteVoting') {
			const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'vote');
			logger.log('notice', 'User %s Used Vote Voting Button(Vote to %s, Value %s) in %s(%s)', `${msg.parsed_username}(${msg.from.id})`, msg.data.vote, msg.data.value, msg.message.chat.title, msg.message.chat.id);
			var voteData = await utils.database.query('SELECT name, data, closed, deleted FROM vote WHERE id=?', msg.data.vote);
			voteData.data = JSON.parse(voteData.data);
			if(voteData.closed) return telegram.bot.answerCallbackQuery(msg.id, { text: getLanguage('wasClosed')});
			if(voteData.deleted) return telegram.bot.answerCallbackQuery(msg.id, { text: getLanguage('wasDeleted')});
			utils.database.query('INSERT INTO voting(date, voteId, userId, username, value) VALUES(?, ?, ?, ?, ?);', [
				Date.now(), msg.data.vote, msg.from.id, msg.parsed_username, msg.data.value
			]).then(() => {
				if(voteData.data.type === 'public' || voteData.data.type === 'counter') {
					utils.database.query('SELECT v1.* FROM voting v1 WHERE date = (SELECT MAX(date) FROM voting v2 WHERE v1.userId = v2.userId ORDER BY v2.id LIMIT 1) AND v1.voteId = ?;', msg.data.vote).then(res => {
						let selections = [];
						for(let i = 0; i < voteData.data.selections.length; i++) {
							let q = jsonQuery(`[**][*value=${i}].username`, { data: { data: res }}).value;
							selections.push(`<b>${voteData.data.selections[i]}</b>: ${q.length}${q.length && voteData.data.type === 'public' ? `(${q.join(', ')})` : ''}`);
						}
						let inlineBtnArr = [];
						for(let i = 0; i < voteData.data.selections.length; i++) {
							inlineBtnArr.push( [ {
								text: voteData.data.selections[i],
								callback_data: JSON.stringify({
									action: 'VoteVoting',
									vote: msg.data.vote,
									value: i
								})
							} ] );
						}
						telegram.bot.editMessageText(`<b>${voteData.name}</b>\n\n${selections.join('\n')}`, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, parse_mode: 'HTML', reply_to_message_id: msg.message.reply_to_message.message_id, reply_markup: { inline_keyboard: inlineBtnArr }});
					});
				}
				return telegram.bot.answerCallbackQuery(msg.id, {
					text: getLanguage('recorded')
				});
			});
		}
	});
}