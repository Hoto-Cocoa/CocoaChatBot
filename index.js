const TelegramBot = require('node-telegram-bot-api');
const google = require('google');
const Logger = require('winston');
const Config = require('./config');
const Sauce = require('sagiri');
const https = require('https');
const math = require('mathjs');


const logger = Logger.createLogger({
	format: Logger.format.combine(
		Logger.format.splat(),
		Logger.format.simple(),
		Logger.format.timestamp(),
		Logger.format.printf(info => { return `[${info.timestamp}] [${info.level}] ${info.message}`; })
	),
	levels: Logger.config.syslog.levels,
	transports: [
		new Logger.transports.Console({ level: 'debug' }),
		new Logger.transports.File({	
			filename: 'debug.log',
			level: 'debug'
		})
	]
});
const telegramBot = new TelegramBot(Config.Telegram.Token, { polling: true });
const sauce = new Sauce(Config.SauceNAO.Token);

google.resultsPerPage = 20;
math.config({
	number: 'BigNumber',
	precision: 64
});

const tmpDir = require('os').tmpdir();

telegramBot.on('message', msg => {
	const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
	logger.log('debug', 'User %s Said "%s" in %s(%s)', `@${msg.from.username}(${msg.from.id})`, msgText, msg.chat.title, msg.chat.id);
	if(msgText.startsWith('//')) {
		logger.log('notice', 'User %s Used Google Command(Search %s) in %s(%s)', `@${msg.from.username}(${msg.from.id})`, msgText.substring(2, msgText.length), msg.chat.title, msg.chat.id);
		google(msgText.substring(2, msgText.length), function(err, res) {
			if(err) logger.log('error', err);
			var toSendMsgs = [];
			for(var i = 0; i < res.links.length; i++) {
				if(toSendMsgs.length >= 3) break;
				var link = res.links[i];
				// Change below description to href to show webpage results, that like youtube.
				if(link.description) toSendMsgs.push(`<a href="${link.href}">${link.title}</a>\n${link.description.replace('<', '&lt;').replace('>', '&gt;')}`);
			}
			return telegramBot.sendMessage(msg.chat.id, toSendMsgs.join('\n\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
		});
	}

	if(msgText.toLowerCase() === 'source') {
		logger.log('notice', 'User %s Used Source Command in %s(%s)', `@${msg.from.username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
		if(!msg.photo && !msg.reply_to_message.photo) {
			return telegramBot.sendMessage(msg.chat.id, 'No photo detected!', { reply_to_message_id: msg.message_id });
		}

		const photoObj = msg.photo ? msg.photo : msg.reply_to_message.photo, photo = photoObj[photoObj.length - 1];
		telegramBot.downloadFile(photo.file_id, tmpDir).then(filePath => {
			sauce.getSauce(filePath).then(sauceInfo => {
				var sauceData = sauceInfo[0], sauceUrl = sauceData.original.data.pawoo_id ? `${sauceData.url}/${sauceData.original.data.pawoo_id}` : sauceData.url, toSendMsgs = [];
				toSendMsgs.push(`<a href="${sauceUrl}">View on ${sauceData.site}</a>`);
				toSendMsgs.push(`Similarity: ${sauceData.similarity}`);
				return telegramBot.sendMessage(msg.chat.id, toSendMsgs.join('\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
			});
		});
	}

	if(msgText.startsWith('=')) {
		const input = msgText.substring(1, msgText.length);
		logger.log('notice', 'User %s Used Math Command(Calculate %s) in %s(%s)', `@${msg.from.username}(${msg.from.id})`, input, msg.chat.title, msg.chat.id);
		for(var i = 0; i < Config.BannedWords.length; i++) {
			if(input.toLowerCase().search(Config.BannedWords[i]) !== -1) return telegramBot.sendMessage(msg.chat.id, 'This expression was banned.', { reply_to_message_id: msg.message_id }); 
		}
		try {
			if((input.match(/!/g) || []).length < 2 && (mathResult = +math.eval(input)) && mathResult !== Infinity && mathResult.toString().search('e') === -1) {
				return telegramBot.sendMessage(msg.chat.id, mathResult, { reply_to_message_id: msg.message_id });
			} else {
				throw new Error();
			}
		} catch(e) {
			https.get(`https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(input)}&primary=true&appid=${Config.Wolfram.Token}&format=plaintext&output=json&podtitle=Result&podtitle=Decimal%20approximation&podtitle=Power%20of%2010%20representation&podtitle=Exact%20result`, res => {
				var json = '';
				res.on('data', data => {
					json += data;
				});
				res.on('end', () => {
					json = JSON.parse(json);
					if(!json.queryresult.pods) return telegramBot.sendMessage(msg.chat.id, 'Wrong input!', { reply_to_message_id: msg.message_id });
					const value = json.queryresult.pods[0].subpods[0].plaintext;
					var options = { reply_to_message_id: msg.message_id };
					if(json.queryresult.pods[0].states && (json.queryresult.pods[0].states[0].name === 'More digits' || json.queryresult.pods[0].states.length > 1)) options = Object.assign({
						reply_markup: { inline_keyboard: [ [ {
							text: 'More', 
							callback_data: JSON.stringify({ action: 'MathMoreNumber', value: 1 })
						} ] ] }
					}, options);
					return telegramBot.sendMessage(msg.chat.id, value, options);
				});
			});
		}
	}

	if(msgText.toLowerCase() === 'info') {
		return telegramBot.sendMessage(msg.chat.id, JSON.stringify(msg.reply_to_message ? msg.reply_to_message : msg), { reply_to_message_id: msg.message_id });
	}
});

telegramBot.on('callback_query', msg => {
	const data = JSON.parse(msg.data);
	if(data.action === 'MathMoreNumber') {
		const expression = msg.message.reply_to_message.text.substring(1, msg.message.reply_to_message.text.length);
		logger.log('notice', 'User %s Used Math More Button(Calculate %s, More Number %s) in %s(%s)', `@${msg.message.from.username}(${msg.message.from.id})`, expression, data.value, msg.message.chat.title , msg.message.chat.id);
		https.get(`https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(expression)}&primary=true&appid=${Config.Wolfram.Token}&podstate=${data.value}@Result__More+digits&podstate=${data.value}@DecimalApproximation__More+digits&format=plaintext&output=json&podtitle=Result&podtitle=Decimal%20approximation&podtitle=Power%20of%2010%20representation&podtitle=Exact%20result`, res => {
			var json = '';
			res.on('data', data => {
				json += data;
			});
			res.on('end', () => {
				json = JSON.parse(json);
				const value = json.queryresult.pods[0].subpods[0].plaintext;
				var options = { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id };
				if(data.value < 10 && json.queryresult.pods[0].states && (json.queryresult.pods[0].states[0].name === 'More digits' || json.queryresult.pods[0].states.length > 1)) options = Object.assign({
					reply_markup: { inline_keyboard: [ [ {
						text: 'More',
						callback_data: JSON.stringify({ action: 'MathMoreNumber', value: data.value + 1 })
					} ] ] }
				}, options);
				return telegramBot.editMessageText(value, options);
			});
		});
	}
});

telegramBot.on('polling_error', (e) => {
	logger.log('error', e);
});