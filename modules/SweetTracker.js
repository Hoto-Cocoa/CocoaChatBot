const courierList = require('./SweetTrackerCourierList'), asyncRequest = require('./AsyncRequest');

module.exports = class SweetTracker {
	constructor(key) {
		this.key = key;
	}

	getCourierList() {
		return Object.keys(courierList);
	}

	getCourierCode(courierName = '') {
		for(var i in this.getCourierList()) {
			if(this.getCourierList()[i].toLowerCase() === courierName.toLowerCase()) return this.getCourierList()[i].code;
			else if(this.getCourierList().filter(courier => { for(var o in courierList[courier].alias) return courierList[courier].alias[o].toLowerCase() === courierName.toLowerCase() })[0]) return courierList[this.getCourierList().filter(courier => { for(var o in courierList[courier].alias) return courierList[courier].alias[o].toLowerCase() === courierName.toLowerCase() })[0]].code;
		}
		return new Error('NO_COURIER');
	}

	async getTrackingInfo(courier = '', code = '') {
		const courierCode = this.getCourierCode(courier);
		if(courierCode instanceof Error) return courierCode;
		return (await asyncRequest(`https://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=${this.key}&t_code=${courierCode}&t_invoice=${code}`)).body;
	}
}
