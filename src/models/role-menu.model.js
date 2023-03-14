'use strict';

const RoleMenuScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idRoleMenu: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_role_menu'
    },
    idRole: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_role'
    },
    menu: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'menu',
    },
  };
};

module.exports = {
  RoleMenuScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const RoleMenu = sequelizeInstance
      .define(
        'RoleMenu',
        RoleMenuScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_role_menu',
          modelName: 'RoleMenu',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    RoleMenu.associate = models => {
      models.RoleMenu.belongsTo(models.Role, {
        foreignKey: 'idRole',
        constraint: false
      });
    }
    return RoleMenu;
  },
};
