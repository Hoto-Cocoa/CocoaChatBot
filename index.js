const TelegramBot = require('node-telegram-bot-api');
const Logger = require('winston');
const Config = require('./config');
const https = require('https');
const Database = require('./modules/Database');
const SchoolMeal = require('./modules/SchoolMeal');
const jsonQuery = require('json-query');
const Language = require('./modules/Language');
const RateLimit = require('./modules/RateLimit');
const Events = require('events');
const asyncRequest = require('./modules/AsyncRequest');

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
const schoolMeal = new SchoolMeal();
const telegramEvents = new Events();

require('./modules/CreateDatabase')(Config.Database, logger);

telegramBot.on('message', msg => {
	const msgText = msg.text ? msg.text : msg.caption ? msg.caption : '';
	const username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
	logger.log('debug', 'User %s Said "%s" in %s(%s)', `${username}(${msg.from.id})`, msgText, msg.chat.title, msg.chat.id);
	if(msgText.startsWith(Config.Telegram.Prefix ? Config.Telegram.Prefix : '')) {
		if(msg.text) msg.text = msg.text.substring(Config.Telegram.Prefix ? Config.Telegram.Prefix.length : 0);
		if(msg.caption) msg.text = msg.caption.substring(Config.Telegram.Prefix ? Config.Telegram.Prefix.length : 0) && delete msg.caption;
		if(!msg.text) msg.text = '';
		msg.from.parsed_username = username;
		telegramEvents.emit('message', msg);
	}
});
require('./commands/index')({ bot: telegramBot, events: telegramEvents }, logger, { database, rateLimit, language });

telegramBot.on('callback_query', async msg => {
	const data = JSON.parse(msg.data);
	const name = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;

	if(data.action === 'MathMoreNumber') {
		const getLanguage = await language.getLanguage(msg.from.language_code, msg.from.id, 'math'), languageData = await language.getLanguageData(msg.from.language_code, msg.from.id);
		if(rateLimit.get('BtnMathMoreNumber', msg.from.id)) return telegramBot.answerCallbackQuery(msg.id, {
			text: languageData.rateLimit
		});
		rateLimit.add('BtnMathMoreNumber', msg.from.id, 5000);
		const expression = msg.message.reply_to_message.text.substring(1, msg.message.reply_to_message.text.length);
		const result = JSON.parse(await asyncRequest(`https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(expression)}&primary=true&appid=${Config.Wolfram.Token}&podstate=${data.value}@Result__More+digits&podstate=${data.value}@DecimalApproximation__More+digits&format=plaintext&output=json&podtitle=Result&podtitle=Decimal%20approximation&podtitle=Power%20of%2010%20representation&podtitle=Exact%20result`));
		const value = result.queryresult.pods[0].subpods[0].plaintext;
		var options = { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id };
		if(data.value < 10 && result.queryresult.pods[0].states && (result.queryresult.pods[0].states[0].name === 'More digits' || result.queryresult.pods[0].states.length > 1)) options = Object.assign({
			reply_markup: { inline_keyboard: [ [ {
				text: getLanguage('more'),
				callback_data: JSON.stringify({ action: 'MathMoreNumber', value: data.value + 1 })
			} ] ] }
		}, options);
		return telegramBot.editMessageText(value, options);
	}

	if(data.action === 'VoteVoting') {
		const getLanguage = await language.getLanguage(msg.from.language_code, msg.from.id, 'vote'), languageData = await language.getLanguageData(msg.from.language_code, msg.from.id);
		if(rateLimit.get('BtnVoteVoting', msg.from.id)) return telegramBot.answerCallbackQuery(msg.id, {
			text: languageData.rateLimit
		});
		rateLimit.add('BtnVoteVoting', msg.from.id);
		logger.log('notice', 'User %s Used Vote Voting Button(Vote to %s, Value %s) in %s(%s)', `${name}(${msg.from.id})`, data.vote, data.value, msg.message.chat.title, msg.message.chat.id);
		var voteData = await database.query('SELECT name, data, closed, deleted FROM vote WHERE id=?', data.vote);
		const votingId = await database.query('SELECT id FROM voting WHERE voteId=? AND userId=? ORDER BY id DESC LIMIT 1', [ data.vote, msg.from.id ]);
		voteData.data = JSON.parse(voteData.data);
		if(voteData.closed) return telegramBot.answerCallbackQuery(msg.id, { text: getLanguage('wasClosed')});
		if(voteData.deleted) return telegramBot.answerCallbackQuery(msg.id, { text: getLanguage('wasDeleted')});
		if(votingId) database.query('UPDATE voting SET active=0 WHERE id=?', votingId);
		database.query('UPDATE vote SET count=count+1 WHERE id=?;', data.vote);
		database.query('INSERT INTO voting(date, voteId, userId, username, value) VALUES(?, ?, ?, ?, ?);', [
			Date.now(), data.vote, msg.from.id, name, data.value
		]).then(() => {
			if(voteData.data.type === 'public' || voteData.data.type === 'counter') {
				database.query('SELECT username, value FROM voting WHERE voteId=? AND active=1;', data.vote).then(res3 => {
					let selections = [];
					for(let i = 0; i < voteData.data.selections.length; i++) {
						let q = jsonQuery(`[**][*value=${i}].username`, { data: { data: res3 }}).value;
						selections.push(`<b>${voteData.data.selections[i]}</b>: ${q.length}${q.length && voteData.data.type === 'public' ? `(${q.join(', ')})` : ''}`);
					}
					let inlineBtnArr = [];
					for(let i = 0; i < voteData.data.selections.length; i++) {
						inlineBtnArr.push( [ {
							text: voteData.data.selections[i],
							callback_data: JSON.stringify({
								action: 'VoteVoting',
								vote: data.vote,
								value: i
							})
						} ] );
					}
					telegramBot.editMessageText(`<b>${voteData.name}</b>\n\n${selections.join('\n')}`, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, parse_mode: 'HTML', reply_to_message_id: msg.message.reply_to_message.message_id, reply_markup: { inline_keyboard: inlineBtnArr }});
				});
			}
			rateLimit.remove('BtnVoteVoting', msg.from.id);
			return telegramBot.answerCallbackQuery(msg.id, {
				text: getLanguage('recorded')
			});
		});
	}

	if(data.action === 'SchoolChoice') {
		logger.log('notice', 'User %s Used School Choice Button(School %s, Type %s) in %s(%s)', `${name}(${msg.message.from.id})`, data.code, data.type, msg.message.chat.title, msg.message.chat.id);
		const meal = await schoolMeal.getMeal(data.type, data.code).catch(e => {
			switch(e) {
				case 'NOT_SUPPORTED': telegramBot.editMessageText(`Not supported school! (Type: ${data.code.substring(0, 1)})`, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id }); break;
				case 'NO_DATA': telegramBot.editMessageText('No data!', { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id }); break;
				default: logger.log('error', e) && telegramBot.editMessageText('ERROR!', { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id });
			}
		});
		if(meal) return telegramBot.editMessageText(meal, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_to_message_id: msg.message.reply_to_message.message_id });
	}
});

telegramBot.on('polling_error', (e) => {
	logger.log('error', e.stack);
});

process.on('unhandledRejection', (reason, p) => {
	logger.log('error', reason.stack);
  });