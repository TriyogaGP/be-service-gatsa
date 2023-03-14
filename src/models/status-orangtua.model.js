'use strict';

const StatusOrangtuaScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    kode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'kode'
    },
    label: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'label',
    },
  };
};

module.exports = {
  StatusOrangtuaScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const StatusOrangtua = sequelizeInstance
      .define(
        'StatusOrangtua',
        StatusOrangtuaScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_status_orangtua',
          modelName: 'StatusOrangtua',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return StatusOrangtua;
  },
};
