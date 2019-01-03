const asyncRequest = require('../modules/AsyncRequest');
const math = require('mathjs');
math.config({
	number: 'BigNumber',
	precision: 64
});

module.exports = (telegram, logger, utils) => {
	telegram.events.on('message', async msg => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'math');
		if(msg.command_text.startsWith('=')) {
			const input = msg.command_text.substring(1);
			if(input.match(/[ㄱ-힣]/)) return;
			logger.log('notice', 'User %s Used Math Command(Calculate %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, input, msg.chat.title, msg.chat.id);
			for(var i = 0; i < require('../config').BannedWords.length; i++) {
				if(input.toLowerCase().search(require('../config').BannedWords[i]) !== -1) return telegram.bot.sendMessage(msg.chat.id, getLanguage('banned'), { reply_to_message_id: msg.message_id }); 
			}
			try {
				if((input.match(/!/g) || []).length < 2 && (mathResult = +math.eval(input)) && mathResult !== Infinity && mathResult.toString().search('e') === -1 && input !== 'pi') {
					return telegram.bot.sendMessage(msg.chat.id, mathResult, { reply_to_message_id: msg.message_id });
				} else {
					throw new Error();
				}
			} catch(e) {
				const result = JSON.parse(await asyncRequest(`https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(input)}&primary=true&appid=${require('../config').Wolfram.Token}&format=plaintext&output=json&podtitle=Result&podtitle=Decimal%20approximation&podtitle=Power%20of%2010%20representation&podtitle=Exact%20result`));
				if(!result.queryresult.pods) return telegram.bot.sendMessage(msg.chat.id, getLanguage('wrongInput'), { reply_to_message_id: msg.message_id });
				const value = result.queryresult.pods[0].subpods[0].plaintext;
				var options = { reply_to_message_id: msg.message_id };
				if(result.queryresult.pods[0].states && (result.queryresult.pods[0].states[0].name === 'More digits' || result.queryresult.pods[0].states.length > 1)) options = Object.assign({
					reply_markup: { inline_keyboard: [ [ {
						text: getLanguage('more'), 
						callback_data: JSON.stringify({ action: 'MathMoreNumber', value: 1 })
					} ] ] }
				}, options);
				return telegram.bot.sendMessage(msg.chat.id, value, options);
			}
		}
	});
}