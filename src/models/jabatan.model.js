'use strict';

const JabatanScheme = Sequelize => {
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
  JabatanScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Jabatan = sequelizeInstance
      .define(
        'Jabatan',
        JabatanScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_jabatan',
          modelName: 'Jabatan',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Jabatan;
  },
};
