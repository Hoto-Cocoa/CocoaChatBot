## CocoaChatBot
Cocoa Telegram Chat Bot.

## Functions
* You can get message by provide Message ID.
* You can use WolframAlpha using this bot.
* You can search Song ID in Korean Karaoke.
And more!

## Config
```json
{
	"Telegram": {
		"Token": "Bot Token",
		"Owner": 183878479, // Id of user who managing the bot server.
		"Prefix": "!" // Leaving empty this config to no prefix.
	},
	"SauceNAO": {
		"Token": "SauceNAO Token"
	},
	"Wolfram": {
		"Token": "WolframAlpha API Token"
	},
	"Database": { // MySQL-comp Database cred for vote, setting function.
		"user": "cocoa",
		"password": "password",
		"database": "bot",
		"host": "locahost"
	},
	"BannedWords": [
		"If you want block some words in math function, add that in this array."
	],
	"Track": {
		"Token": "SweetTracker API Token"
	}
}
```

## Note
This bot will record all chat histories to `debug.log`. You can make link that file to `/dev/null/` to block logging.

## License
This code under [AGPL-3.0](/LICENSE) License.
