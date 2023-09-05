const { encrypt, decrypt, makeRandom, createKSUID, convertDateTime } = require('@triyogagp/backend-common/utils/helper.utils');
const { Op } = require('sequelize')
const { sequelizeInstance, Sequelize } = require('../configs/db.config');
// const { importModels } = require('../models/index')
const { importModels } = require('@triyogagp/backend-common/models/gatsa')
const models = importModels(sequelizeInstance, Sequelize);

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
const BASE_URL = process.env.BASE_URL

const getUserOnline = async () => {
  const dataOnline = await models.User.findAll({
    where: {
      isActive: true,
      mutasiAkun: false,
      consumerType: [3, 4],
    },
    attributes: ['idUser', 'nama', 'consumerType', 'isActive', 'statusAktif'],
    include: [
      { 
        model: models.UserDetail,
        attributes: ['nomorInduk', 'kelas', 'fotoProfil'],
      },
    ],
    order: [
      ['nama', 'ASC'],
    ],
  });

  const dataUser = await Promise.all(dataOnline.map(async val => {
    return {
      idUser: val.idUser,
      consumerType: val.consumerType,
      nomorInduk: val.UserDetail.nomorInduk,
      nama: val.nama.toUpperCase(),
      kelas: val.UserDetail.kelas,
      fotoProfil: val.UserDetail.fotoProfil ? `${BASE_URL}image/${val.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
      isActive: val.isActive,
      statusAktif: val.statusAktif,
    }
  }))
  return dataUser
};

const hitungPercapakan = async () => {
  const jml = await models.Percakapan.count({
    where: { isRead: false },
    group: ['room', 'pengirim'],
  });
  console.log(jml);
	// const dataRoom = await models.JoinRoom.findAll({attributes: ['room', 'member']});
  // let room = []
  // dataRoom.map(val => {
  //   let member = JSON.parse(val.dataValues.member)
  //   // console.log(member);
  //   if(member.includes(to)) {
  //     room.push({room: val.room, idUser: to})
  //   }
  // })
  
  // if(room.length){
  //   let jml
  //   if(room.length === 1){
  //     jml = await models.Percakapan.count({
  //       where: { room: room[0].room, pengirim: room[0].idUser, isRead: false },
  //     });
  //   }else if(room.length === 2){
  //     jml = await models.Percakapan.count({
  //       where: { room: room[1].room, pengirim: room[0].idUser, isRead: false },
  //     });
  //   }
  //   return jml
  // }else{
  //   return 0
  // }
};

const checkRoom = async (from, to, role) => {
	const dataRoom = await models.JoinRoom.findAll({where: { role: role }, attributes: ['room', 'member']});
  let kondisi1 = false, kondisi2 = false
  let room = []
  dataRoom.map(val => {
    let member = JSON.parse(val.dataValues.member)
    if(member.includes(from)) kondisi1 = true
    if(member.includes(to)) kondisi2 = true
    if(kondisi1 && kondisi2){
      room.push(val.dataValues.room)
    }
  })

  if(kondisi1 && kondisi2){
    return room[0]
  }else{
    let payload = {
      room: await makeRandom(10),
      member: JSON.stringify([from, to]),
      role: role,
    }
    await models.JoinRoom.create(payload)
    return payload.room
  }
};

const getPercakapan = async (room) => {
	const dataPercakapan = await models.Percakapan.findAll({
    where: { room },
    include: [
      { 
        model: models.User,
        attributes: ['nama'],
        include: [
          { 
            model: models.UserDetail,
            attributes: ['fotoProfil'],
          },
        ],
      },
    ],
    order: [
      ['createdAt', 'ASC'],
    ],
  });

  const percakapan = await Promise.all(dataPercakapan.map(async val => {
    return {
      idPercakapan: val.idPercakapan,
      idUser: val.pengirim,
      nama: val.dataValues.User.nama.toUpperCase(),
      fotoProfil: val.dataValues.User.UserDetail.fotoProfil ? `${BASE_URL}image/${val.dataValues.User.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
      pesan: val.pesan,
      isRead: val.isRead,
      jam: convertDateTime(val.createdAt),
    }
  }))
  return percakapan
};

const insertPesan = async (data) => {
  let payload = {
    idPercakapan: await createKSUID(),
    room: data.room,
    pengirim: data.pengirim,
    penerima: data.penerima,
    pesan: data.pesan,
    isRead: 0,
  }
  let hasil = await models.Percakapan.create(payload)
  if(hasil){
    return true
  }else{
    return false
  }
};

const updateReadChat = async (room, to) => {
  await models.Percakapan.update({ isRead: 1 }, { where: { room: room, pengirim: to } })
};

module.exports = {
  getUserOnline,
  hitungPercapakan,
  checkRoom,
  getPercakapan,
  updateReadChat,
  insertPesan,
};