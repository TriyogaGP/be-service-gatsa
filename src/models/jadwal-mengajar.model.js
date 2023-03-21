'use strict';

const JadwalMengajarScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idJadwalMengajar: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true,
      field: 'id_jadwal_mengajar'
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
    kelas: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'kelas'
    },
    jumlahTugas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'jumlah_tugas',
    },
    kkm: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'kkm',
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'status',
    },
  };
};

module.exports = {
  JadwalMengajarScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const JadwalMengajar = sequelizeInstance
      .define(
        'JadwalMengajar',
        JadwalMengajarScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_jadwal_mengajar',
          modelName: 'JadwalMengajar',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return JadwalMengajar;
  },
};
