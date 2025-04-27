const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const games = {}; // Map from gameId -> list of sockets

wss.on('connection', (ws) => {
  let gameId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'join') {
        gameId = data.gameId;
        if (!games[gameId]) {
          games[gameId] = [];
        }
        games[gameId].push(ws);
        console.log(`Client joined game ${gameId}`);
      }

      if (data.type === 'update' && gameId) {
        // Broadcast to all other clients in same game
        for (const client of games[gameId]) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        }
      }
    } catch (err) {
      console.error('Invalid message', err);
    }
  });

  ws.on('close', () => {
    if (gameId && games[gameId]) {
      games[gameId] = games[gameId].filter(client => client !== ws);
      if (games[gameId].length === 0) {
        delete games[gameId];
      }
    }
  });
});

console.log('WebSocket relay server listening on ws://localhost:8080');
