const getSauce = new (require('sagiri'))(require('../config').SauceNAO.Token).getSauce, tmpDir = require('os').tmpdir();
module.exports = async (msg, logger, utils) => {
	const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'source');
	if(logger) logger.log('notice', 'User %s Used Source Command in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
	if(!msg.photo && (!msg.reply_to_message || !msg.reply_to_message.photo)) return { message: getLanguage('noPhoto') };
	var toSendMsgs = [];
	const photoObj = msg.photo ? msg.photo : msg.reply_to_message.photo, photo = photoObj[photoObj.length - 1];
	const sauceData = await getSauce(await utils.bot.downloadFile(photo.file_id, tmpDir));
	toSendMsgs.push(`<a href="${sauceData.original.data.pawoo_id ? `${sauceData.url}/${sauceData.original.data.pawoo_id}` : sauceData.url}">${getLanguage('viewOn', sauceData.site)}</a>`);
	toSendMsgs.push(`${getLanguage('similarity')}: ${sauceData.similarity}`);
	return { message: toSendMsgs.join('\n') };
}
