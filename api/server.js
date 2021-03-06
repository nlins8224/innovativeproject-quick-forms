const express = require('express');
require('dotenv').config();

const app = express();
const cors = require('cors');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const connectDb = require('./src/connection/connection');
const passportGoogleStrategy = require('./src/authentication/passportGoogleStrategy');
const filledFormsRoute = require('./src/routing/filledForms');
const templatesRoute = require('./src/routing/templateForms');
const pendingFormsRoute = require('./src/routing/pendingForms');
const nativeAuthRoute = require('./src/routing/nativeAuth');
const googleAuthRoute = require('./src/routing/googleAuth');
const registerRoute = require('./src/routing/register');

const corsOptions = {
  origin: [process.env.CLIENT_API_URL],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Access-Control-Allow-Methods',
    'Access-Control-Request-Headers',
    'Access-Control-Allow-Origin'
  ],
  credentials: true,
  enablePreflight: false
};
app.use(cors(corsOptions));
app.use(passport.initialize());
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api/forms/templates', templatesRoute);
app.use('/api/forms/templates/file', templatesRoute);
app.use('/api/forms/templates/user', templatesRoute);
app.use('/api/forms/filled-forms', filledFormsRoute);
//app.use('/api/forms/filled-forms/single', filledFormsRoute);
app.use('/api/forms/pendingforms', pendingFormsRoute);
//app.use('/api/forms/pendingforms/single', pendingFormsRoute);
app.use('/api/auth', nativeAuthRoute);
app.use('/api/auth', googleAuthRoute);
app.use('/api/auth', registerRoute);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  connectDb();
});

app.set('io', io);
app.set('server', server);

const connections = [];
const socketDictionary = {};

const socketPendingFormOn = require('./src/sockets/socketPendingFormOn');
const socketPost = require('./src/sockets/socketPendingFormEmit');

socketPendingFormOn.start(io, socketDictionary);

io.on('connection', socket => {
  connections.push(socket);
  socketPost.start(app, io, socketDictionary);
  console.log('made socket connection', socket.id);

  socket.on('disconnect', () => {
      delete socketDictionary[socket.id];
      console.log('%s disconnected: %s sockets connected', socket.id)
  })
});
