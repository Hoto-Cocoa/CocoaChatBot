const courierList = require('./SweetTrackerCourierList'), asyncRequest = require('./AsyncRequest');

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
