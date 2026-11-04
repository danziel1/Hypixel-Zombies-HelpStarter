var fs = require('fs');
var path = require('path');
var mineflayer = require('mineflayer');
const { userInfo } = require('os');

var host = 'hypixel.net';
var port = parseInt(process.env.MC_PORT || '25565', 10);
var version = process.env.MC_VERSION || '1.8.9';
var forcedAuth = process.env.MC_AUTH ? process.env.MC_AUTH.toLowerCase() : null;
var joinDelayMs = 5000;
var accountsFile = path.join(__dirname, 'accountList.txt');
var whitelistFile = path.join(__dirname, 'whitelist.txt');
var profilesFolder = path.join(__dirname, 'profiles');

function readAccounts(filePath) {
	var content;
	var lines;
	var results;
	var i;
	var line;

	if (!fs.existsSync(filePath)) {
		throw new Error('Missing accounts file: ' + filePath);
	}

	content = fs.readFileSync(filePath, 'utf8');
	lines = content.split(/\r?\n/);
	results = [];

	for (i = 0; i < lines.length; i++) {
		line = lines[i].trim();
		if (line.length > 0 && line.charAt(0) !== '#') {
			results.push(line);
		}
	}

	return results;
}

function getWhitelist() {
	var content;
	var lines;
	var results;
	var i;
	var line;

	content = fs.readFileSync(whitelistFile, 'utf8');
	lines = content.split(/\r?\n/);
	results = [];

	for (i = 0; i < lines.length; i++) {
		line = lines[i].trim();
		if (line.length > 0 && line.charAt(0) !== '#') {
			results.push(line.toLowerCase());
		}
	}

	return results;
}

function createBot(accountId, index) {
	var auth = forcedAuth || (accountId.indexOf('@') !== -1 ? 'microsoft' : 'offline');
	var bot = mineflayer.createBot({
		host,
		port,
		version,
		username: accountId,
		auth,
		profilesFolder,
	});
	bot.once('spawn', function () {
		console.log('[' + (index + 1) + '] ' + accountId + ' joined ' + host + ':' + port + ' on ' + version);
	});
	bot.on('kicked', function (reason) {
		console.log('[' + (index + 1) + '] ' + accountId + ' kicked:', reason);
		if (reason.includes("authenticate your connection")) {
			createBot(accountId, index)
		}
	});
	bot.on('error', function (error) {
		console.log('[' + (index + 1) + '] ' + accountId + ' error:', error.message);
	});
	bot.on('end', function () {
		console.log('[' + (index + 1) + '] ' + accountId + ' disconnected');
	});

	bot.on('message', function (message) {
        message = String(message)
        var whitelist = getWhitelist()
		// ratqueenlol has invited you to join their party!
		// You have 60 seconds to accept. Click here to join!

		// [VIP+] xMoid has invited you to join ratqueenlol's party!
		// You have 60 seconds to accept. Click here to join!
        if (message.includes(' has invited you to join')) {
			var user = message.split(' ')[0].toLowerCase()
			console.log(user)
			if (user.includes(']')) {
				user = message.split(' ')[1].toLowerCase()
				console.log(user)
			}
            if (whitelist.includes(user)) {
				setTimeout(function() {
					bot.chat('/p accept '+user)
					console.log('[' + (index + 1) + '] ' + accountId + ' accepted party invite from ' + user);
				}, 1000);
            }
        }

        if (message.includes('The game starts in 1 second!')) {
			setTimeout(function() {
				bot.chat('/l');
			}, 3500);
			setTimeout(function() {
				bot.chat('/p leave');
				console.log('[' + (index + 1) + '] ' + accountId + ' left the party');
			}, 5500);
        }
		if (message.includes('!send ')) {
			bot.chat(message.split('!send ')[1])
			console.log(message)
			console.log("Sent: "+message.split('!send ')[1])
		}
    });
    
	return bot;
}
function main() {
	var accounts;
	var i;
	accounts = readAccounts(accountsFile);

	if (accounts.length === 0) {
		console.log('No accounts found in accounts.txt. Add one account per line and try again.');
		return;
	}

	console.log('Starting ' + accounts.length + ' bot(s) for ' + host + ':' + port + ' on ' + version);

	for (i = 0; i < accounts.length; i++) {
		(function (accountId, index) {
			setTimeout(function () {
				createBot(accountId, index);
			}, index * joinDelayMs);
		})(accounts[i], i);
	}
}

try {
	main();
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
