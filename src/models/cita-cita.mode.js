'use strict';

const CitaCitaScheme = Sequelize => {
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
  CitaCitaScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const CitaCita = sequelizeInstance
      .define(
        'CitaCita',
        CitaCitaScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_cita_cita',
          modelName: 'CitaCita',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );

    return CitaCita;
  },
};
