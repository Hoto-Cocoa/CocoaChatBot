/**
 * @file SweetTracker.js
 * @author Hoto Cocoa <cocoa@hoto.us>
 * @license AGPL-3.0
 */

const courierList = require('./SweetTrackerCourierList');

module.exports = class SweetTracker {
	/**
	 * @param {String} key 
	 */
	constructor(key) {
		this.key = key;
	}

	getCourierList() {
		return Object.keys(courierList);
	}

	/**
	 * @param {String} courierName 
	 * @returns {(String|Error)}
	 */
	getCourierCode(courierName = '') {
		for(var i in this.getCourierList()) {
			if(this.getCourierList()[i].toLowerCase() === courierName.toLowerCase()) return this.getCourierList()[i].code;
			else if(this.getCourierList().filter(courier => { for(var o in courierList[courier].alias) return courierList[courier].alias[o].toLowerCase() === courierName.toLowerCase() })[0]) return courierList[this.getCourierList().filter(courier => { for(var o in courierList[courier].alias) return courierList[courier].alias[o].toLowerCase() === courierName.toLowerCase() })[0]].code;
		}
		return new Error('NO_COURIER');
	}

	/**
	 * @param {String} courier 
	 * @param {String} code 
	 * @returns {Object}
	 */
	async getTrackingInfo(courier = '', code = '') {
		const courierCode = this.getCourierCode(courier);
		return courierCode instanceof Error ? courierCode : JSON.parse(await require('./AsyncRequest')(`https://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=${this.key}&t_code=${courierCode}&t_invoice=${code}`));
	}
}
