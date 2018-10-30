const mysql = require('mysql2');

module.exports = class Database {
	constructor(config, logger) {
		this.connection = mysql.createConnection(Object.assign(config, { supportBigNumbers: true, bigNumberStrings: true }));
		this.connection.connect((e) => {
			if(e) {
				logger.log('error', e);
				throw e;
			}
			logger.log('notice', 'Connected to Database(#%s)', this.connection.threadId);
			this.connection.query('SET SESSION net_write_timeout=2147483647;');
			this.connection.query('SET SESSION net_read_timeout=2147483647;');
		});
		this.connection.on('error', e => {
			logger.log('error', e);
			if(e.code === 'PROTOCOL_CONNECTION_LOST') {
				constructor(config);
			}
			else throw e;
		});
		setInterval(() => {
			this.connection.query('SELECT 1 LIMIT 1;');
		}, 300);
	}
	query(sql, args) {
		return new Promise((resolve, reject) => {
			this.connection.query(sql, args, (e, r) => {
				if(e) return reject(e);
				resolve(r);
			});
		});
	}
	close() {
		return new Promise((resolve, reject) => {
			this.connection.end(e => {
				if(e) return reject(e);
				resolve();
			});
		});
	}
}
