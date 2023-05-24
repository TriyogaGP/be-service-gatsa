'use strict';

const NotifikasiScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idNotifikasi: {
      type: DataTypes.STRING(32),
      allowNull: false,
      primaryKey: true,
      field: 'id_notifikasi'
    },
    idUser: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'id_user',
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'type',
    },
    judul: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'judul',
    },
    pesan: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'pesan',
    },
    params: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'params',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'is_read',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: true,
      field: 'created_at',
    },
  };
};

module.exports = {
  NotifikasiScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Notifikasi = sequelizeInstance
      .define(
        'Notifikasi',
        NotifikasiScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_notifikasi',
          modelName: 'Notifikasi',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );
    
    return Notifikasi;
  },
};
