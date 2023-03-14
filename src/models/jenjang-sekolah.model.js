'use strict';

const JenjangSekolahScheme = Sequelize => {
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
  JenjangSekolahScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const JenjangSekolah = sequelizeInstance
      .define(
        'JenjangSekolah',
        JenjangSekolahScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_jenjang_sekolah',
          modelName: 'JenjangSekolah',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return JenjangSekolah;
  },
};
