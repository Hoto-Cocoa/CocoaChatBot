const TelegramBot = require('node-telegram-bot-api');
const google = require('google');
const Logger = require('winston');
const Config = require('./config');

const telegramBot = new TelegramBot(Config.Telegram.Token, { polling: true} );
google.resultsPerPage = 3;
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

telegramBot.on('message', (msg) => {
	logger.log('debug', 'User %s Said "%s" in %s(%s)', `@${msg.from.username}(${msg.from.id})`, msg.text, msg.chat.title, msg.chat.id);
	if(msg.text.startsWith('//')) {
		logger.log('notice', 'User %s Used Google Command(Search %s) in %s(%s)', `@${msg.from.username}(${msg.from.id})`, msg.text.substring(2, msg.text.length), msg.chat.title, msg.chat.id)
		google(msg.text.substring(2, msg.text.length), function(err, res) {
			if(err) logger.log('error', err);
			var toSendMsg = "";
			for(var i = 0; i < res.links.length; i++) {
				var link = res.links[i];
				toSendMsg += `<a href="${link.href}">${link.title}</a>\n${link.description}\n\n`
			}
			telegramBot.sendMessage(msg.chat.id, toSendMsg, { parse_mode: 'HTML' });
		})
	}
});