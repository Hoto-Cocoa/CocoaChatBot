const asyncRequest = require('../modules/AsyncRequest');

module.exports = (telegram, logger, utils) => {
	telegram.events.on('callback_query', async msg => {
		if(msg.data.action === 'MathMoreNumber') {
			const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'math'), languageData = await utils.language.getLanguageData(msg.from.language_code, msg.from.id);
			if(utils.rateLimit.get('BtnMathMoreNumber', msg.from.id)) return telegram.bot.answerCallbackQuery(msg.id, {
				text: languageData.rateLimit
			});
			utils.rateLimit.add('BtnMathMoreNumber', msg.from.id, 5000);
			const expression = msg.message.reply_to_message.text.substring(require('../config').Telegram.Prefix.length + 1, msg.message.reply_to_message.text.length);
			logger.log('notice', 'User %s Used Math More Number Button(Expression %s, More %s) in %s(%s)', `${msg.parsed_username}(${msg.from.id})`, msg.data.expression, msg.data.value, msg.message.chat.title, msg.message.chat.id);
			const result = JSON.parse((await asyncRequest(`https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(expression)}&primary=true&appid=${require('../config').Wolfram.Token}&podstate=${msg.data.value}@Result__More+digits&podstate=${msg.data.value}@DecimalApproximation__More+digits&format=plaintext&output=json&podtitle=Result&podtitle=Decimal%20approximation&podtitle=Power%20of%2010%20representation&podtitle=Exact%20result`)).body);
			const value = result.queryresult.pods[0].subpods[0].plaintext;
			var options = { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id };
			if(msg.data.value < 10 && result.queryresult.pods[0].states && (result.queryresult.pods[0].states[0].name === 'More digits' || result.queryresult.pods[0].states.length > 1)) options = Object.assign({
				reply_markup: { inline_keyboard: [ [ {
					text: getLanguage('more'),
					callback_data: JSON.stringify({ action: 'MathMoreNumber', value: msg.data.value + 1 })
				} ] ] }
			}, options);
			return telegram.bot.editMessageText(value, options);
		}
	});
}