'use strict';

const PendidikanScheme = Sequelize => {
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
  PendidikanScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Pendidikan = sequelizeInstance
      .define(
        'Pendidikan',
        PendidikanScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_pendidikan',
          modelName: 'Pendidikan',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Pendidikan;
  },
};
