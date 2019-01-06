/**
 * @file RateLimit.js
 * @author Hoto Cocoa <cocoa@hoto.us>
 * @license AGPL-3.0
 */

module.exports = class RateLimit {
	constructor() {
		this.storage = [];
	}

	/**
	 * @param {String} type 
	 * @param {Number} userId 
	 * @param {Number} time 
	 */
	add(type, userId, time) {
		if(!this.storage[type]) this.storage[type] = [];
		this.storage[type][userId] = true;
		if(time) setTimeout(() => {
			this.storage[type][userId] = null;
			delete this.storage[type][userId];
		}, time);
	}
	
	/**
	 * @param {String} type 
	 * @param {Number} userId 
	 */
	get(type, userId) {
		if(!this.storage[type]) this.storage[type] = [];
		return this.storage[type][userId];
	}

	/**
	 * @param {String} type 
	 * @param {Number} userId 
	 */
	remove(type, userId) {
		this.storage[type][userId] = null;
		delete this.storage[type][userId];
	}
}