'use strict';

const HobiScheme = Sequelize => {
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
  HobiScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Hobi = sequelizeInstance
      .define(
        'Hobi',
        HobiScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_hobi',
          modelName: 'Hobi',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Hobi;
  },
};
