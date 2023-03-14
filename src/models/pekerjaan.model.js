'use strict';

const PekerjaanScheme = Sequelize => {
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
  PekerjaanScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Pekerjaan = sequelizeInstance
      .define(
        'Pekerjaan',
        PekerjaanScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_pekerjaan',
          modelName: 'Pekerjaan',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Pekerjaan;
  },
};
