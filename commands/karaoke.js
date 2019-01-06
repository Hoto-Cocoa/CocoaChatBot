const karaokeApi = new (require('../modules/KaraokeApi'))();

module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'karaoke');

		if(msg.command_text.startsWith('karaoke ')) {
			const msgArr = msg.command_text.substring(8).split(' '), provider = msgArr.shift(), title = msgArr.join(' ');
			logger.log('notice', 'User %s Used Karaoke Command(Find %s in %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, title, provider, msg.chat.title, msg.chat.id);
			const songsList = await karaokeApi.getSongList(provider, title);
			if(songsList instanceof Error && songsList.message === 'NO_PROVIDER') return telegram.bot.sendMessage(msg.chat.id, getLanguage('noProvider'), { reply_to_message_id: msg.message_id });
			if(songsList instanceof Error && songsList.message === 'NO_RESULT') return telegram.bot.sendMessage(msg.chat.id, getLanguage('noResult'), { reply_to_message_id: msg.message_id });
			var toSendArr = [];
			for(var i = 0; i < 10 && i < songsList.length; i++) {
				if(songsList[i].needOver60) toSendArr.push(`<b>#${songsList[i].number}(${getLanguage('needOver60')})</b>: ${songsList[i].title} - ${songsList[i].singer}`);
				else toSendArr.push(`<b>#${songsList[i].number}</b>: ${songsList[i].title} - ${songsList[i].singer}`);
			}
			return telegram.bot.sendMessage(msg.chat.id, toSendArr.join('\n'), { reply_to_message_id: msg.message_id, parse_mode: 'HTML' });
		}
	});
}