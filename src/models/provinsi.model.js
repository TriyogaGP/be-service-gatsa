'use strict';

const ProvinsiScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    provID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'prov_id'
    },
    provName: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'prov_name',
    },
  };
};

module.exports = {
  ProvinsiScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Provinsi = sequelizeInstance
      .define(
        'Provinsi',
        ProvinsiScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_provinces',
          modelName: 'Provinsi',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Provinsi;
  },
};
