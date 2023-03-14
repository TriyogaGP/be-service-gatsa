'use strict';

const KelasScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idKelas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_kelas'
    },
    kelas: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'kelas',
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'status',
    },
  };
};

module.exports = {
  KelasScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Kelas = sequelizeInstance
      .define(
        'Kelas',
        KelasScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_kelas',
          modelName: 'Kelas',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Kelas;
  },
};
