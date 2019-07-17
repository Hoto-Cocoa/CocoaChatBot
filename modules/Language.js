/**
 * @file Language.js
 * @author Hoto Cocoa <cocoa@hoto.us>
 * @license AGPL-3.0
 */

module.exports = class Language {
	/**
	 * @param {Database} database 
	 */
	constructor(database) {
		this.languages = [], this.database = database;
		require('fs').readdirSync(__dirname + '/../languages/').forEach(file => file === '.git' || (this.languages[file.substring(0, file.length - 5)] = require(`${__dirname}/../languages/${file}`)));
	}

	/**
	 * @param {String} langCode 
	 * @param {Number} userId 
	 * @param {String} msgCategory 
	 */
	async getLanguage(langCode, userId, msgCategory) {
		var languageSetting = await this.database.query('SELECT value FROM setting WHERE userId=? AND `key`="language" ORDER BY id DESC LIMIT 1;', userId);
		langCode = languageSetting ? languageSetting : langCode ? langCode.substring(0, 2) : 'en';
		var languageData = this.languages[langCode] ? this.languages[langCode] : this.languages['en'];
		return (msgCode, ...args) => {
			var msg = languageData[msgCategory] ? languageData[msgCategory][msgCode] ? languageData[msgCategory][msgCode] : this.languages['en'][msgCategory][msgCode] ? this.languages['en'][msgCategory][msgCode] : msgCode : this.languages['en'][msgCategory] ? this.languages['en'][msgCategory][msgCode] ? this.languages['en'][msgCategory][msgCode] : msgCode : msgCode;
			return args ? require('util').format(msg, ...args) : msg;
		}
	}

	/**
	 * 
	 * @param {String} language 
	 * @param {Number} userId 
	 */
	async getLanguageData(language, userId) {
		var languageSetting = await this.database.query('SELECT value FROM setting WHERE userId=? AND `key`="language" ORDER BY id DESC LIMIT 1;', userId);
		language = languageSetting ? languageSetting : language ? language.substring(0, 2) : 'en';
		return this.languages[language] ? this.languages[language] : this.languages['en'];
	}
}