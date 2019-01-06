const karaokeApi = new (require('../modules/KaraokeApi'))();

(async function func() { console.log(await karaokeApi.getSongList('ky', 'Cafe')); })();