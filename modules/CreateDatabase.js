/**
 * @file CreateDatabase.js
 * @author Hoto Cocoa <cocoa@hoto.us>
 * @license AGPL-3.0
 */

const Sequelize = require('sequelize');

/**
 * @param {Object} config
 * @param {Logger} logger
 */
module.exports = (config, logger) => {
	const sequelize = new Sequelize(config.database, config.user, config.password, {
		dialect: 'mysql',
		pool: {
			max: 30,
			min: 0,
			acquire: 30000,
			idle: 10000
		},
		logging: (msg) => {
			logger.log('debug', 'Sequelize Executed "%s"', msg);
		}
	});
	const queryInterface = sequelize.getQueryInterface();

	queryInterface.createTable('vote', {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		date: {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		count: { 
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		groupId:  {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		userId:  {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		username:  {
			type: Sequelize.TEXT,
			allowNull: false
		},
		name:  {
			type: Sequelize.TEXT,
			allowNull: false
		},
		data: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		closed: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		deleted: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	});
	
	queryInterface.createTable('voting', {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		date: {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		voteId: { 
			type: Sequelize.INTEGER,
			allowNull: false
		},
		userId:  {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		username:  {
			type: Sequelize.TEXT,
			allowNull: false
		},
		value: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		active: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: true
		}
	});
	
	queryInterface.createTable('setting', {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		date: {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		userId:  {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		key: { 
			type: Sequelize.TEXT,
			allowNull: false
		},
		value: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		active: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: true
		}
	});
}
