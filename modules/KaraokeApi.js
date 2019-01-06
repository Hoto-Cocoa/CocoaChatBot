const asyncRequest = require('./AsyncRequest');
const cheerio = require('cheerio');

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
			default: return new Error('NO_PROVIDER');
		}
	}
}