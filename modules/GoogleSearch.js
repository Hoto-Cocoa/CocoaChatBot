/**
 * @file GoogleSearch.js
 * @author Hoto Cocoa <cocoa@hoto.us>
 * @license AGPL-3.0
 */

module.exports = class GoogleSearch {
	/**
	 * @param {Number} maxResultCount 
	 */
	constructor(maxResultCount = 10) {
		this.maxResultCount = maxResultCount;
	}

	/**
	 * @param {String} searchValue 
	 */
	async getResult(searchValue = '') {
		return new Promise(async (resolve) => {
			const { body } = await require('./AsyncRequest')(`https://www.google.com/search?hl=en&q=${encodeURI(searchValue)}&sa=N&num=${this.maxResultCount}&ie=UTF-8&oe=UTF-8&gws_rd=ssl`, { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36' });
			const $ = require('cheerio').load(body);
			var result = [];
			$('div.g').each((i, e) => {
				$(e).find('h3.LC20lb').first().text() && result.push({
					index: i,
					title: $(e).find('h3.LC20lb').first().text(),
					href: $(e).find('div.yuRUbf a').first().attr('href'),
					description: $(e).find('span.aCOpRe').first().text()
				});
			}); 
			resolve(result);
		});
	}
}
