const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const app = express();
const PORT = 3000;
const bodyparser = require('body-parser');
const userRoute = require('./routes/userRoute');
const https = require('https');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const httpsServer = https.createServer({
    key: fs.readFileSync('./certificates/key.pem'),
    cert: fs.readFileSync('./certificates/csr.pem'),
    requestCert: false,
    rejectUnauthorized: false,
}, app);

const io = require('socket.io')(httpsServer);
const path = require('path');

app.use(express.json());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));
app.use(express.static(__dirname + '/public'));

const mongoURI = 'mongodb://localhost:27017/webrtc';
mongoose.connect(mongoURI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

app.use('/', userRoute);

httpsServer.listen(PORT, function () {
    console.log(`Server running at https://192.168.50.158:${PORT}/home`);
});

io.on('connection', (socket) => {
    socket.on('join', (roomName) => {
        let rooms = io.sockets.adapter.rooms;
        let room = rooms.get(roomName);

        if (room == undefined) {
            socket.join(roomName);
            socket.emit('created');
        }
        else if (room.size === 1) {
            socket.join(roomName);
            socket.emit('joined');
        }
        else {
            socket.emit('full');
        };
    });

    socket.on('ready', (roomName) => {
        socket.broadcast.to(roomName).emit('ready');
    });

    socket.on('candidate', (candidate, roomName) => {
        socket.broadcast.to(roomName).emit('candidate', candidate);
    });

    socket.on('offer', (offer, roomName) => {
        socket.broadcast.to(roomName).emit('offer', offer);
    });

    socket.on('answer', (answer, roomName) => {
        socket.broadcast.to(roomName).emit('answer', answer);
    });

    socket.on('leave', (roomName) => {
        socket.leave(roomName);
        socket.broadcast.to(roomName).emit('leave');
    });

    socket.on('screenOffer', (screenOffer, roomName) => {
        socket.broadcast.to(roomName).emit('screenOffer', screenOffer);
    });

    socket.on('video-off', (video_offer, roomName) => {
        socket.broadcast.to(roomName).emit('video-off', video_offer);
    });
    
}); 