const Sequelize = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

 
const config = {
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "userrootwin",
  PASSWORD: process.env.DB_PASSWORD || "userrootwin",
  DB: process.env.DB_NAME || "db_gatsa_web",
  PORT: process.env.DB_PORT || 3306,
}

// create connection
const sequelizeInstance = new Sequelize(config.DB, config.USER, config.PASSWORD, {
    host: config.HOST,
    port: config.PORT,
    dialect: 'mysql',
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