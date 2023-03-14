'use strict';

const KodePosScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    postalID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'postal_id'
    },
    subdisID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'subdis_id',
    },
    disID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'dis_id',
    },
    cityID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'city_id',
    },
    provID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'prov_id',
    },
    postalCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'postal_code',
    },
  };
};

module.exports = {
  KodePosScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const KodePos = sequelizeInstance
      .define(
        'KodePos',
        KodePosScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_postalcode',
          modelName: 'KodePos',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return KodePos;
  },
};
