const asyncR = require('./AsyncRequest');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
// const cheerio = require('cheerio');

/**
 * @file Covid.js
 * @author Hoto Cocoa <cocoa@hoto.us>
 * @license AGPL-3.0
 */

module.exports = class CovidApi {
	/**
	 * Get Song List from Provider
	 * @param {String} country 
	 * @returns {Number} Result of Search
	 */
	async getStats() {
		let data = [];
		const { body } = await asyncR('https://www.worldometers.info/coronavirus/');
		const { window } = new JSDOM(body);
		const tbody = window.document.querySelectorAll('tbody')[0];
		const time = (new Date(window.document.querySelectorAll('.content-inner div')[1].textContent.substring(14))).toISOString();
		const tr = tbody.querySelectorAll('tr');
		for(let i = 0; i < tr.length; i++) {
			const thisV = tr[i].children;
			let obj = {};
			obj.name = thisV[0].textContent.trim();
			obj.count = Number(thisV[1].textContent.trim().replace(/\,/g, ''));
			obj.death = Number(thisV[3].textContent.trim().replace(/\,/g, ''));
			obj.active = Number(thisV[5].textContent.trim().replace(/\,/g, ''));
			obj.release = Number(thisV[6].textContent.trim().replace(/\,/g, ''));
			data.push(obj);
		}
		return { data, time };
	}
}
