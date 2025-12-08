const io = require('socket.io-client');
const socket = io('http://localhost:3000');

let x = 100;
let y = 100;
let direction = 1;

socket.on('connect', () => {
    console.log('Test Client (Movement) Connected: ' + socket.id);

    // Test Versioning
    socket.on('gameVersion', (v) => {
        console.log('✅ Version Received:', v);
    });

    // Start moving
    let angle = 0;
    setInterval(() => {
        x += 5 * direction;
        angle += 10;

        // Simulate movement data including rotation
        const data = {
            x: x,
            y: y,
            lat: 40.0 + (x / 10000),
            lon: 29.0 + (y / 10000),
            angle: angle,
            rotation: angle * (Math.PI / 180) // Radians
        };

        // console.log('Sending movement:', data);
        socket.emit('playerMovement', data);
    }, 500); // Move every 500ms
});

socket.on('disconnect', () => {
    console.log('Test Client Disconnected');
});

// Keep alive for 5 seconds (enough to test connection and version)
setTimeout(() => {
    console.log('Test Client Exiting');
    socket.disconnect();
    process.exit(0);
}, 5000);
