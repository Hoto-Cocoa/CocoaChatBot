module.exports = (uri, headers, method, data) => {
	return new Promise((resolve, reject) => {
		uri = require('url').parse(uri);
		headers = headers ? headers : {};
		data = typeof data === Object ? JSON.stringify(data) : data;
		try { headers['Content-Length'] = Buffer.byteLength(data); }
		catch(e) { headers['Content-Length'] = 0; }

		const postOptions = {
			protocol: uri.protocol,
			host: uri.host,
			port: uri.port ? uri.port : uri.protocol === 'http:' ? 80 : uri.protocol === 'https:' ? 443 : 0,
			path: uri.path,
			method: method ? method : 'GET',
			headers: headers
		};
		
		const req = require(uri.protocol.substring(0, uri.protocol.length - 1)).request(postOptions, function(res) {
			var data = '';
			res.setEncoding('utf8');
			res.on('data', resData => data += resData);
			res.on('end', () => resolve(data));
			res.on('error', error => reject(error));
		});

		data && req.write(data);
		req.end();
	});
}