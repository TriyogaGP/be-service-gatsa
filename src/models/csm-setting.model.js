'use strict';

const CMSSettingScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    kode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true,
      field: 'kode'
    },
    setting: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'setting',
    },
  };
};

module.exports = {
  CMSSettingScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const CMSSetting = sequelizeInstance
      .define(
        'CMSSetting',
        CMSSettingScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_cms_settings',
          modelName: 'CMSSetting',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return CMSSetting;
  },
};
