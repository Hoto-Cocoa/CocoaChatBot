const asyncRequest = require('./AsyncRequest');
const cheerio = require('cheerio')
const util = require('util');

module.exports = class GoogleSearch {
	constructor(maxResultCount = 10) {
		this.maxResultCount = maxResultCount;
	}

	async getResult(searchValue = '') {
		return new Promise(async (resolve) => {
			const $ = cheerio.load((await asyncRequest(util.format('https://www.google.com/search?hl=en&q=%s&sa=N&num=%s&ie=UTF-8&oe=UTF-8&gws_rd=ssl', encodeURI(searchValue), this.maxResultCount))).body);
			var result = [];
			$('div.g').each((i, e) => {
				$(e).find('h3.r a')[0] && result.push({
					index: i,
					title: $(e).find('h3.r a').first().text(),
					href: $(e).find('h3.r a')[0].attribs.href.replace(/(?:\/url\?q=)?(.*?)(?:&sa=.*)/, '$1'),
					description: $(e).find('div.s').find('span.st').text()
				});
			});
			resolve(result);
		});
	}
}
