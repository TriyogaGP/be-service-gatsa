'use strict';

const WilayahScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    kode: {
      type: DataTypes.STRING(13),
      allowNull: true,
      field: 'kode',
    },
    nama: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'nama',
    },
    kodePos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'kode_pos',
    },
  };
};

module.exports = {
  WilayahScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Wilayah = sequelizeInstance
      .define(
        'Wilayah',
        WilayahScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_wilayah',
          modelName: 'Wilayah',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Wilayah;
  },
};
