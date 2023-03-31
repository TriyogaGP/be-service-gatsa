'use strict';

const NilaiScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idNilai: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_nilai'
    },
    idUser: {
      type: DataTypes.STRING(32),
      allowNull: false,
      field: 'id_user'
    },
    mapel: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mapel'
    },
    dataNilai: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'data_nilai',
    },
    dataKehadiran: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'data_kehadiran',
    },
  };
};

module.exports = {
  NilaiScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Nilai = sequelizeInstance
      .define(
        'Nilai',
        NilaiScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_nilai',
          modelName: 'Nilai',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Nilai;
  },
};
