const socket = require('socket.io');
const express = require('express');
const http = require('http');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

// Determine the environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Create a logger instance
const logger = winston.createLogger({
  level: 'info', // Default log level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    // Always log to a file
    new winston.transports.File({
      filename: 'application.log', // Log file path
      level: 'info', // Log level for file
    }),
  ],
});

// Add a console transport only in development
if (isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    })
  );
}

const app = express();
// Enable CORS for Express
app.use(cors());
const server_port = process.env.SERVER_PORT;
const http_server = http.createServer(app).listen(server_port, function () {
  logger.info(`SocketIO > listening on port ${server_port}`);
});
// testing if app is working
// app.get('/', (req, res) => {
//   res.send('Hello, live server working perfectly!');
// });

// live server
const allowedOrigins = process.env.ALLOWED_ORIGIN?.split(',') || [];
function emitNewStudent(http_server) {
  const io = socket(http_server, {
    cors: {
      origin: '*', // Allow the client origin
      methods: ['GET', 'POST'], // Allow these HTTP methods
      credentials: true, // Allow credentials (if needed)
    },
  });

  /* First listen to a connection and run the callback function */
  io.on('connection', function (socket) {
    logger.info('New client connected');
    // Further socket event handlers can go here
    socket.on('new_student', function (data) {
      io.emit('new_student', data);
      logger.info('New student created: ', data);
    });

    socket.on('students_received', function (data) {
      io.emit('students_received', data);
      logger.info('Uploaded students received: ', data);
    });

    socket.on('duplicate_student', function (data) {
      io.emit('duplicate_student', data);
      logger.info('Duplicate student: ', data);
    });

    socket.on('finished_uploading_students', function (data) {
      io.emit('finished_uploading_students', data);
      logger.info('Finished uploading students: ', data);
    });
  });
}

emitNewStudent(http_server);
