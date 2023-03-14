'use strict';

const KecamatanScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    disID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'dis_id'
    },
    disName: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'dis_name',
    },
    cityID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'city_id',
    },
  };
};

module.exports = {
  KecamatanScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Kecamatan = sequelizeInstance
      .define(
        'Kecamatan',
        KecamatanScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_districts',
          modelName: 'Kecamatan',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Kecamatan;
  },
};
