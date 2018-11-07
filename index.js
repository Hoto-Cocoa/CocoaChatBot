const TelegramBot = require('node-telegram-bot-api');
const google = require('google');
const Logger = require('winston');
const Config = require('./config');
const Sauce = require('sagiri');
const https = require('https');
const math = require('mathjs');
const Database = require('./modules/Database');
const jsonQuery = require('json-query');
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
const sauce = new Sauce(Config.SauceNAO.Token);
const database = new Database(Config.Database, logger);

google.resultsPerPage = 20;
math.config({
	number: 'BigNumber',
	precision: 64
});
require('./modules/CreateDatabase')(Config.Database, logger);

const tmpDir = require('os').tmpdir();

const rateLimit = [];
rateLimit['BtnVoteVoting'] = [];

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
			if((input.match(/!/g) || []).length < 2 && (mathResult = +math.eval(input)) && mathResult !== Infinity && mathResult.toString().search('e') === -1 && input !== 'pi') {
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
		logger.log('notice', 'User %s Used Info Command(Get %s) in %s(%s)', `${username}(${msg.from.id})`, msg.reply_to_message ? msg.reply_to_message.id : msg.message_id, msg.chat.title, msg.chat.id);
		return telegramBot.sendMessage(msg.chat.id, JSON.stringify(msg.reply_to_message ? msg.reply_to_message : msg), { reply_to_message_id: msg.message_id });
	}

	if(msgText.toLowerCase().startsWith('vote ')) {
		var msgArr = msgText.substring(5, msgText.length).split(' ');
		const action = msgArr.shift().toLowerCase();
		var username = msg.from.username ? `@${msg.from.username}` : msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
		msgArr = msgArr.join(' ').split(',');
		for(var i = 0; i < msgArr.length; i++) msgArr[i] = msgArr[i].trim();

		if(action === 'create') {
			logger.log('notice', 'User %s Used Vote Command(Create %s) in %s(%s)', `${username}(${msg.from.id})`, msgArr.join(', '), msg.chat.title, msg.chat.id);
			const name = msgArr.shift();
			database.query('INSERT INTO vote(date, groupId, userId, username, name, data) VALUES(?, ?, ?, ?, ?, ?);', [
				Date.now(), msg.chat.id, msg.from.id, username, name, JSON.stringify({
					selections: msgArr
				})
			]).then(res => {
				return telegramBot.sendMessage(msg.chat.id, `Created vote "${name}"(#${res.insertId}).`, { reply_to_message_id: msg.message_id });
			});
		}

		if(action === 'view') {
			const id = msgArr.shift();
			logger.log('notice', 'User %s Used Vote Command(View %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
			database.query('SELECT * FROM vote WHERE id=?;', id).then(res => {
				if(res[0].deleted) return telegramBot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				const data = JSON.parse(res[0].data);
				var inlineBtnArr = [];
				for(var i = 0; i < data.selections.length; i++) {
					inlineBtnArr.push([{
						text: data.selections[i],
						callback_data: JSON.stringify({
							action: 'VoteVoting',
							vote: id,
							value: i
						})
					}]);
				}
				return telegramBot.sendMessage(msg.chat.id, `<b>${res[0].name}</b>`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: inlineBtnArr }});
			});
		}

		if(action === 'open') {
			const id = msgArr.shift();
			logger.log('notice', 'User %s Used Vote Command(Open %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
			database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id).then(res => {
				if(parseInt(res[0].groupId) !== msg.chat.id) return telegramBot.sendMessage(msg.chat.id, 'This vote not created in this chat. Please execute this command in chat that this vote created.', { reply_to_message_id: msg.message_id });
				if(res[0].deleted) return telegramBot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				if(res[0].closed === 0) return telegramBot.sendMessage(msg.chat.id, 'This vote not closed.', { reply_to_message_id: msg.message_id });
				database.query('UPDATE vote SET closed=0 WHERE id=?;', id).then(() => {
					return telegramBot.sendMessage(msg.chat.id, `Vote ${res[0].name}(#${id}) opened.`, { reply_to_message_id: msg.message_id });
				});
			});
		}

		if(action === 'close') {
			const id = msgArr.shift();
			logger.log('notice', 'User %s Used Vote Command(Close %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
			database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id).then(res => {
				if(parseInt(res[0].groupId) !== msg.chat.id) return telegramBot.sendMessage(msg.chat.id, 'This vote not created in this chat. Please execute this command in chat that this vote created.', { reply_to_message_id: msg.message_id });
				if(res[0].deleted) return telegramBot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				if(res[0].closed === 1) return telegramBot.sendMessage(msg.chat.id, 'This vote already closed.', { reply_to_message_id: msg.message_id });
				database.query('UPDATE vote SET closed=1 WHERE id=?;', id).then(() => {
					return telegramBot.sendMessage(msg.chat.id, `Vote ${res[0].name}(#${id}) closed.`, { reply_to_message_id: msg.message_id });
				});
			});
		}

		if(action === 'result') {
			const id = msgArr.shift();
			logger.log('notice', 'User %s Used Vote Command(Result %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
			database.query('SELECT groupId, name, data, closed, deleted FROM vote WHERE id=?;', id).then(res => {
				if(parseInt(res[0].groupId) !== msg.chat.id) return telegramBot.sendMessage(msg.chat.id, 'This vote not created in this chat. Please execute this command in chat that this vote created.', { reply_to_message_id: msg.message_id });
				if(res[0].deleted) return telegramBot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				var data = JSON.parse(res[0].data);
				var name = res[0].name;
				database.query('SELECT username, value FROM voting WHERE voteId=? AND active=1;', id).then(res => {
					var selections = [];
					for(var i = 0; i < data.selections.length; i++) {
						var q = jsonQuery(`[**][*value=${i}].username`, { data: { data: res }}).value;
						selections.push(`<b>${data.selections[i]}</b>: ${q.length}`);
					}
					return telegramBot.sendMessage(msg.chat.id, `<b>${name}</b>\n\n${selections.join('\n')}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
				});
			});
		}

		if(action === 'aresult') {
			const id = msgArr.shift();
			logger.log('notice', 'User %s Used Vote Command(AResult %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
			database.query('SELECT groupId, name, data, closed, deleted FROM vote WHERE id=?;', id).then(res => {
				if(parseInt(res[0].groupId) !== msg.chat.id) return telegramBot.sendMessage(msg.chat.id, 'This vote not created in this chat. Please execute this command in chat that this vote created.', { reply_to_message_id: msg.message_id });
				if(res[0].deleted) return telegramBot.sendMessage(msg.chat.id, 'This vote was deleted.', { reply_to_message_id: msg.message_id });
				var data = JSON.parse(res[0].data);
				var name = res[0].name;
				database.query('SELECT username, value FROM voting WHERE voteId=? AND active=1;', id).then(res => {
					var selections = [];
					for(var i = 0; i < data.selections.length; i++) {
						var q = jsonQuery(`[**][*value=${i}].username`, { data: { data: res }}).value;
						selections.push(`<b>${data.selections[i]}</b>: ${q.length}${q.length ? `(${q.join(', ')})` : ''}`);
					}
					return telegramBot.sendMessage(msg.chat.id, `<b>${name}</b>\n\n${selections.join('\n')}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
				});
			});
		}

		if(action === 'delete') {
			const id = msgArr.shift();
			logger.log('notice', 'User %s Used Vote Command(Delete %s) in %s(%s)', `${username}(${msg.from.id})`, id, msg.chat.title, msg.chat.id);
			database.query('SELECT groupId, name, closed, deleted FROM vote WHERE id=?;', id).then(res => {
				if(parseInt(res[0].groupId) !== msg.chat.id) return telegramBot.sendMessage(msg.chat.id, 'This vote not created in this chat. Please execute this command in chat that this vote created.', { reply_to_message_id: msg.message_id });
				if(!res[0].closed) return telegramBot.sendMessage(msg.chat.id, 'This vote not closed. Please close vote first.', { reply_to_message_id: msg.message_id });
				if(res[0].deleted) return telegramBot.sendMessage(msg.chat.id, 'This vote already deleted.', { reply_to_message_id: msg.message_id });
				database.query('UPDATE vote SET deleted=1 WHERE id=?;', id).then(() => {
					return telegramBot.sendMessage(msg.chat.id, `Vote ${res[0].name}(#${id}) deleted.`, { reply_to_message_id: msg.message_id });
				});
			});
		}
	}

	if(msgText.startsWith('school ')) {
		const msgArr = msgText.substring(7, msgText.length).split(' ');
		logger.log('notice', 'User %s Used School Command(Get %s of %s %s) in %s(%s)', `${username}(${msg.from.id})`, msgArr[0], msgArr[1], msgArr[2], msg.chat.title, msg.chat.id);
		schoolMeal(msgArr[0], msgArr[1], msgArr[2], (err, res) => {
			if(err) return (logger.log('error', err) && telegramBot.sendMessage(msg.chat.id, 'Error!', { reply_to_message_id: msg.message_id }));
			return telegramBot.sendMessage(msg.chat.id, res, { reply_to_message_id: msg.message_id });
		})
	}
});

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
});

telegramBot.on('polling_error', (e) => {
	logger.log('error', e);
});