'use strict';

const TransportasiScheme = Sequelize => {
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
  TransportasiScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Transportasi = sequelizeInstance
      .define(
        'Transportasi',
        TransportasiScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_transportasi',
          modelName: 'Transportasi',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Transportasi;
  },
};
