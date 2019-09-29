/**
 * @file KaraokeApi.js
 * @author Hoto Cocoa <cocoa@hoto.us>
 * @license AGPL-3.0
 */

module.exports = class KaraokeApi {
	/**
	 * Get Song List from Provider
	 * @param {String} provider 
	 * @param {String} searchValue 
	 * @returns {(Array|Error)} Result of Search
	 */
	async getSongList(provider = '', searchValue = '') {
		switch(provider) {
			case 'tj':
			case '태진':
				var $ = require('cheerio').load((await require('./AsyncRequest')(`https://www.tjmedia.co.kr/tjsong/song_search_list.asp?strType=0&strText=${encodeURI(searchValue)}`)).body);
				var songsData = [];
				$('#contents > form > #BoardType1 > table > tbody > tr').each((i, e) => {
					var songData = [];
					var needOver60 = false;
					$(e).find('td').each((i, e) => {
						if(e.children[0]) {
							if(e.children[0].data !== '검색결과를 찾을수 없습니다.') songData.push($(e).html().replace(/<span class="txt">/g, '').replace(/<\/span>/g, '').replace('<img class="mr_icon" src="/images/tjsong/60s_icon.png">', () => { needOver60 = true; return ''; }).replace(/&#x([A-Z0-9]{4});/g, (m, p1) => { return String.fromCharCode(`0x${p1}`); }).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, '\''));
						}
					});
					songData.length && songsData.push({
						number: songData.shift(),
						title: songData.shift(),
						singer: songData.shift(),
						lyricist: songData.shift(),
						composer: songData.shift(),
						needOver60
					});
				});
				return songsData.length ? songsData : new Error('NO_RESULT');
			case '금영':
			case 'ky':
				var $ = require('cheerio').load(require('iconv-lite').decode((await require('./AsyncRequest')(`http://www.ikaraoke.kr/isong/search_result.asp?sch_txt=${`%${require('iconv-lite').encode(searchValue, 'EUC-KR').join('%')}`.replace(/%(\d*)/g, (m, p1) => `%${parseInt(p1).toString(16).toUpperCase()}`)}`, null, 'GET', null, null)).body, 'EUC-KR')); // eslint-disable-line no-redeclare
				var songsData = []; // eslint-disable-line no-redeclare
				$('.tbl_board > table > tbody > tr').each((i, e) => {
					if(e.attribs.onmouseover && $(e).find('td.ac').first().text()) {
						songsData.push({
							number: $(e).find('td.ac').first().text(),
							title: $(e).find('td.pl8').first().find('span')[0] && $(e).find('td.pl8').first().find('span')[0].attribs.title ? $(e).find('td.pl8').first().find('span')[0].attribs.title : $(e).find('td.pl8').first().find('a.b')[0].attribs.title,
							singer: $(e).find('.tit').first().text(),
							lyricist: $(e).find('.pl8').last().text().split('<br>')[1],
							composer: $(e).find('.pl8').last().text().split('<br>')[0]
						});
					}
				});
				return songsData.length ? songsData : new Error('NO_RESULT');
			default: return new Error('NO_PROVIDER');
		}
	}
}
