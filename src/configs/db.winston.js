const MySQLTransport = require('winston-mysql');
const winston = require('winston');
const dotenv = require('dotenv');
dotenv.config();

 
const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "userrootwin",
  password: process.env.DB_PASSWORD || "userrootwin",
  database: process.env.DB_NAME || "db_win",
  port: process.env.DB_PORT || 3306,
  table: "t_logger",
}

const logger = winston.createLogger({
	level: 'debug',
	format: winston.format.json(),
	// defaultMeta: { service: 'user-service' },
	transports: [
			new winston.transports.Console({
				format: winston.format.simple(),
			}),
			// or use: options_custom / options_json
			new MySQLTransport(config),
	],
});

// export connection
module.exports = {
	logger,
};