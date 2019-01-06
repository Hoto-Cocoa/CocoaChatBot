const asyncRequest = require('./AsyncRequest');
const cheerio = require('cheerio');
// const iconv = require('iconv-lite');

module.exports = class KaraokeApi {
	async getSongList(provider = '', searchValue = '') {
		switch(provider) {
			case 'tj':
			case '태진':
				var $ = cheerio.load((await asyncRequest(`https://www.tjmedia.co.kr/tjsong/song_search_list.asp?strType=0&strText=${searchValue}&strCond=0&strSize01=100&strSize02=100&strSize03=100&strSize04=100&strSize05=100`)).body);
				var data = $('#contents > form > #BoardType1 > table > tbody > tr');
				var songsData = [];
				data.each((i, e) => {
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
						needOver60,
						addedDate: null
					});
				});
				return songsData.length ? songsData : new Error('NO_RESULT');
			// case '금영':
			// case 'ky':
			// 	var $ = cheerio.load(iconv.decode((await asyncRequest(`http://www.ikaraoke.kr/isong/search_result.asp?sch_txt=${searchValue.replace(/([가-힣ㄱ-ㅎㅏ-ㅣ])/g, (m, p1) => iconv.encode(new Buffer(p1), 'EUC-KR')).replace(/(\d*)/g, (m, p1) => p1 === '' ? '' : `%${parseInt(p1).toString(16).toUpperCase()}`).replace(/ /g, '')}`, null, 'GET', null, null)).body, 'EUC-KR'));
			// 	var data = $('.tbl_board > table > tbody > tr');
			// 	var songsData = [];
			// 	data.each((i, e) => {
			// 		console.log(i);
			// 		if(e.attribs.onmouseover) {
			// 			songsData.push({
			// 				number: $(e).find('td.ac').first().text(),
			// 				title: $(e).find('td.pl8').first().find('span')[0] && $(e).find('td.pl8').first().find('span')[0].attribs.title ? $(e).find('td.pl8').first().find('span')[0].attribs.title : $(e).find('td.pl8').first().find('a.b')[0].attribs.title
			// 			});
			// 		}
			// 	});
			// 	return songsData.length ? songsData : new Error('NO_RESULT');
			default: return new Error('NO_PROVIDER');
		}
	}
}