const TelegramBot = require('node-telegram-bot-api');
const Logger = require('winston');
const Config = require('./config');
const Database = require('./modules/Database');
const Language = require('./modules/Language');
const RateLimit = require('./modules/RateLimit');
const Events = require('events');

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
		}),
		new Logger.transports.File({	
			filename: 'notice.log',
			level: 'notice'
		}),
		new Logger.transports.File({	
			filename: 'error.log',
			level: 'error'
		})
	]
});
const telegramBot = new TelegramBot(Config.Telegram.Token, Config.Test ? { polling: { params: { timeout : 1 }}} : { polling: true });
const database = new Database(Config.Database, logger);
const language = new Language(database);
const rateLimit =  new RateLimit();
const telegramEvents = new Events();

require('./modules/CreateDatabase')(Config.Database, logger);

// telegramBot.on('message', msg => {
// 	const msgText = msg.text ? msg.text : msg.caption ? msg.caption : msg.photo ? '(photo)' : msg.audio ? '(audio)' : msg.document ? '(document)' : msg.sticker ? `(sticker: ${msg.sticker.emoji})` : '';
// 	const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
// 	logger.log('debug', 'User %s Said "%s" in %s(%s)', `${username}(${msg.from.id})`, msgText, msg.chat.title, msg.chat.id);
// 	if(msgText.startsWith(Config.Telegram.Prefix ? Config.Telegram.Prefix : '')) {
// 		if(msg.text) msg.command_text = msg.text.substring(Config.Telegram.Prefix ? Config.Telegram.Prefix.length : 0);
// 		if(msg.caption) (msg.command_text = msg.caption.substring(Config.Telegram.Prefix ? Config.Telegram.Prefix.length : 0)) && delete msg.caption;
// 		if(!msg.command_text) msg.command_text = '';
// 		msg.from.parsed_username = username;
// 		telegramEvents.emit('message', msg);
// 	}
// });
// require('./commands/index')({ bot: telegramBot, events: telegramEvents }, logger, { database, rateLimit, language });

var commands = [], helps = {};
require('fs').readdirSync(`${__dirname}/new_commands`).forEach(file => {
	const command = require(`${__dirname}/new_commands/${file}`);
	commands[command.alias] = command.function;
	helps[command.alias] = { description: command.description, subcommands: command.subcommands };
});
telegramBot.on('message', async msg => {
	const msgText = msg.text ? msg.text : msg.caption ? msg.caption : msg.photo ? '(photo)' : msg.audio ? '(audio)' : msg.document ? '(document)' : msg.sticker ? `(sticker: ${msg.sticker.emoji})` : '';
	const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
	logger.log('debug', 'User %s Said "%s" in %s(%s)', `${username}(${msg.from.id})`, msgText, msg.chat.title, msg.chat.id);
	if(msgText.startsWith(Config.Telegram.Prefix ? Config.Telegram.Prefix : '')) {
		if(msg.text) msg.command_text = msg.text.substring(Config.Telegram.Prefix ? Config.Telegram.Prefix.length : 0);
		if(msg.caption) (msg.command_text = msg.caption.substring(Config.Telegram.Prefix ? Config.Telegram.Prefix.length : 0)) && delete msg.caption;
		if(!msg.command_text) msg.command_text = '';
		msg.from.parsed_username = username;
		if(msg.command_text.split(' ').shift().search(/[가-힣]/) === -1) {
			if(msg.command_text.split(' ').shift().toLowerCase() === 'help') {
				let toSendMsgs = [];
				if(Object.keys(helps).includes(msg.command_text.split(' ')[1])) for(let i in Object.keys(helps[msg.command_text.split(' ')[1]].subcommands)) toSendMsgs.push(`${Object.keys(helps[msg.command_text.split(' ')[1]].subcommands)[i]} - ${helps[msg.command_text.split(' ')[1]].subcommands[Object.keys(helps[msg.command_text.split(' ')[1]].subcommands)[i]]}`);
				else for(let i in Object.keys(helps)) toSendMsgs.push(`${Object.keys(helps)[i]} - ${helps[Object.keys(helps)[i]].description}`);
				telegramBot.sendMessage(msg.chat.id, toSendMsgs.join('\n'), { reply_to_message_id: msg.message_id });
			} else {
				const cmdFunction = commands[msg.command_text.split(' ').shift().toLowerCase()]? commands[msg.command_text.split(' ').shift().toLowerCase()] : commands[msg.command_text.match(/[=/]*/)[0]];
				if(cmdFunction) {
					let result = await cmdFunction(msg, logger, { bot: telegramBot, database, rateLimit, language }).catch(e => ({ message: e.stack, error: true }));
					if(!result.error) {
						telegramBot.sendMessage(msg.chat.id, result.message, Object.assign({ reply_to_message_id: msg.message_id }, result.options ? result.options : {})).catch(e => {
							if(result.catch) return telegramBot.sendMessage(msg.chat.id, result.catch.message, Object.assign({ reply_to_message_id: msg.message_id }, result.catch.options ? result.catch.options : {}));
							return telegramBot.sendMessage(Config.Telegram.Owner, e.stack);
						});
					} else telegramBot.sendMessage(Config.Telegram.Owner, `User ${username}(${msg.from.id}) said "${msgText}" in ${msg.chat.title}(${msg.chat.id}).\n\n${result.message}`);
				}
			}
		}
	}
});

telegramBot.on('callback_query', msg => {
	msg.data = JSON.parse(msg.data);
	msg.parsed_username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
	telegramEvents.emit('callback_query', msg);
});
require('./callbacks/index')({ bot: telegramBot, events: telegramEvents }, logger, { database, rateLimit, language });

telegramBot.on('polling_error', (e) => {
	logger.log('error', e.stack);
});

process.on('unhandledRejection', (reason, p) => {
	logger.log('error', reason.stack);
});
