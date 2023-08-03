'use strict';

const JoinRoomScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    room: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true,
      field: 'room',
    },
    member: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'member',
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'role',
    },
  };
};

module.exports = {
  JoinRoomScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const JoinRoom = sequelizeInstance
      .define(
        'JoinRoom',
        JoinRoomScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_join_room',
          modelName: 'JoinRoom',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );
		
    return JoinRoom;
  },
};
