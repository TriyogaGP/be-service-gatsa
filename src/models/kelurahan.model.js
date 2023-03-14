'use strict';

const KelurahanScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    subdisID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'subdis_id'
    },
    subdisName: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'subdis_name',
    },
    disID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'dis_id',
    },
  };
};

module.exports = {
  KelurahanScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Kelurahan = sequelizeInstance
      .define(
        'Kelurahan',
        KelurahanScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_subdistricts',
          modelName: 'Kelurahan',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Kelurahan;
  },
};
