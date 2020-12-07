const Config = require('../config');
const Database = require('../modules/Database');
const database = new Database(Config.Database, {
	log: function(){}
});
const jsonQuery = require('json-query');

(async () => {
	try {
		const result = await (new (require('../modules/Covid'))()).getStats();
		const names = jsonQuery('name', { data: result.data });
		const d = await database.query('INSERT INTO covid(names, data, time) VALUES(?, ?, ?)', [ JSON.stringify(names.value), JSON.stringify(result.data), result.time ]);
		process.exit(Number(!d));
	} catch(e) {
		console.error(e);
		process.exit(1);
	}
})();

setTimeout(() => process.exit(1), 600000);