const https = require('https');
const math = require('mathjs');
math.config({
	number: 'BigNumber',
	precision: 64
});

module.exports = (bot, logger, utils) => {
	bot.on('message', msg => {
		const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
		const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
		const getLanguage = await utils.getLanguage(msg.from.language_code, msg.from.id, 'math');

		if(msgText.startsWith('=')) {
			const input = msgText.substring(1);
			if(input.match(/[ㄱ-힣]/)) return;
			logger.log('notice', 'User %s Used Math Command(Calculate %s) in %s(%s)', `${username}(${msg.from.id})`, input, msg.chat.title, msg.chat.id);
			for(var i = 0; i < require('../config').BannedWords.length; i++) {
				if(input.toLowerCase().search(require('../config').BannedWords[i]) !== -1) return bot.sendMessage(msg.chat.id, getLanguage('banned'), { reply_to_message_id: msg.message_id }); 
			}
			try {
				if((input.match(/!/g) || []).length < 2 && (mathResult = +math.eval(input)) && mathResult !== Infinity && mathResult.toString().search('e') === -1 && input !== 'pi') {
					return bot.sendMessage(msg.chat.id, mathResult, { reply_to_message_id: msg.message_id });
				} else {
					throw new Error();
				}
			} catch(e) {
				https.get(`https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(input)}&primary=true&appid=${require('../config').Wolfram.Token}&format=plaintext&output=json&podtitle=Result&podtitle=Decimal%20approximation&podtitle=Power%20of%2010%20representation&podtitle=Exact%20result`, res => {
					var json = '';
					res.on('data', data => {
						json += data;
					});
					res.on('end', () => {
						json = JSON.parse(json);
						if(!json.queryresult.pods) return bot.sendMessage(msg.chat.id, getLanguage('wrongInput'), { reply_to_message_id: msg.message_id });
						const value = json.queryresult.pods[0].subpods[0].plaintext;
						var options = { reply_to_message_id: msg.message_id };
						if(json.queryresult.pods[0].states && (json.queryresult.pods[0].states[0].name === 'More digits' || json.queryresult.pods[0].states.length > 1)) options = Object.assign({
							reply_markup: { inline_keyboard: [ [ {
								text: getLanguage('more'), 
								callback_data: JSON.stringify({ action: 'MathMoreNumber', value: 1 })
							} ] ] }
						}, options);
						return bot.sendMessage(msg.chat.id, value, options);
					});
				});
			}
		}
	});
}