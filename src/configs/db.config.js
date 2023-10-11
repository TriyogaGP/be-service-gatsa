const Sequelize = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const env = process.env.NODE_ENV || 'development'
const port = process.env.DB_PORT || '3306'
const config = require(__dirname + '/config.json')[port][env]
// create connection
const sequelizeInstance = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: {
      // useUTC: false, //for reading from database
      dateStrings: true,
      typeCast: function (field, next) { // for reading from database
        if (field.type === 'DATETIME') {
          return field.string()
        }
          return next()
        },
    },
    logging: false,
    timezone: '+07:00'
});
 
// export connection
module.exports = {
  sequelizeInstance,
  Sequelize
};