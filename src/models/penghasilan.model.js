'use strict';

const PenghasilanScheme = Sequelize => {
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
  PenghasilanScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Penghasilan = sequelizeInstance
      .define(
        'Penghasilan',
        PenghasilanScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_penghasilan',
          modelName: 'Penghasilan',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Penghasilan;
  },
};
