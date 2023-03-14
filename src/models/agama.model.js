'use strict';

const AgamaScheme = Sequelize => {
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
  AgamaScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Agama = sequelizeInstance
      .define(
        'Agama',
        AgamaScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_agama',
          modelName: 'Agama',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Agama;
  },
};
