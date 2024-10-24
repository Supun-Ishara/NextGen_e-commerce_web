const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Add metadata if present
        if (Object.keys(metadata).length > 0) {
            log += ` ${JSON.stringify(metadata)}`;
        }
        
        return log;
    })
);

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
require('fs').mkdirSync(logsDir, { recursive: true });

// Configure logger
const logger = winston.createLogger({
    levels,
    format: logFormat,
    transports: [
        // Console transport
        new winston.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        
        // Error log file transport
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        
        // Combined log file transport
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        
        // Payment-specific log file transport
        new winston.transports.File({
            filename: path.join(logsDir, 'payments.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ],
    // Don't exit on handled exceptions
    exitOnError: false
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
    write: (message) => logger.http(message.trim())
};

// Add helper methods for structured logging
logger.logPaymentEvent = (eventType, data) => {
    logger.info(`Payment Event: ${eventType}`, {
        event: eventType,
        ...data,
        timestamp: new Date().toISOString()
    });
};

logger.logError = (error, context = {}) => {
    logger.error(error.message, {
        stack: error.stack,
        ...context,
        timestamp: new Date().toISOString()
    });
};

module.exports = logger;