const TelegramBot = require('node-telegram-bot-api');
const google = require('google');
const Logger = require('winston');
const Config = require('./config');
const Sauce = require('sagiri');
const https = require('https');

const telegramBot = new TelegramBot(Config.Telegram.Token, { polling: true} );
google.resultsPerPage = 15;
const logger = Logger.createLogger({
	format: Logger.format.combine(
		Logger.format.splat(),
		Logger.format.simple(),
		Logger.format.timestamp(),
		Logger.format.printf((info) => { return `[${info.timestamp}] [${info.level}] ${info.message}`; })
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
const sauce = new Sauce(Config.SauceNAO.Token);

const tmpDir = require('os').tmpdir();

telegramBot.on('message', (msg) => {
	msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
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
			telegramBot.sendMessage(msg.chat.id, toSendMsgs.join('\n\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
		});
	}

	if(msgText.toLowerCase() === 'source') {
		logger.log('notice', 'User %s Used Source Command in %s(%s)', `@${msg.from.username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
		if(!msg.photo && !msg.reply_to_message.photo) {
			telegramBot.sendMessage(msg.chat.id, 'No photo detected!', { reply_to_message_id: msg.message_id });
			return;
		}

		const photoObj = msg.photo ? msg.photo : msg.reply_to_message.photo, photo = photoObj[photoObj.length - 1];
		telegramBot.downloadFile(photo.file_id, tmpDir).then(filePath => {
			sauce.getSauce(filePath).then(sauceInfo => {
				var sauceData = sauceInfo[0], sauceUrl = sauceData.original.data.pawoo_id ? `${sauceData.url}/${sauceData.original.data.pawoo_id}` : sauceData.url;
				var toSendMsgs = [];
				toSendMsgs.push(`<a href="${sauceUrl}">View on ${sauceData.site}</a>`);
				toSendMsgs.push(`Similarity: ${sauceData.similarity}`);
				telegramBot.sendMessage(msg.chat.id, toSendMsgs.join('\n'), { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
			});
		});
	}

	if(msgText.startsWith('=')) {
		const input = msgText.substring(1, msgText.length);
		logger.log('notice', 'User %s Used Math Command(Calculate %s) in %s(%s)', `@${msg.from.username}(${msg.from.id})`, input, msg.chat.title, msg.chat.id);
		https.get(`https://api.wolframalpha.com/v2/query?input=${input}&primary=true&appid=${Config.Wolfram.Token}&format=plaintext&podstate=9@Result__More+digits&podstate=9@DecimalApproximation__More+digits&output=json&podtitle=Result&podtitle=Decimal%20approximation&podtitle=Power%20of%2010%20representation&podtitle=Exact%20result`, res => {
			var json = '';
			res.on('data', data => {
				json += data;
			});
			res.on('end', () => {
				json = JSON.parse(json);
				var value = json.queryresult.pods ? json.queryresult.pods[0].subpods[0].plaintext : input;
				telegramBot.sendMessage(msg.chat.id, value, { reply_to_message_id: msg.message_id });
			});
		});
	}
});

telegramBot.on('polling_error', (e) => {
	logger.log('error', e);
});