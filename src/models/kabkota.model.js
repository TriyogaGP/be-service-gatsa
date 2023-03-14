'use strict';

const KabKotaScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    cityID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'city_id'
    },
    cityName: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'city_name',
    },
    provID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'prov_id',
    },
  };
};

module.exports = {
  KabKotaScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const KabKota = sequelizeInstance
      .define(
        'KabKota',
        KabKotaScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_cities',
          modelName: 'KabKota',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return KabKota;
  },
};
