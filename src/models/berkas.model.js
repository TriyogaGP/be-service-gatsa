'use strict';

const BerkasScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idBerkas: {
      type: DataTypes.STRING(32),
      allowNull: false,
      primaryKey: true,
      field: 'id_berkas'
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'type',
    },
    title: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'title',
    },
    file: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'file',
    },
    ext: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'ext',
    },
    statusAktif: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			field: 'status_aktif'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: true,
      field: 'created_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
      field: 'deleted_at',
    },
  };
};

module.exports = {
  BerkasScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Berkas = sequelizeInstance
      .define(
        'Berkas',
        BerkasScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_berkas',
          modelName: 'Berkas',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );
    return Berkas;
  },
};
