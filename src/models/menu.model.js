'use strict';

const MenuScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idMenu: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_menu'
    },
    kategori: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'kategori',
    },
    menuRoute: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'menu_route',
    },
    menuText: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'menu_text',
    },
    menuIcon: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'menu_icon',
    },
    menuSequence: {
      type: DataTypes.STRING(256),
      allowNull: false,
      field: 'menu_sequence',
    },
    statusAktif: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'status_aktif',
    },
  };
};

module.exports = {
  MenuScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Menu = sequelizeInstance
      .define(
        'Menu',
        MenuScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_menu',
          modelName: 'Menu',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Menu;
  },
};
