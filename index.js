const TelegramBot = require('node-telegram-bot-api');
const Logger = require('winston');
const Config = require('./config');
const https = require('https');
const Database = require('./modules/Database');
const schoolMeal = require('./modules/SchoolMeal');
const jsonQuery = require('json-query');

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

const rateLimit = {
	add: (type, userId, time) => {
		if(!this.storage[type]) this.storage[type] = [];
		this.storage[type][userId] = true;
		if(time) setTimeout(() => {
			this.storage[type][userId] = null;
			delete this.storage[type][userId];
		}, time);
	},
	get: (type, userId) => {
		if(!this.storage[type]) this.storage[type] = [];
		return this.storage[type][userId];
	},
	remove: (type, userId) => {
		this.storage[type][userId] = null;
		delete this.storage[type][userId];
	},
	init: () => {
		this.storage = [];
	}
}
rateLimit.init();

var languages = [];
require('fs').readdirSync(__dirname + '/languages/').forEach(function(file) {
	languages[file.substring(0, 2)] = require(`${__dirname}/languages/${file}`);
});
function getLanguage(language) {
	language = language ? language.substring(0, 2) : 'en';
	return languages[language] ? languages[language] : languages['en'];
}

telegramBot.on('message', msg => {
	const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
	const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
	logger.log('debug', 'User %s Said "%s" in %s(%s)', `${username}(${msg.from.id})`, msgText, msg.chat.title, msg.chat.id);
});
require('./commands/index')(telegramBot, logger, {
	database, rateLimit, getLanguage
});

telegramBot.on('callback_query', msg => {
	const data = JSON.parse(msg.data);
	const name = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
	const language = getLanguage(msg.from.language_code);

	if(data.action === 'MathMoreNumber') {
		if(rateLimit.get('BtnMathMoreNumber', msg.from.id)) return telegramBot.answerCallbackQuery(msg.id, {
			text: language.rateLimit
		});
		rateLimit.add('BtnMathMoreNumber', msg.from.id, 5000);
		const expression = msg.message.reply_to_message.text.substring(1, msg.message.reply_to_message.text.length);
		logger.log('notice', 'User %s Used Math More Button(Calculate %s, More Number %s) in %s(%s)', `${name}(${msg.message.from.id})`, expression, data.value, msg.message.chat.title, msg.message.chat.id);
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
						text: language.math.more,
						callback_data: JSON.stringify({ action: 'MathMoreNumber', value: data.value + 1 })
					} ] ] }
				}, options);
				return telegramBot.editMessageText(value, options);
			});
		});
	}

	if(data.action === 'VoteVoting') {
		if(rateLimit.get('BtnVoteVoting', msg.from.id)) return telegramBot.answerCallbackQuery(msg.id, {
			text: language.rateLimit
		});
		rateLimit.add('BtnVoteVoting', msg.from.id);
		logger.log('notice', 'User %s Used Vote Voting Button(Vote to %s, Value %s) in %s(%s)', `${name}(${msg.from.id})`, data.vote, data.value, msg.message.chat.title, msg.message.chat.id);
		database.query('SELECT name, data, closed, deleted FROM vote WHERE id=?', data.vote).then(res => {
			const voteData = JSON.parse(res[0].data);
			if(res[0].closed) return telegramBot.answerCallbackQuery(msg.id, {
				text: language.vote.wasClosed
			});
			if(res[0].deleted) return telegramBot.answerCallbackQuery(msg.id, {
				text: language.vote.wasDeleted
			});
			database.query(`SELECT id FROM voting WHERE voteId=? AND userId=? ORDER BY id DESC LIMIT 1`, [ data.vote, msg.from.id ]).then(res2 => {
				if(res2.length) {
					database.query(`UPDATE voting SET active=0 WHERE id=?`, res2[0].id);
				}
				database.query('UPDATE vote SET count=count+1 WHERE id=?;', data.vote).then(() => {
					database.query('INSERT INTO voting(date, voteId, userId, username, value) VALUES(?, ?, ?, ?, ?);', [
						Date.now(), data.vote, msg.from.id, name, data.value
					]);
					if(voteData.type === 'public' || voteData.type === 'counter') {
						database.query('SELECT username, value FROM voting WHERE voteId=? AND active=1;', data.vote).then(res3 => {
							let selections = [];
							for(let i = 0; i < voteData.selections.length; i++) {
								let q = jsonQuery(`[**][*value=${i}].username`, { data: { data: res3 }}).value;
								selections.push(`<b>${voteData.selections[i]}</b>: ${q.length}${q.length && voteData.type === 'public' ? `(${q.join(', ')})` : ''}`);
							}
							let inlineBtnArr = [];
							for(let i = 0; i < voteData.selections.length; i++) {
								inlineBtnArr.push( [ {
									text: voteData.selections[i],
									callback_data: JSON.stringify({
										action: 'VoteVoting',
										vote: data.vote,
										value: i
									})
								} ] );
							}
							telegramBot.editMessageText(`<b>${res[0].name}</b>\n\n${selections.join('\n')}`, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, parse_mode: 'HTML', reply_to_message_id: msg.message.reply_to_message.message_id, reply_markup: { inline_keyboard: inlineBtnArr }});
						});
					}
					rateLimit.remove('BtnVoteVoting', msg.from.id);
					return telegramBot.answerCallbackQuery(msg.id, {
						text: language.vote.recorded
					});
				});
			});
		});
	}

	if(data.action === 'SchoolChoice') {
		logger.log('notice', 'User %s Used School Choice Button(School %s, Type %s) in %s(%s)', `${name}(${msg.message.from.id})`, data.code, data.type, msg.message.chat.title, msg.message.chat.id);
		schoolMeal.get(data.type, data.code, (err, res) => {
			if(err) return (logger.log('error', err) && bot.sendMessage(msg.chat.id, 'Error!', { reply_to_message_id: msg.message_id }));
			return telegramBot.editMessageText(res, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id });
		});
	}
});

telegramBot.on('polling_error', (e) => {
	logger.log('error', e.stack);
});

process.on('unhandledRejection', (reason, p) => {
	logger.log('error', reason.stack);
  });