'use strict';

const UserScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idUser: {
      type: DataTypes.STRING(32),
      allowNull: false,
      primaryKey: true,
      field: 'id_user'
    },
    consumerType: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'consumer_type'
    },
    nama: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'nama',
    },
    username: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'username',
    },
    email: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'email',
    },
    password: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'password',
    },
		kataSandi: {
			type: DataTypes.STRING(256),
			allowNull: true,
			field: 'katasandi',
		},
    statusAktif: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'status_aktif',
    },
    validasiAkun: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'validasi_akun',
    },
    mutasiAkun: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'mutasi_akun',
    },
    createBy: {
			type: DataTypes.STRING(32),
			allowNull: true,
			field: 'create_by'
    },
    updateBy: {
			type: DataTypes.STRING(32),
			allowNull: true,
			field: 'update_by'
    },
    deleteBy: {
			type: DataTypes.STRING(32),
			allowNull: true,
			field: 'delete_by'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: true,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: true,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
      field: 'deleted_at',
    },
  };
};

module.exports = {
  UserScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const User = sequelizeInstance
      .define(
        'User',
        UserScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_users',
          modelName: 'User',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );
		
    User.associate = models => {
      models.User.belongsTo(models.Role, {
        foreignKey: 'consumerType',
        constraint: false
      });
      models.User.hasOne(models.UserDetail, {
        foreignKey: 'idUser',
        constraint: false
      });
    }
    return User;
  },
};
