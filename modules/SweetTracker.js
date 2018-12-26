const asyncRequest = async function(uri, headers, method, data) {
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
			res.on('data', function(resData) {
				data += resData;
			});
			res.on('end', function() {
				resolve(data);
			});
			res.on('error', function(error) {
				reject(error);
			});
		});

		data && req.write(data);
		req.end();
	});
}

const courierList = {
	'건영택배': {
		alias: ['건영'],
		code: '18'
	},
	'경동택배': {
		alias: ['경동'],
		code: '23'
	},
	'홈픽택배': {
		alias: ['홈픽'],
		code: '54'
	},
	'굿투럭': {
		alias: [],
		code: '40'
	},
	'농협택배': {
		alias: ['농협'],
		code: '53'
	},
	'대신택배': {
		alias: ['대신'],
		code: '22'
	},
	'로젠택배': {
		alias: ['로젠'],
		code: '06'
	},
	'롯데택배': {
		alias: ['롯데'],
		code: '08'
	},
	'세방': {
		alias: [],
		code: '52'
	},
	'애니트랙': {
		alias: [],
		code: '43'
	},
	'우체국택배': {
		alias: ['우체국'],
		code: '01'
	},
	'일양로지스': {
		alias: [],
		code: '11'
	},
	'천일택배': {
		alias: ['천일'],
		code: '17'
	},
	'한덱스': {
		alias: [],
		code: '20'
	},
	'한의사랑택배': {
		alias: ['한의사랑'],
		code: '16'
	},
	'한진택배': {
		alias: ['한진'],
		code: '05'
	},
	'합동택배': {
		alias: ['합동'],
		code: '32'
	},
	'호남택배': {
		alias: ['호남'],
		code: '45'
	},
	'CJ대한통운': {
		alias: ['CJ', '대한', '대한통운'],
		code: '04'
	},
	'CU편의점택배': {
		alias: ['CU', 'CU편의점', 'CU택배'],
		code: '46'
	},
	'CVSnet 편의점택배': {
		alias: ['CVSnet'],
		code: '24'
	},
	'KGB택배': {
		alias: ['KGB'],
		code: '56'
	},
	'KGL네트웍스': {
		alias: [],
		code: '30'
	},
	'SLX': {
		alias: [],
		code: '44'
	},
	'하이택배': {
		alias: ['하이'],
		code: '58'
	},		
	'롯데글로벌 로지스': {
		alias: [],
		code: '99'
	},
	'범한판토스': {
		alias: [],
		code: '37'
	},
	'에어보이익스프레스': {
		alias: [],
		code: '29'
	},
	'APEX(ECMS Express)': {
		alias: [],
		code: '38'
	},
	'CJ대한통운 국제특송': {
		alias: [],
		code: '42'
	},
	'Cway Express': {
		alias: [],
		code: '57'
	},
	'DHL': {
		alias: [],
		code: '13'
	},
	'DHL Global Mail': {
		alias: [],
		code: '33'
	},
	'EMS': {
		alias: [],
		code: '12'
	},
	'Fedex': {
		alias: [],
		code: '21'
	},
	'GSI Express': {
		alias: [],
		code: '41'
	},
	'GSMNtoN(인로스)': {
		alias: [],
		code: '28'
	},
	'i-Parcel': {
		alias: [],
		code: '34'
	},
	'TNT Express': {
		alias: [],
		code: '25'
	},
	'EuroParcel': {
		alias: ['유로택배'],
		code: '55'
	},
	'UPS': {
		alias: [],
		code: '14'
	},
	'USPS': {
		alias: [],
		code: '26'
	}
}

module.exports = class SweetTracker {
	constructor(key) {
		this.key = key;
	}

	getCourierList() {
		return Object.keys(courierList);
	}

	getCourierCode(courierName) {
		if(this.getCourierList().includes(courierName)) return courierList[courierName].code;
		if(this.getCourierList().filter(courier => courierList[courier].alias.includes(courierName))[0]) return courierList[this.getCourierList().filter(courier => courierList[courier].alias.includes(courierName))[0]].code;
		return false;
	}

	async getTrackingInfo(courier, code) {
		const courierCode = this.getCourierCode(courier);
		if(!courierCode) return false;
		const result = await asyncRequest(`https://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=${this.key}&t_code=${courierCode}&t_invoice=${code}`);
		return JSON.parse(result);
	}

}