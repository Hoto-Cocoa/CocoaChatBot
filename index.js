const TelegramBot = require('node-telegram-bot-api');
const Logger = require('winston');
const Config = require('./config');
const https = require('https');
const Database = require('./modules/Database');
const schoolMeal = require('./modules/SchoolMeal');

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
const database = new Database(Config.Database, logger);

require('./modules/CreateDatabase')(Config.Database, logger);

const rateLimit = [];
rateLimit['BtnVoteVoting'] = [];

telegramBot.on('message', msg => {
	const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
	const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
	logger.log('debug', 'User %s Said "%s" in %s(%s)', `${username}(${msg.from.id})`, msgText, msg.chat.title, msg.chat.id);
});
require('./commands/index')(telegramBot, logger, database);

telegramBot.on('callback_query', msg => {
	const data = JSON.parse(msg.data);
	const name = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;

	if(data.action === 'MathMoreNumber') {
		const expression = msg.message.reply_to_message.text.substring(1, msg.message.reply_to_message.text.length);
		logger.log('notice', 'User %s Used Math More Button(Calculate %s, More Number %s) in %s(%s)', `${name}(${msg.message.from.id})`, expression, data.value, msg.message.chat.title , msg.message.chat.id);
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

	if(data.action === 'VoteVoting') {
		if(rateLimit['BtnVoteVoting'][msg.from.id]) return telegramBot.answerCallbackQuery(msg.id, {
			text: 'You are rate-limited.'
		});
		rateLimit['BtnVoteVoting'][msg.from.id] = true;
		setTimeout(() => {
			rateLimit['BtnVoteVoting'][msg.from.id] = null;
			delete rateLimit['BtnVoteVoting'][msg.from.id];
		}, 5000);
		logger.log('notice', 'User %s Used Vote Voting Button(Vote to %s, Value %s) in %s(%s)', `@${name}(${msg.from.id})`, data.vote, data.value, msg.message.chat.title , msg.message.chat.id);
		database.query('SELECT closed, deleted FROM vote WHERE id=?', data.vote).then(res => {
			if(res[0].closed) return telegramBot.answerCallbackQuery(msg.id, {
				text: 'This vote was closed.'
			});
			if(res[0].deleted) return telegramBot.answerCallbackQuery(msg.id, {
				text: 'This vote was deleted.'
			});
			database.query(`SELECT id FROM voting WHERE voteId=? AND userId=? ORDER BY id DESC LIMIT 1`, [
				data.vote, msg.from.id
			]).then(res => {
				if(res.length) {
					database.query(`UPDATE voting SET active=0 WHERE id=?`, res[0].id);
				}
				database.query('UPDATE vote SET count=count+1 WHERE id=?;', data.vote).then(() => {
					database.query('INSERT INTO voting(date, voteId, userId, username, value) VALUES(?, ?, ?, ?, ?);', [
						Date.now(), data.vote, msg.from.id, name, data.value
					]);
					return telegramBot.answerCallbackQuery(msg.id, {
						text: 'Your voting was recorded.'
					});
				});
			});
		});
	}

	if(data.action === 'SchoolChoice') {
		logger.log('notice', 'User %s Used School Choice Button(School %s, Type %s) in %s(%s)', `${name}(${msg.message.from.id})`, data.code, data.type, msg.message.chat.title , msg.message.chat.id);
		schoolMeal.get(data.type, data.code, (err, res) => {
			if(err) return (logger.log('error', err) && bot.sendMessage(msg.chat.id, 'Error!', { reply_to_message_id: msg.message_id }));
			return telegramBot.editMessageText(res, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id });
		});
	}
});

telegramBot.on('polling_error', (e) => {
	logger.log('error', e);
});