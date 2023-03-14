'use strict';

const StatusTempatTinggalScheme = Sequelize => {
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
  StatusTempatTinggalScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const StatusTempatTinggal = sequelizeInstance
      .define(
        'StatusTempatTinggal',
        StatusTempatTinggalScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_status_tempattinggal',
          modelName: 'StatusTempatTinggal',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return StatusTempatTinggal;
  },
};
