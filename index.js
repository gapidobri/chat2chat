import Swarm from 'discovery-swarm';
import { randomBytes } from 'crypto';
import defaults from 'dat-swarm-defaults';
import getPort from 'get-port';
import { question, log } from './readline.js';
import rls from 'readline-sync';

const userId = randomBytes(32);
const swarmConfig = defaults({ id: userId });

const swarm = Swarm(swarmConfig);
const port = await getPort();
const room = 'defaultRoom';

const peers = {};
let connSeq = 0;

const chat = () => {
    question('> ', (answer) => {
        broadcast(answer);
        chat();
    });
}

const chatFormat = (username, message) => {
    return `<${username}> ${message}`
}

const broadcast = (message) => {
    for (let peer in peers) {
        peers[peer].connection.write(message);
    }
}

const props = {
    username: rls.question('Username: '),
};

swarm.listen(port);
log(`Listening on port ${port}`);

swarm.join(room);
log(`Joined room ${room}`);

let propString = '#';

for (let prop in props) {
    propString += `${prop}=${props[prop]}`;
}

swarm.on('connection', (connection, info) => {
    
    const peerId = info.id.toString('hex');
    const seq = connSeq;

    if (info.initiator) {
        try {
            connection.setKeepAlive(true, 600);
        } catch (exception) {
            log(exception);
        }
    }

    // Sends user details
    connection.write(propString);

    if (!peers[peerId]) peers[peerId] = {};
    peers[peerId].connection = connection;
    peers[peerId].seq = seq;

    connection.on('data', (data) => {
        const message = data.toString();
        if (message === '') return;
        if (message.startsWith('#')) {
            const stringProps = message.split('#')[1].split('&');
            const props = {};
            for (let prop of stringProps) {
                const parts = prop.split('=').map(v => v.trim());
                props[parts[0]] = parts[1];
            }
            peers[peerId].props = props;
        } else {
            log(chatFormat(peers[peerId].props.username, message));
        }
    });

    connection.on('close', () => {
        if (peers[peerId].seq === seq) {
            delete peers[peerId];
            log(`${peers[peerId].props.username} left`);
        }
    });

    connSeq++;

});

chat();