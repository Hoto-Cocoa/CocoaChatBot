const exec = require('util').promisify(require('child_process').exec), owner = require('../config').Telegram.Owner, netInterfaceList = require('os').networkInterfaces();

module.exports = {
	title: 'Admin Command',
	description: 'Commmands that can use only admins.',
	subcommands: {
		exec: 'Execute the command to application server.',
		ip: 'Get server network interface address information.'
	},
	alias: 'admin',
	function: async (msg, logger) => {
		var msgArr = msg.command_text.substring(6).split(' ');
		const action = msgArr.shift().toLowerCase();
		const actions = {
			exec: async () => {
				logger.log('notice', 'User %s Used Admin Command(Exec %s) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msgArr.join(' '), msg.chat.title, msg.chat.id);
				const result = await exec(process.platform === 'win32' ? `bash -c "${msgArr.join(' ')}"` : msgArr.join(' '), { stdio: 'inherit' }).catch((e) => { return e; });
				if(result.stdout) return { message: result.stdout };
				if(result.stderr) return { message: result.stderr };
				return { message: 'No STDOUT/STDERR.' };
			},
			ip: () => {
				logger.log('notice', 'User %s Used Admin Command(See IP) in %s(%s)', `${msg.from.parsed_username}(${msg.from.id})`, msg.chat.title, msg.chat.id);
				var toSendArr = [];
				Object.keys(netInterfaceList).forEach((interfaceName) => netInterfaceList[interfaceName].forEach((data) => toSendArr.push(`${interfaceName}: ${data.address}`)));
				return { message: toSendArr.join('\n') };
			}
		}
		if(Object.keys(actions).includes(action)) {
			if(msg.from.id !== owner) return { message: 'https://www.youtube.com/watch?v=4B5BauNBH0A' };
			return actions[action]();
		}
	}
}