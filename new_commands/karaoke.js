const asyncRequest = require('../modules/AsyncRequest');

module.exports = {
	alias: 'karaoke',
	function: async (msg, logger, utils) => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'karaoke');
		const msgArr = msg.command_text.substring(8).split(' '), provider = msgArr.shift(), query = msgArr.join(' ');
		logger.log('notice', 'User %s Used Karaoke Command(Find %s in %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, query, provider, msg.chat.title, msg.chat.id);
		var songsList = await asyncRequest(`http://localhost:8080/getSongsList?provider=${provider}&query=${query}`).catch(e => e);
		if(songsList instanceof Error) return { message: getLanguage('serverError', songsList.message) };
		songsList = JSON.parse(songsList);
		if(!songsList.success) return { message: getLanguage('serverError', songsList.result) };
		var toSendArr = [];
		for(var i = 0; i < 10 && i < songsList.result.length; i++) {
			if(songsList.result.length > 10) toSendArr.push(`${getLanguage('tooManyResults', songsList.result.length)}\n`);
			if(songsList.result[i].needOver60) toSendArr.push(`<b>#${songsList.result[i].number}(${getLanguage('needOver60')})</b>: ${songsList.result[i].title} - ${songsList.result[i].singer}`);
			else toSendArr.push(`<b>#${songsList.result[i].number}</b>: ${songsList.result[i].title} - ${songsList.result[i].singer}`);
		}
		return { message: toSendArr.join('\n'), options: { parse_mode: 'HTML' }};
	}
}