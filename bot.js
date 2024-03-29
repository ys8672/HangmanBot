const tmi = require('tmi.js');
const { hangmanBotName, hangmanBotOAuth } = require('./private/password');
const { mainCommands } = require('./utils/commands');
const { addHangmanClient, removeHangmanClient, transferHangmanClient, autoStartHangmanClient } = require('./commands/main-commands');
const { loadNameIdData, nameIsEmpty } = require('./data/name');
const { loadDictionary } = require('./data/dictionary');

// Create Hangman client to PlayHangmanBot Channel
const options = {
    options: {
        debug: true,
    },
    connection: {
        cluster: 'aws',
        reconnect: true,
    },
    identity: {
        username: hangmanBotName,
        password: hangmanBotOAuth,
    },
    channels: [hangmanBotName],
};
const client = new tmi.client(options);
client.connect();

// Load dictionary and channels who originally had Hangman running.
client.on('connected', (address, port) => {
    if (nameIsEmpty()) {
        loadDictionary();
        const nameList = loadNameIdData();
        if (nameList !== null) {
            autoStartHangmanClient(nameList);
            client.action(hangmanBotName, `is live! Previously saved data loaded successfully!`);
        } else {
            client.action(hangmanBotName, `is live! Previously saved data failed to load.`);  
        }
    }
});

// Allow PlayHangmanBot to add/remove/transfer Hangman clients.
client.on('message', (channel, user, message, self) => {
	// Ignore self messages and non-commands.
    if(self || !message.startsWith("!")) return;

    // Username + unique ID of command user.
    const name = user["display-name"];
    const id = user["user-id"];
    const props = { client, channel, name, id };

    /* Dictionary list of explicit commands */
    const chatCommands = {
        [mainCommands.ADD]: () => addHangmanClient(props),
        [mainCommands.REMOVE]: () => removeHangmanClient(props),
        [mainCommands.TRANSFER]: () => transferHangmanClient(props)
    }

    if(chatCommands[message]) {
        chatCommands[message]();
    }
});
