'use strict';

const JarakRumahScheme = Sequelize => {
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
  JarakRumahScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const JarakRumah = sequelizeInstance
      .define(
        'JarakRumah',
        JarakRumahScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_jarakrumah',
          modelName: 'JarakRumah',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return JarakRumah;
  },
};
