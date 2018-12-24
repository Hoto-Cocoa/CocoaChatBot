module.exports = class RateLimit {
	constructor() {
		this.storage = [];
	}

	add(type, userId, time) {
		if(!this.storage[type]) this.storage[type] = [];
		this.storage[type][userId] = true;
		if(time) setTimeout(() => {
			this.storage[type][userId] = null;
			delete this.storage[type][userId];
		}, time);
	}
	
	get(type, userId) {
		if(!this.storage[type]) this.storage[type] = [];
		return this.storage[type][userId];
	}

	remove(type, userId) {
		this.storage[type][userId] = null;
		delete this.storage[type][userId];
	}
}