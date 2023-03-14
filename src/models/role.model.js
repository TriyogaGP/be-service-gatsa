'use strict';

const RoleScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idRole: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_role'
    },
    namaRole: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'nama_role',
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'status',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: true,
      field: 'created_at',
    },
  };
};

module.exports = {
  RoleScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Role = sequelizeInstance
      .define(
        'Role',
        RoleScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_role',
          modelName: 'Role',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return Role;
  },
};
