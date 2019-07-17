const math = require('mathjs'), mathApi = require('../modules/WolframAlpha');
math.config({ number: 'BigNumber', precision: 64 });

module.exports = {
	alias: '=',
	function: async (msg, logger, utils) => {
		const getLanguage = await utils.language.getLanguage(msg.from.language_code, msg.from.id, 'math');
		const input = msg.command_text.substring(1);
		if(input.match(/[ㄱ-힣]*/g)) return;
		logger.log('notice', 'User %s Used Math Command(Calculate %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, input, msg.chat.title, msg.chat.id);
		for(var i = 0; i < require('../config').BannedWords.length; i++) if(input.toLowerCase().search(require('../config').BannedWords[i]) !== -1) return { message: getLanguage('banned') };
		try {
			if((!input.match(/!/g) || input.match(/!/g).length < 2) && input.search(/[A-Za-z]*/g) === -1 && (mathResult = +math.eval(input)) && mathResult !== Infinity && mathResult.toString().search('e') === -1 && (!mathResult.toString().search('.') || mathResult.toString().split('.')[1].length > 5)) return { message: mathResult };
			else throw new Error('UN_CALCULATABLE');
		} catch(e) {
			if(e.message === 'UN_CALCULATABLE') {
				const result = await mathApi(input).catch(e => e);
				if(result instanceof Error) return { message: result.message };
				var options = {};
				if(mathApi.more) options = Object.assign({ reply_markup: { inline_keyboard: [ [ { text: getLanguage('more'), callback_data: JSON.stringify({ action: 'MathMoreNumber', value: 1 }) } ] ] } }, options);
				return { message: result.value, options }
			} else throw e;
		}
	}
}