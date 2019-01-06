module.exports = (uri = null, headers = {}, method = 'GET', data = null, encoding = 'UTF-8') => {
	return new Promise((resolve, reject) => {
		require('request')({ method, uri, headers, body: data, encoding: encoding }, (error, response, body) => {
			if(error) reject(error);
			resolve({ response, body });
		});
	});
}
