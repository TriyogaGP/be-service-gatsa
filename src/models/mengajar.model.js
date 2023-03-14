'use strict';

const MengajarScheme = Sequelize => {
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
  MengajarScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Mengajar = sequelizeInstance
      .define(
        'Mengajar',
        MengajarScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_mengajar',
          modelName: 'Mengajar',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Mengajar;
  },
};
