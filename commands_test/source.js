module.exports = async (utils) => {
	const result = await require('../new_commands/source')({
		message_id: 1, from: {
			id: 1,
			username: 'Hoto_Cocoa'
		}, chat: {
			id: -1,
			title: "CocoaChatBotTest"
		}, date: 1, photo: [ {
			file_id: 'AgADBQADXqgxGyEPmFYWir00SGuObEtV2zIABJ6UzlOba7eqEFoDAAEC',
			file_size: 1298,
			width: 82,
			height: 90
		} ], caption: 'Test Image'
	}, null, utils);
	return !!result.message;
}