const bot = new (require('node-telegram-bot-api'))(require('../config').Telegram.Token, { polling: true });
const database = new (require('../modules/Database'))(require('../config').Database);
const language = new (require('../modules/Language'))(database);
const rateLimit =  new (require('../modules/RateLimit'))();
require('../modules/CreateDatabase')(require('../config').Database);

const getErrList = () => new Promise(resolve => resolve(Promise.all(require('fs').readdirSync(__dirname).map(async file => {
	if(file === 'index.js') return null;
	if(!await require(`${__dirname}/${file}`)({ bot, database, language, rateLimit })) return file.substring(0, file.length - 3);
	else return null; 
}))));

getErrList().then(list => {
	list = list.filter(e => e);
	if(list.length) console.log(`Error in those commands:\n\t${list.join('\n\t')}`) & process.exit(1); // eslint-disable-line no-console
	else process.exit(0);
});
