'use strict';

const PercakapanScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idPercakapan: {
      type: DataTypes.STRING(32),
      allowNull: false,
      primaryKey: true,
      field: 'id_percakapan'
    },
    room: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'room',
    },
    pengirim: {
      type: DataTypes.STRING(32),
      allowNull: false,
      field: 'pengirim',
    },
    pesan: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'pesan',
    },
    isRead: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			field: 'is_read'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: true,
      field: 'created_at',
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
  PercakapanScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const Percakapan = sequelizeInstance
      .define(
        'Percakapan',
        PercakapanScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_percakapan',
          modelName: 'Percakapan',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );
		
    Percakapan.associate = models => {
      models.Percakapan.belongsTo(models.User, {
        foreignKey: 'pengirim',
        constraint: false
      });
    }
    return Percakapan;
  },
};
