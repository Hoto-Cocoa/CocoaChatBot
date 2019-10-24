/**
 * @file SchoolMeal.js
 * @author Hoto Cocoa <cocoa@hoto.us>
 * @license AGPL-3.0
 */

const schoolApi = require('calcium');

module.exports = class SchoolMeal {
	/**
	 * @param {String} location 
	 * @param {String} name 
	 */
	findSchool(location, name) {
		return new Promise((resolve, reject) => {
			if(name.length < 2) reject('SHORT_NAME')
			schoolApi.find(location, name, (err, res) => {
				if(err) {
					if(err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || err.message.startsWith('Hostname/IP doesn\'t match certificate\'s altnames')) return reject('SSL_CERTIFICATE_ERROR');
					if(err.message.startsWith('No such department')) return reject('NO_SUCH_DEPARTMENT');
					return reject(err);
				}
				if(!res || !res.length) return reject('NO_SUCH_SCHOOL');
				let result = [];
				for(var i = 0; i < res.length; i++) if(res[i].name.search('유치원') === -1) result.push(res[i]);
				return resolve(result);
			});
		});
	}

	/**
	 * @param {String} type 
	 * @param {Sting} code 
	 */
	getMeal(type, code) {
		return new Promise(async (resolve, reject) => {
			if(/^[ALOU-Z][0-9]{9}$/.test(code)) return reject(`NOT_SUPPORTED`);
			if(code === 'J100000855') {
				if(type === 'date') return reject('NO_DATA');
				let result = JSON.parse((await require('./AsyncRequest')(`https://dev-api.dimigo.in/dimibobs/${(new Date().toISOString()).substring(0, 10)}`)).body);
				return (!result || !result[type]) ? reject('NO_DATA') : resolve(result[type]);
			}
			schoolApi.get(code, (err, res) => {
				if(err) return reject(err);
				if(!res || !res[(new Date().getDate())] || !res[(new Date().getDate())][type]) return reject('NO_DATA');
				return resolve(res[(new Date().getDate())][type].join('/').replace(/&amp;/g, '&'));
			});
		});
	}
}
