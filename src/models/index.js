const fs = require('fs');

const importModels = (sequelizeInstance, Sequelize) => {
  const models = {};

  const files = fs.readdirSync(__dirname);
  files
    .filter(file => file !== 'index.js' && file.endsWith('.js'))
    .forEach(file => {
      const { ModelFn } = require(`${__dirname}/${file}`);
      const Model = ModelFn(sequelizeInstance, Sequelize);
      models[Model.name] = Model;
    });

  Object.keys(models).forEach(name => {
    if (
      typeof models[name].associate !== 'undefined' &&
      typeof models[name].associate === 'function'
    ) {
      models[name].associate(models);
    }
  });

  return models;
};

module.exports = { importModels };
