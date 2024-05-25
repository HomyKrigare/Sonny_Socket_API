const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { checkIfUserExists } = require('./src/functions/controller/userController');
const { initializeApp } = require('firebase/app');
const { admin } = require('./firebaseAdmin');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname)));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Map();

wss.on('connection', function connection(ws, req) {
    console.log("WS connection arrived");
    const uid = req.url.split('?')[1].split('=')[1];
    const userExists = checkIfUserExists(uid);

    if (!userExists) {
        ws.send(JSON.stringify({ error: 'User does not exist' }));
        console.log('User does not exist');
        return ws.close();
    }
   
    ws.on('message', function incoming(message) {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === 'join_room') {
                const room = parsedMessage.room;
                if (!clients.has(room)) {
                    clients.set(room, new Set());
                }
                clients.get(room).add(ws);
                ws.send(JSON.stringify({ success: true, room: room, message: 'You successfully joined the room.' }));
            } else if (parsedMessage.type === 'message') {
                const room = parsedMessage.room;
                if (clients.has(room)) {
                    clients.get(room).forEach(function (client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(parsedMessage));
                        }
                    });
                }
            } else {
                throw new Error('Invalid message type');
            }
            
        } catch (error) {
            console.error('Error processing message:', error.message);
            ws.send(JSON.stringify({ error: error.message }));
        }
    });

    ws.on('close', function() {
        console.log("Client disconnected");
        // Remove the disconnected client from all rooms
        clients.forEach((roomClients, room) => {
            if (roomClients.has(ws)) {
                roomClients.delete(ws);
                if (roomClients.size === 0) {
                    clients.delete(room);
                }
            }
        });
    });

    ws.send('Welcome to the chat!');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
