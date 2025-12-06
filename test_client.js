const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Test Client Connected: ' + socket.id);
});

socket.on('disconnect', () => {
    console.log('Test Client Disconnected');
});

// Keep alive for 30 seconds then exit
setTimeout(() => {
    console.log('Test Client Exiting');
    socket.disconnect();
    process.exit(0);
}, 30000);
