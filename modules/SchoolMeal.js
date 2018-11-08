const schoolApi = require('calcium');
const https = require('https');

module.exports.find = (location, name, callback) => {
	if(name.length < 2) return callback(null, 'Too short school name!', null);
	return schoolApi.find(location, name, (err, res) => {
		if(err) return callback(err, null, null);
		if(res.length === 0) return callback(null, 'No such school!', []);
		// if(/^[ALOU-Z][0-9]{9}$/.test(res[0].code)) return callback(null, `Not supported school! (Type: ${res[0].code.substring(0, 1)})`);
		return callback(null, null, res);
	});
}

module.exports.get = (type, code, callback) => {
	if(code === 'J100000855') {
		return https.get(`https://dev-api.dimigo.in/dimibobs/${(new Date().toISOString()).substring(0, 10)}`, res => {
			var json = '';
			res.on('data', data => {
				json += data;
			});
			res.on('end', () => {
				json = JSON.parse(json);
				if(!json || !json[type] || type === 'date') return callback(null, 'No data!');
				return callback(null, json[type]);
			});
		});
	}
	return schoolApi.get(code, (err, res) => {
		if(err) return callback(err, null);
		if(!res || !res[(new Date().getDate())] || !res[(new Date().getDate())][type]) return callback(null, 'No data!');
		return callback(null, res[(new Date().getDate())][type].join('/').replace('&amp;', '&'));
	});
}