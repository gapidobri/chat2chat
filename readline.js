import readline, { Interface } from 'readline';
import EventEmitter from 'events';

let rl;
let closed = true;
let prefix;
const emitter = new EventEmitter();

const clearLine = () => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
}

const log = (text) => {
    if (!closed) {
        const input = rl.line;
        rl.close();
        clearLine();
        console.log(text);
        read();
        rl.write(input);
    } else {
        console.log(text);
    }
}

const read = () => {
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    closed = false;
    rl.question(prefix, answer => {
        rl.close();
        closed = true;
        emitter.emit('answer', answer);
    });
}

const question = (query, callback) => {
    prefix = query;
    read();
    emitter.on('answer', (message) => {
        emitter.removeAllListeners();
        rl.close();
        callback(message);
    });
}

export { question, log };