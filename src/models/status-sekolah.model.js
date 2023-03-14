'use strict';

const StatusSekolahScheme = Sequelize => {
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
  StatusSekolahScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const StatusSekolah = sequelizeInstance
      .define(
        'StatusSekolah',
        StatusSekolahScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_status_sekolah',
          modelName: 'StatusSekolah',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return StatusSekolah;
  },
};
