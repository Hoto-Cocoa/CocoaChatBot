module.exports = {
	alias: 'get',
	function: async (msg, logger, utils) => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'get');

		const id = parseInt(msg.command_text.substring(4));
		const readableId = msg.from.language_code && msg.from.language_code.substring(0, 2) === 'en' ? id + (id === 1 ? 'st' : id === 2 ? 'nd' : id === 3 ? 'rd' : 'th') : id;
		logger.log('notice', 'User %s Used Get Command(Get %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.text.substring(4), msg.chat.title, msg.chat.id);
		if(!id) return { message: getLanguage('wrongNumber') };
		return { message: getLanguage('result', readableId), options: { reply_to_message_id: id }, catch: { message: getLanguage('noResult', readableId) }};
	}
}