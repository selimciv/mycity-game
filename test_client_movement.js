const io = require('socket.io-client');
const socket = io('http://localhost:3000');

let x = 100;
let y = 100;
let direction = 1;

socket.on('connect', () => {
    console.log('Test Client (Movement) Connected: ' + socket.id);

    // Start moving
    setInterval(() => {
        x += 10 * direction;
        if (x > 700 || x < 50) direction *= -1; // Bounce

        socket.emit('oyuncuHareketi', { x: x, y: y });
    }, 500); // Move every 500ms
});

socket.on('disconnect', () => {
    console.log('Test Client Disconnected');
});

// Keep alive for 30 seconds
setTimeout(() => {
    console.log('Test Client Exiting');
    socket.disconnect();
    process.exit(0);
}, 30000);
