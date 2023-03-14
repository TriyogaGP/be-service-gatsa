const { response, OK, NOT_FOUND, NO_CONTENT } = require('../utils/response.utils');
const { encrypt, decrypt, dateconvert, convertDate3, createKSUID, uppercaseLetterFirst, buildMysqlResponseWithPagination, convertDate } = require('../utils/helper.utils');
const {
	_allOption,
	_agamaOption,
  _citacitaOption,
	_hobiOption,
	_jenjangsekolahOption,
	_statussekolahOption,
	_statusortuOption,
	_pendidikanOption,
	_pekerjaanOption,
	_jabatanOption,
	_mengajarOption,
	_penghasilanOption,
	_statustempattinggalOption,
	_jarakrumahOption,
	_transportasiOption,
	_wilayahOption,
} = require('../controllers/helper.service')
const { Op } = require('sequelize')
const sequelize = require('sequelize')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const excel = require("exceljs");
const ejs = require("ejs");
const pdf = require("html-pdf");
const path = require("path");
const _ = require('lodash');
const { logger } = require('../configs/db.winston')
const nodeGeocoder = require('node-geocoder');
const readXlsxFile = require('read-excel-file/node');
const { sequelizeInstance } = require('../configs/db.config');
const dotenv = require('dotenv');
dotenv.config();
const BASE_URL = process.env.BASE_URL

function getAdmin (models) {
  return async (req, res, next) => {
		let { page = 1, limit = 20, keyword } = req.query
    let where = {}
    try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined

			const whereKey = keyword ? {
				[Op.or]: [
					{ nama : { [Op.like]: `%${keyword}%` }},
					{ username : { [Op.like]: `%${keyword}%` }},
					{ email : { [Op.like]: `%${keyword}%` }},
				]
			} : {}

			where = { ...whereKey, consumerType: [1, 2] }

      const { count, rows: dataAdmin } = await models.User.findAndCountAll({
				where,
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
				include: [
					{ 
						model: models.Role,
						attributes: ['namaRole'],
						where: { status: true }
					},
					{ 
						model: models.UserDetail,
					},
				],
				order: [
					['createdAt', 'DESC'],
				],
				limit: parseInt(limit),
				offset: OFFSET,
			});

			// return OK(res, dataAdmin)
			const getResult = await Promise.all(dataAdmin.map(async val => {
				return {
					idUser: val.idUser,
					consumerType: val.consumerType,
					namaRole: val.Role.namaRole,
					nama: val.nama,
					username: val.username,
					email: val.email,
					password: val.password,
					kataSandi: val.kataSandi,
					tempat: val.UserDetail.tempat,
					tanggalLahir: val.UserDetail.tanggalLahir,
					jenisKelamin: val.UserDetail.jenisKelamin,
					agama: val.UserDetail.agama ? await _agamaOption({ models, kode: val.UserDetail.agama }) : null,
					telp: val.UserDetail.telp,
					alamat: val.UserDetail.alamat,
					provinsi: val.UserDetail.provinsi ? await _wilayahOption({ models, kode: val.UserDetail.provinsi }) : null,
					kabKota: val.UserDetail.kabKota ? await _wilayahOption({ models, kode: val.UserDetail.kabKota }) : null,
					kecamatan: val.UserDetail.kecamatan ? await _wilayahOption({ models, kode: val.UserDetail.kecamatan }) : null,
					kelurahan: val.UserDetail.kelurahan ? await _wilayahOption({ models, kode: val.UserDetail.kelurahan }) : null,
					kodePos: val.UserDetail.kodePos,
					fotoProfil: val.UserDetail.fotoProfil ? `${BASE_URL}image/${val.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
					statusAktif: val.statusAktif,
				}
			}))

			const responseData = buildMysqlResponseWithPagination(
				getResult,
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getAdminbyUid (models) {
  return async (req, res, next) => {
		let { uid } = req.params
    try {
      const dataAdmin = await models.User.findOne({
				where: { idUser: uid },
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
				include: [
					{ 
						model: models.Role,
						attributes: ['namaRole'],
						where: { status: true }
					},
					{ 
						model: models.UserDetail,
					},
				],
				order: [
					['createdAt', 'DESC'],
				],
			});

			return OK(res, {
				idUser: dataAdmin.idUser,
				consumerType: dataAdmin.consumerType,
				namaRole: dataAdmin.Role.namaRole,
				nama: dataAdmin.nama,
				username: dataAdmin.username,
				email: dataAdmin.email,
				password: dataAdmin.password,
				kataSandi: dataAdmin.kataSandi,
				tempat: dataAdmin.UserDetail.tempat,
				tanggalLahir: dataAdmin.UserDetail.tanggalLahir,
				jenisKelamin: dataAdmin.UserDetail.jenisKelamin,
				agama: dataAdmin.UserDetail.agama ? await _agamaOption({ models, kode: dataAdmin.UserDetail.agama }) : null,
				telp: dataAdmin.UserDetail.telp,
				alamat: dataAdmin.UserDetail.alamat,
				provinsi: dataAdmin.UserDetail.provinsi ? await _wilayahOption({ models, kode: dataAdmin.UserDetail.provinsi }) : null,
				kabKota: dataAdmin.UserDetail.kabKota ? await _wilayahOption({ models, kode: dataAdmin.UserDetail.kabKota }) : null,
				kecamatan: dataAdmin.UserDetail.kecamatan ? await _wilayahOption({ models, kode: dataAdmin.UserDetail.kecamatan }) : null,
				kelurahan: dataAdmin.UserDetail.kelurahan ? await _wilayahOption({ models, kode: dataAdmin.UserDetail.kelurahan }) : null,
				kodePos: dataAdmin.UserDetail.kodePos,
				fotoProfil: dataAdmin.UserDetail.fotoProfil ? `${BASE_URL}image/${dataAdmin.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
				statusAktif: dataAdmin.statusAktif,
			})
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function postAdmin (models) {
  return async (req, res, next) => {
		let { user, userdetail } = req.body
		let where = {}
    try {
			let salt, hashPassword, kirimdataUser, kirimdataUserDetail;
			if(user.jenis == 'ADD'){
				where = { 
					statusAktif: true,
					[Op.or]: [
						{ email: user.email },
						{ username: user.username }
					] 
				}
				const count = await models.User.count({where});
				if(count) return NOT_FOUND(res, 'data sudah di gunakan !')
				// const ksuid = await createKSUID()
				salt = await bcrypt.genSalt();
				hashPassword = await bcrypt.hash(user.password, salt);
				kirimdataUser = {
					idUser: user.idUser,
					consumerType: user.consumerType,
					nama: user.nama,
					email: user.email,
					username: user.username,
					password: hashPassword,
					kataSandi: encrypt(user.password),
					statusAktif: 1,
					createBy: user.idUser,
				}
				kirimdataUserDetail = {
					idUser: user.idUser,
					nomorInduk: '-',
					tempat: userdetail.tempat,
					tanggalLahir: userdetail.tanggalLahir,
					jenisKelamin: userdetail.jenisKelamin,
					agama: userdetail.agama,
					telp: userdetail.telp,
					alamat: userdetail.alamat,
					provinsi: userdetail.provinsi,
					kabKota: userdetail.kabKota,
					kecamatan: userdetail.kecamatan,
					kelurahan: userdetail.kelurahan,
					kodePos: userdetail.kodePos,
				}
				await sequelizeInstance.transaction(async trx => {
					await models.User.create(kirimdataUser, { transaction: trx })
					await models.UserDetail.create(kirimdataUserDetail, { transaction: trx })
				})

			}else if(user.jenis == 'EDIT'){
				if(await models.User.findOne({where: {email: user.email, [Op.not]: [{idUser: user.idUser}]}})) return NOT_FOUND(res, 'Email sudah di gunakan !')
				if(await models.User.findOne({where: {username: user.username, [Op.not]: [{idUser: user.idUser}]}})) return NOT_FOUND(res, 'Username sudah di gunakan !')
				const data = await models.User.findOne({where: {idUser: user.idUser}});
				salt = await bcrypt.genSalt();
				let decryptPass = data.kataSandi != user.password ? user.password : decrypt(user.password)
				hashPassword = await bcrypt.hash(decryptPass, salt);
				kirimdataUser = {
					consumerType: user.consumerType,
					nama: user.nama,
					email: user.email,
					username: user.username,
					password: hashPassword,
					kataSandi: data.kataSandi == user.password ? user.password : encrypt(user.password),
					statusAktif: 1,
					updateBy: user.idUser,
				}
				kirimdataUserDetail = {
					tempat: userdetail.tempat,
					tanggalLahir: userdetail.tanggalLahir,
					jenisKelamin: userdetail.jenisKelamin,
					agama: userdetail.agama,
					telp: userdetail.telp,
					alamat: userdetail.alamat,
					provinsi: userdetail.provinsi,
					kabKota: userdetail.kabKota,
					kecamatan: userdetail.kecamatan,
					kelurahan: userdetail.kelurahan,
					kodePos: userdetail.kodePos,
				}
				await sequelizeInstance.transaction(async trx => {
					await models.User.update(kirimdataUser, { where: { idUser: user.idUser } }, { transaction: trx })
					await models.UserDetail.update(kirimdataUserDetail, { where: { idUser: user.idUser } }, { transaction: trx })
				})
			}else if(user.jenis == 'DELETE'){
				kirimdataUser = {
					statusAktif: 0,
					deleteBy: user.idUser,
					deletedAt: new Date(),
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })	
			}else if(user.jenis == 'STATUSRECORD'){
				kirimdataUser = { 
					statusAktif: user.kondisi, 
					updateBy: user.idUser 
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getStruktural (models) {
  return async (req, res, next) => {
		let { page = 1, limit = 20, keyword } = req.query
    let where = {}
    try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined

			const whereKey = keyword ? {
				[Op.or]: [
					{ nama : { [Op.like]: `%${keyword}%` }},
					{ username : { [Op.like]: `%${keyword}%` }},
					{ email : { [Op.like]: `%${keyword}%` }},
					{ '$UserDetail.nomor_induk$' : { [Op.like]: `%${keyword}%` }},
				]
			} : {}

			where = { ...whereKey, consumerType: 3 }

      const { count, rows: dataStruktural } = await models.User.findAndCountAll({
				where,
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
				include: [
					{ 
						model: models.Role,
						attributes: ['namaRole'],
						where: { status: true }
					},
					{ 
						model: models.UserDetail,
					},
				],
				order: [
					['createdAt', 'DESC'],
				],
				limit: parseInt(limit),
				offset: OFFSET,
			});

			// return OK(res, dataStruktural)
			const getResult = await Promise.all(dataStruktural.map(async val => {
				return {
					idUser: val.idUser,
					consumerType: val.consumerType,
					nomorInduk: val.UserDetail.nomorInduk,
					namaRole: val.Role.namaRole,
					nama: val.nama,
					username: val.username,
					email: val.email,
					password: val.password,
					kataSandi: val.kataSandi,
					tempat: val.UserDetail.tempat,
					tanggalLahir: val.UserDetail.tanggalLahir,
					jenisKelamin: val.UserDetail.jenisKelamin,
					agama: val.UserDetail.agama ? await _agamaOption({ models, kode: val.UserDetail.agama }) : null,
					telp: val.UserDetail.telp,
					alamat: val.UserDetail.alamat,
					provinsi: val.UserDetail.provinsi ? await _wilayahOption({ models, kode: val.UserDetail.provinsi }) : null,
					kabKota: val.UserDetail.kabKota ? await _wilayahOption({ models, kode: val.UserDetail.kabKota }) : null,
					kecamatan: val.UserDetail.kecamatan ? await _wilayahOption({ models, kode: val.UserDetail.kecamatan }) : null,
					kelurahan: val.UserDetail.kelurahan ? await _wilayahOption({ models, kode: val.UserDetail.kelurahan }) : null,
					kodePos: val.UserDetail.kodePos,
					pendidikanGuru: val.UserDetail.pendidikanGuru ? await _pendidikanOption({ models, kode: val.UserDetail.pendidikanGuru }) : null,
					jabatanGuru: val.UserDetail.jabatanGuru ? await _jabatanOption({ models, kode: val.UserDetail.jabatanGuru }) : null,
					mengajarBidang: val.UserDetail.mengajarBidang ? await _mengajarOption({ models, kode: val.UserDetail.mengajarBidang }) : null,
					mengajarKelas: val.UserDetail.mengajarKelas,
					waliKelas: val.UserDetail.waliKelas,
					fotoProfil: val.UserDetail.fotoProfil ? `${BASE_URL}image/${val.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
					statusAktif: val.statusAktif,
				}
			}))

			const responseData = buildMysqlResponseWithPagination(
				getResult,
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getStrukturalbyUid (models) {
  return async (req, res, next) => {
		let { uid } = req.params
    try {
      const dataStruktural = await models.User.findOne({
				where: { idUser: uid },
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
				include: [
					{ 
						model: models.Role,
						attributes: ['namaRole'],
						where: { status: true }
					},
					{ 
						model: models.UserDetail,
					},
				],
				order: [
					['createdAt', 'DESC'],
				],
			});

			// return OK(res, dataStruktural)
			let jabatan = await _jabatanOption({ models, kode: dataStruktural.UserDetail.jabatanGuru })
			let mengajar = await _mengajarOption({ models, kode: dataStruktural.UserDetail.mengajarBidang })

			return OK(res, {
				idUser: dataStruktural.idUser,
				consumerType: dataStruktural.consumerType,
				nomorInduk: dataStruktural.UserDetail.nomorInduk,
				namaRole: dataStruktural.Role.namaRole,
				nama: dataStruktural.nama,
				username: dataStruktural.username,
				email: dataStruktural.email,
				password: dataStruktural.password,
				kataSandi: dataStruktural.kataSandi,
				tempat: dataStruktural.UserDetail.tempat,
				tanggalLahir: dataStruktural.UserDetail.tanggalLahir,
				jenisKelamin: dataStruktural.UserDetail.jenisKelamin,
				agama: dataStruktural.UserDetail.agama ? await _agamaOption({ models, kode: dataStruktural.UserDetail.agama }) : null,
				telp: dataStruktural.UserDetail.telp,
				alamat: dataStruktural.UserDetail.alamat,
				provinsi: dataStruktural.UserDetail.provinsi ? await _wilayahOption({ models, kode: dataStruktural.UserDetail.provinsi }) : null,
				kabKota: dataStruktural.UserDetail.kabKota ? await _wilayahOption({ models, kode: dataStruktural.UserDetail.kabKota }) : null,
				kecamatan: dataStruktural.UserDetail.kecamatan ? await _wilayahOption({ models, kode: dataStruktural.UserDetail.kecamatan }) : null,
				kelurahan: dataStruktural.UserDetail.kelurahan ? await _wilayahOption({ models, kode: dataStruktural.UserDetail.kelurahan }) : null,
				kodePos: dataStruktural.UserDetail.kodePos,
				pendidikanGuru: dataStruktural.UserDetail.pendidikanGuru ? await _pendidikanOption({ models, kode: dataStruktural.UserDetail.pendidikanGuru }) : null,
				jabatanGuru: dataStruktural.UserDetail.jabatanGuru ? jabatan.map(str => { return str.kode; }) : null,
				mengajarBidang: dataStruktural.UserDetail.mengajarBidang ? mengajar.map(str => { return str.kode; }) : null,
				mengajarKelas: dataStruktural.UserDetail.mengajarKelas,
				waliKelas: dataStruktural.UserDetail.waliKelas,
				fotoProfil: dataStruktural.UserDetail.fotoProfil ? `${BASE_URL}image/${dataStruktural.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
				statusAktif: dataStruktural.statusAktif,
			})
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function postStruktural (models) {
  return async (req, res, next) => {
		let { user, userdetail } = req.body
		let where = {}
    try {
			let salt, hashPassword, kirimdataUser, kirimdataUserDetail;
			if(user.jenis == 'ADD'){
				where = { 
					statusAktif: true,
					[Op.or]: [
						{ email: user.email },
						{ username: user.username },
						{ '$UserDetail.nomor_induk$': str.nomorInduk },
					] 
				}
				const count = await models.User.count({
					where,
					include: [
						{ 
							model: models.UserDetail,
						}
					],
				});
				if(count) return NOT_FOUND(res, 'data sudah di gunakan !')
				// const ksuid = await createKSUID()
				salt = await bcrypt.genSalt();
				hashPassword = await bcrypt.hash(user.password, salt);
				kirimdataUser = {
					idUser: user.idUser,
					consumerType: user.consumerType,
					nama: user.nama,
					email: user.email,
					username: user.username,
					password: hashPassword,
					kataSandi: encrypt(user.password),
					statusAktif: 1,
					createBy: user.idUser,
				}
				kirimdataUserDetail = {
					idUser: user.idUser,
					nomorInduk: userdetail.nomorInduk,
					tempat: userdetail.tempat,
					tanggalLahir: userdetail.tanggalLahir,
					jenisKelamin: userdetail.jenisKelamin,
					agama: userdetail.agama,
					telp: userdetail.telp,
					alamat: userdetail.alamat,
					provinsi: userdetail.provinsi,
					kabKota: userdetail.kabKota,
					kecamatan: userdetail.kecamatan,
					kelurahan: userdetail.kelurahan,
					kodePos: userdetail.kodePos,
					pendidikanGuru: userdetail.pendidikanGuru,
					jabatanGuru: userdetail.jabatanGuru,
					mengajarBidang: userdetail.mengajarBidang,
					mengajarKelas: userdetail.mengajarKelas,
					waliKelas: userdetail.waliKelas,
				}
				await sequelizeInstance.transaction(async trx => {
					await models.User.create(kirimdataUser, { transaction: trx })
					await models.UserDetail.create(kirimdataUserDetail, { transaction: trx })
				})

			}else if(user.jenis == 'EDIT'){
				if(await models.User.findOne({where: {email: user.email, [Op.not]: [{idUser: user.idUser}]}})) return NOT_FOUND(res, 'Email sudah di gunakan !')
				if(await models.User.findOne({where: {username: user.username, [Op.not]: [{idUser: user.idUser}]}})) return NOT_FOUND(res, 'Username sudah di gunakan !')
				if(userdetail.nomorInduk !== '-'){
					if(await models.UserDetail.findOne({where: {nomorInduk: userdetail.nomorInduk, [Op.not]: [{idUser: user.idUser}]}})) return NOT_FOUND(res, 'Nomor Induk sudah di gunakan !')
				}
				const data = await models.User.findOne({where: {idUser: user.idUser}});
				salt = await bcrypt.genSalt();
				let decryptPass = data.kataSandi != user.password ? user.password : decrypt(user.password)
				hashPassword = await bcrypt.hash(decryptPass, salt);
				kirimdataUser = {
					consumerType: user.consumerType,
					nama: user.nama,
					email: user.email,
					username: user.username,
					password: hashPassword,
					kataSandi: data.kataSandi == user.password ? user.password : encrypt(user.password),
					statusAktif: 1,
					updateBy: user.idUser,
				}
				kirimdataUserDetail = {
					nomorInduk: userdetail.nomorInduk,
					tempat: userdetail.tempat,
					tanggalLahir: userdetail.tanggalLahir,
					jenisKelamin: userdetail.jenisKelamin,
					agama: userdetail.agama,
					telp: userdetail.telp,
					alamat: userdetail.alamat,
					provinsi: userdetail.provinsi,
					kabKota: userdetail.kabKota,
					kecamatan: userdetail.kecamatan,
					kelurahan: userdetail.kelurahan,
					kodePos: userdetail.kodePos,
					pendidikanGuru: userdetail.pendidikanGuru,
					jabatanGuru: userdetail.jabatanGuru,
					mengajarBidang: userdetail.mengajarBidang,
					mengajarKelas: userdetail.mengajarKelas,
					waliKelas: userdetail.waliKelas,
				}
				await sequelizeInstance.transaction(async trx => {
					await models.User.update(kirimdataUser, { where: { idUser: user.idUser } }, { transaction: trx })
					await models.UserDetail.update(kirimdataUserDetail, { where: { idUser: user.idUser } }, { transaction: trx })
				})
			}else if(user.jenis == 'DELETE'){
				kirimdataUser = {
					statusAktif: 0,
					deleteBy: user.idUser,
					deletedAt: new Date(),
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })	
			}else if(user.jenis == 'STATUSRECORD'){
				kirimdataUser = { 
					statusAktif: user.kondisi, 
					updateBy: user.idUser 
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getSiswaSiswi (models) {
  return async (req, res, next) => {
		let { page = 1, limit = 20, keyword, kelas } = req.query
    let where = {}
    try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined

			let whereUserDetail = {}
			let wherePlus = {}
			if(kelas){
				whereUserDetail.kelas = kelas
				wherePlus.mutasiAkun = false
			}

			const whereKey = keyword ? {
				[Op.or]: [
					{ nama : { [Op.like]: `%${keyword}%` }},
					{ username : { [Op.like]: `%${keyword}%` }},
					{ email : { [Op.like]: `%${keyword}%` }},
					{ '$UserDetail.nomor_induk$' : { [Op.like]: `%${keyword}%` }},
				]
			} : {}

			where = { ...whereKey, consumerType: 4, ...wherePlus }

      const { count, rows: dataSiswaSiswi } = await models.User.findAndCountAll({
				where,
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
				include: [
					{ 
						model: models.Role,
						attributes: ['namaRole'],
						where: { status: true }
					},
					{ 
						model: models.UserDetail,
						where: whereUserDetail
					},
				],
				order: [
					['createdAt', 'DESC'],
				],
				limit: parseInt(limit),
				offset: OFFSET,
			});

			// return OK(res, dataSiswaSiswi)
			const getResult = await Promise.all(dataSiswaSiswi.map(async val => {
				return {
					idUser: val.idUser,
					consumerType: val.consumerType,
					nikSiswa: val.UserDetail.nikSiswa,
					nomorInduk: val.UserDetail.nomorInduk,
					namaRole: val.Role.namaRole,
					nama: val.nama,
					username: val.username,
					email: val.email,
					password: val.password,
					kataSandi: val.kataSandi,
					tempat: val.UserDetail.tempat,
					tanggalLahir: val.UserDetail.tanggalLahir,
					jenisKelamin: val.UserDetail.jenisKelamin,
					agama: val.UserDetail.agama ? await _agamaOption({ models, kode: val.UserDetail.agama }) : null,
					anakKe: val.UserDetail.anakKe,
					jumlahSaudara: val.UserDetail.jumlahSaudara,
					hobi: val.UserDetail.hobi ? await _hobiOption({ models, kode: val.UserDetail.hobi }) : null,
					citaCita: val.UserDetail.citaCita ? await _citacitaOption({ models, kode: val.UserDetail.citaCita }) : null,
					dataSekolahSebelumnya: {
						jenjang: val.UserDetail.jenjang ? await _jenjangsekolahOption({ models, kode: val.UserDetail.jenjang }) : null,
						statusSekolah: val.UserDetail.statusSekolah ? await _statussekolahOption({ models, kode: val.UserDetail.statusSekolah }) : null,
						namaSekolah: val.UserDetail.namaSekolah,
						npsn: val.UserDetail.npsn,
						alamatSekolah: val.UserDetail.alamatSekolah,
						kabkotSekolah: val.UserDetail.kabkotSekolah ? await _wilayahOption({ models, kode: val.UserDetail.kabkotSekolah }) : null,
						noPesertaUN: val.UserDetail.noPesertaUN,
						noSKHUN: val.UserDetail.noSKHUN,
						noIjazah: val.UserDetail.noIjazah,
						nilaiUN: val.UserDetail.nilaiUN,
					},
					noKK: val.UserDetail.noKK,
					namaKK: val.UserDetail.namaKK,
					dataOrangtua: {
						dataAyah: {
							namaAyah: val.UserDetail.namaAyah,
							tahunAyah: val.UserDetail.tahunAyah,
							statusAyah: val.UserDetail.statusAyah ? await _statusortuOption({ models, kode: val.UserDetail.statusAyah }) : null,
							nikAyah: val.UserDetail.nikAyah,
							pendidikanAyah: val.UserDetail.pendidikanAyah ? await _pendidikanOption({ models, kode: val.UserDetail.pendidikanAyah }) : null,
							pekerjaanAyah: val.UserDetail.pekerjaanAyah ? await _pekerjaanOption({ models, kode: val.UserDetail.pekerjaanAyah }) : null,
							telpAyah: val.UserDetail.telpAyah,
						},
						dataIbu: {
							namaIbu: val.UserDetail.namaIbu,
							tahunIbu: val.UserDetail.tahunIbu,
							statusIbu: val.UserDetail.statusIbu ? await _statusortuOption({ models, kode: val.UserDetail.statusIbu }) : null,
							nikIbu: val.UserDetail.nikIbu,
							pendidikanIbu: val.UserDetail.pendidikanIbu ? await _pendidikanOption({ models, kode: val.UserDetail.pendidikanIbu }) : null,
							pekerjaanIbu: val.UserDetail.pekerjaanIbu ? await _pekerjaanOption({ models, kode: val.UserDetail.pekerjaanIbu }) : null,
							telpIbu: val.UserDetail.telpIbu,
						},
						dataWali: {
							namaWali: val.UserDetail.namaWali,
							tahunWali: val.UserDetail.tahunWali,
							nikWali: val.UserDetail.nikWali,
							pendidikanWali: val.UserDetail.pendidikanWali ? await _pendidikanOption({ models, kode: val.UserDetail.pendidikanWali }) : null,
							pekerjaanWali: val.UserDetail.pekerjaanWali ? await _pekerjaanOption({ models, kode: val.UserDetail.pekerjaanWali }) : null,
							telpWali: val.UserDetail.telpWali,
						}
					},
					penghasilan: val.UserDetail.penghasilan ? await _penghasilanOption({ models, kode: val.UserDetail.penghasilan }) : null,
					dataAlamatOrangtua: {
						telp: val.UserDetail.telp,
						alamat: val.UserDetail.alamat,
						provinsi: val.UserDetail.provinsi ? await _wilayahOption({ models, kode: val.UserDetail.provinsi }) : null,
						kabKota: val.UserDetail.kabKota ? await _wilayahOption({ models, kode: val.UserDetail.kabKota }) : null,
						kecamatan: val.UserDetail.kecamatan ? await _wilayahOption({ models, kode: val.UserDetail.kecamatan }) : null,
						kelurahan: val.UserDetail.kelurahan ? await _wilayahOption({ models, kode: val.UserDetail.kelurahan }) : null,
						kodePos: val.UserDetail.kodePos,
					},
					kelas: val.UserDetail.kelas,
					dataLainnya: {
						statusTempatTinggal: val.UserDetail.statusTempatTinggal ? await _statustempattinggalOption({ models, kode: val.UserDetail.statusTempatTinggal }) : null,
						jarakRumah: val.UserDetail.jarakRumah ? await _jarakrumahOption({ models, kode: val.UserDetail.jarakRumah }) : null,
						transportasi: val.UserDetail.transportasi ? await _transportasiOption({ models, kode: val.UserDetail.transportasi }) : null,
					},
					fotoProfil: val.UserDetail.fotoProfil ? `${BASE_URL}image/${val.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
					berkas: {
						fcIjazah: val.UserDetail.fcIjazah ? `${BASE_URL}pdf/${val.UserDetail.fcIjazah}` : null,
						fcSKHUN: val.UserDetail.fcSKHUN ? `${BASE_URL}pdf/${val.UserDetail.fcSKHUN}` : null,
						fcKK: val.UserDetail.fcKK ? `${BASE_URL}pdf/${val.UserDetail.fcKK}` : null,
						fcKTPOrtu: val.UserDetail.fcKTPOrtu ? `${BASE_URL}pdf/${val.UserDetail.fcKTPOrtu}` : null,
						fcAktaLahir: val.UserDetail.fcAktaLahir ? `${BASE_URL}pdf/${val.UserDetail.fcAktaLahir}` : null,
						fcSKL: val.UserDetail.fcSKL ? `${BASE_URL}pdf/${val.UserDetail.fcSKL}` : null,
					},
					mutasiAkun: val.mutasiAkun,
					validasiAkun: val.validasiAkun,
					statusAktif: val.statusAktif,
				}
			}))

			const responseData = buildMysqlResponseWithPagination(
				getResult,
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getSiswaSiswibyUid (models) {
  return async (req, res, next) => {
		let { uid } = req.params
		try {
      const dataSiswaSiswi = await models.User.findOne({
				where: { idUser: uid },
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
				include: [
					{ 
						model: models.Role,
						attributes: ['namaRole'],
						where: { status: true }
					},
					{ 
						model: models.UserDetail,
					},
				],
				order: [
					['createdAt', 'DESC'],
				],
			});

			// return OK(res, dataSiswaSiswi)
			return OK(res, {
				idUser: dataSiswaSiswi.idUser,
				consumerType: dataSiswaSiswi.consumerType,
				nikSiswa: dataSiswaSiswi.UserDetail.nikSiswa,
				nomorInduk: dataSiswaSiswi.UserDetail.nomorInduk,
				namaRole: dataSiswaSiswi.Role.namaRole,
				nama: dataSiswaSiswi.nama,
				username: dataSiswaSiswi.username,
				email: dataSiswaSiswi.email,
				password: dataSiswaSiswi.password,
				kataSandi: dataSiswaSiswi.kataSandi,
				tempat: dataSiswaSiswi.UserDetail.tempat,
				tanggalLahir: dataSiswaSiswi.UserDetail.tanggalLahir,
				jenisKelamin: dataSiswaSiswi.UserDetail.jenisKelamin,
				agama: dataSiswaSiswi.UserDetail.agama ? await _agamaOption({ models, kode: dataSiswaSiswi.UserDetail.agama }) : null,
				anakKe: dataSiswaSiswi.UserDetail.anakKe,
				jumlahSaudara: dataSiswaSiswi.UserDetail.jumlahSaudara,
				hobi: dataSiswaSiswi.UserDetail.hobi ? await _hobiOption({ models, kode: dataSiswaSiswi.UserDetail.hobi }) : null,
				citaCita: dataSiswaSiswi.UserDetail.citaCita ? await _citacitaOption({ models, kode: dataSiswaSiswi.UserDetail.citaCita }) : null,
				dataSekolahSebelumnya: {
					jenjang: dataSiswaSiswi.UserDetail.jenjang ? await _jenjangsekolahOption({ models, kode: dataSiswaSiswi.UserDetail.jenjang }) : null,
					statusSekolah: dataSiswaSiswi.UserDetail.statusSekolah ? await _statussekolahOption({ models, kode: dataSiswaSiswi.UserDetail.statusSekolah }) : null,
					namaSekolah: dataSiswaSiswi.UserDetail.namaSekolah,
					npsn: dataSiswaSiswi.UserDetail.npsn,
					alamatSekolah: dataSiswaSiswi.UserDetail.alamatSekolah,
					kabkotSekolah: dataSiswaSiswi.UserDetail.kabkotSekolah ? await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kabkotSekolah }) : null,
					noPesertaUN: dataSiswaSiswi.UserDetail.noPesertaUN,
					noSKHUN: dataSiswaSiswi.UserDetail.noSKHUN,
					noIjazah: dataSiswaSiswi.UserDetail.noIjazah,
					nilaiUN: dataSiswaSiswi.UserDetail.nilaiUN,
				},
				noKK: dataSiswaSiswi.UserDetail.noKK,
				namaKK: dataSiswaSiswi.UserDetail.namaKK,
				dataOrangtua: {
					dataAyah: {
						namaAyah: dataSiswaSiswi.UserDetail.namaAyah,
						tahunAyah: dataSiswaSiswi.UserDetail.tahunAyah,
						statusAyah: dataSiswaSiswi.UserDetail.statusAyah ? await _statusortuOption({ models, kode: dataSiswaSiswi.UserDetail.statusAyah }) : null,
						nikAyah: dataSiswaSiswi.UserDetail.nikAyah,
						pendidikanAyah: dataSiswaSiswi.UserDetail.pendidikanAyah ? await _pendidikanOption({ models, kode: dataSiswaSiswi.UserDetail.pendidikanAyah }) : null,
						pekerjaanAyah: dataSiswaSiswi.UserDetail.pekerjaanAyah ? await _pekerjaanOption({ models, kode: dataSiswaSiswi.UserDetail.pekerjaanAyah }) : null,
						telpAyah: dataSiswaSiswi.UserDetail.telpAyah,
					},
					dataIbu: {
						namaIbu: dataSiswaSiswi.UserDetail.namaIbu,
						tahunIbu: dataSiswaSiswi.UserDetail.tahunIbu,
						statusIbu: dataSiswaSiswi.UserDetail.statusIbu ? await _statusortuOption({ models, kode: dataSiswaSiswi.UserDetail.statusIbu }) : null,
						nikIbu: dataSiswaSiswi.UserDetail.nikIbu,
						pendidikanIbu: dataSiswaSiswi.UserDetail.pendidikanIbu ? await _pendidikanOption({ models, kode: dataSiswaSiswi.UserDetail.pendidikanIbu }) : null,
						pekerjaanIbu: dataSiswaSiswi.UserDetail.pekerjaanIbu ? await _pekerjaanOption({ models, kode: dataSiswaSiswi.UserDetail.pekerjaanIbu }) : null,
						telpIbu: dataSiswaSiswi.UserDetail.telpIbu,
					},
					dataWali: {
						namaWali: dataSiswaSiswi.UserDetail.namaWali,
						tahunWali: dataSiswaSiswi.UserDetail.tahunWali,
						nikWali: dataSiswaSiswi.UserDetail.nikWali,
						pendidikanWali: dataSiswaSiswi.UserDetail.pendidikanWali ? await _pendidikanOption({ models, kode: dataSiswaSiswi.UserDetail.pendidikanWali }) : null,
						pekerjaanWali: dataSiswaSiswi.UserDetail.pekerjaanWali ? await _pekerjaanOption({ models, kode: dataSiswaSiswi.UserDetail.pekerjaanWali }) : null,
						telpWali: dataSiswaSiswi.UserDetail.telpWali,
					}
				},
				penghasilan: dataSiswaSiswi.UserDetail.penghasilan ? await _penghasilanOption({ models, kode: dataSiswaSiswi.UserDetail.penghasilan }) : null,
				dataAlamatOrangtua: {
					telp: dataSiswaSiswi.UserDetail.telp,
					alamat: dataSiswaSiswi.UserDetail.alamat,
					provinsi: dataSiswaSiswi.UserDetail.provinsi ? await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.provinsi }) : null,
					kabKota: dataSiswaSiswi.UserDetail.kabKota ? await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kabKota }) : null,
					kecamatan: dataSiswaSiswi.UserDetail.kecamatan ? await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kecamatan }) : null,
					kelurahan: dataSiswaSiswi.UserDetail.kelurahan ? await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kelurahan }) : null,
					kodePos: dataSiswaSiswi.UserDetail.kodePos,
				},
				kelas: dataSiswaSiswi.UserDetail.kelas,
				dataLainnya: {
					statusTempatTinggal: dataSiswaSiswi.UserDetail.statusTempatTinggal ? await _statustempattinggalOption({ models, kode: dataSiswaSiswi.UserDetail.statusTempatTinggal }) : null,
					jarakRumah: dataSiswaSiswi.UserDetail.jarakRumah ? await _jarakrumahOption({ models, kode: dataSiswaSiswi.UserDetail.jarakRumah }) : null,
					transportasi: dataSiswaSiswi.UserDetail.transportasi ? await _transportasiOption({ models, kode: dataSiswaSiswi.UserDetail.transportasi }) : null,
				},
				fotoProfil: dataSiswaSiswi.UserDetail.fotoProfil ? `${BASE_URL}image/${dataSiswaSiswi.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
				berkas: {
					fcIjazah: dataSiswaSiswi.UserDetail.fcIjazah ? `${BASE_URL}pdf/${dataSiswaSiswi.UserDetail.fcIjazah}` : null,
					fcSKHUN: dataSiswaSiswi.UserDetail.fcSKHUN ? `${BASE_URL}pdf/${dataSiswaSiswi.UserDetail.fcSKHUN}` : null,
					fcKK: dataSiswaSiswi.UserDetail.fcKK ? `${BASE_URL}pdf/${dataSiswaSiswi.UserDetail.fcKK}` : null,
					fcKTPOrtu: dataSiswaSiswi.UserDetail.fcKTPOrtu ? `${BASE_URL}pdf/${dataSiswaSiswi.UserDetail.fcKTPOrtu}` : null,
					fcAktaLahir: dataSiswaSiswi.UserDetail.fcAktaLahir ? `${BASE_URL}pdf/${dataSiswaSiswi.UserDetail.fcAktaLahir}` : null,
					fcSKL: dataSiswaSiswi.UserDetail.fcSKL ? `${BASE_URL}pdf/${dataSiswaSiswi.UserDetail.fcSKL}` : null,
				},
				statusAktif: dataSiswaSiswi.statusAktif,
			})
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function postSiswaSiswi (models) {
  return async (req, res, next) => {
		let { user, userdetail } = req.body
		let where = {}
    try {
			let salt, hashPassword, kirimdataUser, kirimdataUserDetail;
			if(user.jenis == 'ADD'){
				where = { 
					statusAktif: true,
					[Op.or]: [
						{ email: user.email },
						{ username: user.username },
						{ '$UserDetail.nomor_induk$': str.nomorInduk },
					] 
				}
				const count = await models.User.count({
					where,
					include: [
						{ 
							model: models.UserDetail,
						}
					],
				});
				if(count) return NOT_FOUND(res, 'data sudah di gunakan !')
				// const ksuid = await createKSUID()
				salt = await bcrypt.genSalt();
				hashPassword = await bcrypt.hash(user.password, salt);
				kirimdataUser = {
					idUser: user.idUser,
					consumerType: user.consumerType,
					nama: user.nama,
					email: user.email,
					username: user.username,
					password: hashPassword,
					kataSandi: encrypt(user.password),
					statusAktif: 1,
					createBy: user.idUser,
				}
				kirimdataUserDetail = {
					idUser: user.idUser,
					nikSiswa: userdetail.nikSiswa,
					nomorInduk: userdetail.nomorInduk,
					tempat: userdetail.tempat,
					tanggalLahir: userdetail.tanggalLahir,
					jenisKelamin: userdetail.jenisKelamin,
					agama: userdetail.agama,
					anakKe: userdetail.anakKe,
					jumlahSaudara: userdetail.jumlahSaudara,
					hobi: userdetail.hobi,
					citaCita: userdetail.citaCita,
					kelas: userdetail.kelas,
					//dataSekolahSebelumnya
					jenjang: userdetail.dataSekolahSebelumnya.jenjang,
					statusSekolah: userdetail.dataSekolahSebelumnya.statusSekolah,
					namaSekolah: userdetail.dataSekolahSebelumnya.namaSekolah,
					npsn: userdetail.dataSekolahSebelumnya.npsn,
					alamatSekolah: userdetail.dataSekolahSebelumnya.alamatSekolah,
					kabkotSekolah: userdetail.dataSekolahSebelumnya.kabkotSekolah,
					noPesertaUN: userdetail.dataSekolahSebelumnya.noPesertaUN,
					noSKHUN: userdetail.dataSekolahSebelumnya.noSKHUN,
					noIjazah: userdetail.dataSekolahSebelumnya.noIjazah,
					nilaiUN: userdetail.dataSekolahSebelumnya.nilaiUN,
					//dataOrangtua
					noKK: userdetail.noKK,
					namaKK: userdetail.namaKK,
					penghasilan: userdetail.penghasilan,
					//dataAyah
					namaAyah: userdetail.dataOrangtua.dataAyah.namaAyah,
					tahunAyah: userdetail.dataOrangtua.dataAyah.tahunAyah,
					statusAyah: userdetail.dataOrangtua.dataAyah.statusAyah,
					nikAyah: userdetail.dataOrangtua.dataAyah.nikAyah,
					pendidikanAyah: userdetail.dataOrangtua.dataAyah.pendidikanAyah,
					pekerjaanAyah: userdetail.dataOrangtua.dataAyah.pekerjaanAyah,
					telpAyah: userdetail.dataOrangtua.dataAyah.telpAyah,
					//dataIbu
					namaIbu: userdetail.dataOrangtua.dataIbu.namaIbu,
					tahunIbu: userdetail.dataOrangtua.dataIbu.tahunIbu,
					statusIbu: userdetail.dataOrangtua.dataIbu.statusIbu,
					nikIbu: userdetail.dataOrangtua.dataIbu.nikIbu,
					pendidikanIbu: userdetail.dataOrangtua.dataIbu.pendidikanIbu,
					pekerjaanIbu: userdetail.dataOrangtua.dataIbu.pekerjaanIbu,
					telpIbu: userdetail.dataOrangtua.dataIbu.telpIbu,
					//dataWali
					namaWali: userdetail.dataOrangtua.dataWali.namaWali,
					tahunWali: userdetail.dataOrangtua.dataWali.tahunWali,
					nikWali: userdetail.dataOrangtua.dataWali.nikWali,
					pendidikanWali: userdetail.dataOrangtua.dataWali.pendidikanWali,
					pekerjaanWali: userdetail.dataOrangtua.dataWali.pekerjaanWali,
					telpWali: userdetail.dataOrangtua.dataWali.telpWali,
					//dataAlamatOrangtua
					telp: userdetail.dataAlamatOrangtua.telp,
					alamat: userdetail.dataAlamatOrangtua.alamat,
					provinsi: userdetail.dataAlamatOrangtua.provinsi,
					kabKota: userdetail.dataAlamatOrangtua.kabKota,
					kecamatan: userdetail.dataAlamatOrangtua.kecamatan,
					kelurahan: userdetail.dataAlamatOrangtua.kelurahan,
					kodePos: userdetail.dataAlamatOrangtua.kodePos,
					//dataLainnya
					statusTempatTinggal: userdetail.dataLainnya.statusTempatTinggal,
					jarakRumah: userdetail.dataLainnya.jarakRumah,
					transportasi: userdetail.dataLainnya.transportasi,
				}
				await sequelizeInstance.transaction(async trx => {
					await models.User.create(kirimdataUser, { transaction: trx })
					await models.UserDetail.create(kirimdataUserDetail, { transaction: trx })
				})

			}else if(user.jenis == 'EDIT'){
				if(await models.User.findOne({where: {email: user.email, [Op.not]: [{idUser: user.idUser}]}})) return NOT_FOUND(res, 'Email sudah di gunakan !')
				if(await models.User.findOne({where: {username: user.username, [Op.not]: [{idUser: user.idUser}]}})) return NOT_FOUND(res, 'Username sudah di gunakan !')
				if(userdetail.nomorInduk !== '-'){
					if(await models.UserDetail.findOne({where: {nomorInduk: userdetail.nomorInduk, [Op.not]: [{idUser: user.idUser}]}})) return NOT_FOUND(res, 'Nomor Induk sudah di gunakan !')
				}
				const data = await models.User.findOne({where: {idUser: user.idUser}});
				salt = await bcrypt.genSalt();
				let decryptPass = data.kataSandi != user.password ? user.password : decrypt(user.password)
				hashPassword = await bcrypt.hash(decryptPass, salt);
				kirimdataUser = {
					consumerType: user.consumerType,
					nama: user.nama,
					email: user.email,
					username: user.username,
					password: hashPassword,
					kataSandi: data.kataSandi == user.password ? user.password : encrypt(user.password),
					statusAktif: 1,
					updateBy: user.idUser,
				}
				kirimdataUserDetail = {
					nikSiswa: userdetail.nikSiswa,
					nomorInduk: userdetail.nomorInduk,
					tempat: userdetail.tempat,
					tanggalLahir: userdetail.tanggalLahir,
					jenisKelamin: userdetail.jenisKelamin,
					agama: userdetail.agama,
					anakKe: userdetail.anakKe,
					jumlahSaudara: userdetail.jumlahSaudara,
					hobi: userdetail.hobi,
					citaCita: userdetail.citaCita,
					kelas: userdetail.kelas,
					//dataSekolahSebelumnya
					jenjang: userdetail.dataSekolahSebelumnya.jenjang,
					statusSekolah: userdetail.dataSekolahSebelumnya.statusSekolah,
					namaSekolah: userdetail.dataSekolahSebelumnya.namaSekolah,
					npsn: userdetail.dataSekolahSebelumnya.npsn,
					alamatSekolah: userdetail.dataSekolahSebelumnya.alamatSekolah,
					kabkotSekolah: userdetail.dataSekolahSebelumnya.kabkotSekolah,
					noPesertaUN: userdetail.dataSekolahSebelumnya.noPesertaUN,
					noSKHUN: userdetail.dataSekolahSebelumnya.noSKHUN,
					noIjazah: userdetail.dataSekolahSebelumnya.noIjazah,
					nilaiUN: userdetail.dataSekolahSebelumnya.nilaiUN,
					//dataOrangtua
					noKK: userdetail.noKK,
					namaKK: userdetail.namaKK,
					penghasilan: userdetail.penghasilan,
					//dataAyah
					namaAyah: userdetail.dataOrangtua.dataAyah.namaAyah,
					tahunAyah: userdetail.dataOrangtua.dataAyah.tahunAyah,
					statusAyah: userdetail.dataOrangtua.dataAyah.statusAyah,
					nikAyah: userdetail.dataOrangtua.dataAyah.nikAyah,
					pendidikanAyah: userdetail.dataOrangtua.dataAyah.pendidikanAyah,
					pekerjaanAyah: userdetail.dataOrangtua.dataAyah.pekerjaanAyah,
					telpAyah: userdetail.dataOrangtua.dataAyah.telpAyah,
					//dataIbu
					namaIbu: userdetail.dataOrangtua.dataIbu.namaIbu,
					tahunIbu: userdetail.dataOrangtua.dataIbu.tahunIbu,
					statusIbu: userdetail.dataOrangtua.dataIbu.statusIbu,
					nikIbu: userdetail.dataOrangtua.dataIbu.nikIbu,
					pendidikanIbu: userdetail.dataOrangtua.dataIbu.pendidikanIbu,
					pekerjaanIbu: userdetail.dataOrangtua.dataIbu.pekerjaanIbu,
					telpIbu: userdetail.dataOrangtua.dataIbu.telpIbu,
					//dataWali
					namaWali: userdetail.dataOrangtua.dataWali.namaWali,
					tahunWali: userdetail.dataOrangtua.dataWali.tahunWali,
					nikWali: userdetail.dataOrangtua.dataWali.nikWali,
					pendidikanWali: userdetail.dataOrangtua.dataWali.pendidikanWali,
					pekerjaanWali: userdetail.dataOrangtua.dataWali.pekerjaanWali,
					telpWali: userdetail.dataOrangtua.dataWali.telpWali,
					//dataAlamatOrangtua
					telp: userdetail.dataAlamatOrangtua.telp,
					alamat: userdetail.dataAlamatOrangtua.alamat,
					provinsi: userdetail.dataAlamatOrangtua.provinsi,
					kabKota: userdetail.dataAlamatOrangtua.kabKota,
					kecamatan: userdetail.dataAlamatOrangtua.kecamatan,
					kelurahan: userdetail.dataAlamatOrangtua.kelurahan,
					kodePos: userdetail.dataAlamatOrangtua.kodePos,
					//dataLainnya
					statusTempatTinggal: userdetail.dataLainnya.statusTempatTinggal,
					jarakRumah: userdetail.dataLainnya.jarakRumah,
					transportasi: userdetail.dataLainnya.transportasi,
				}
				await sequelizeInstance.transaction(async trx => {
					await models.User.update(kirimdataUser, { where: { idUser: user.idUser } }, { transaction: trx })
					await models.UserDetail.update(kirimdataUserDetail, { where: { idUser: user.idUser } }, { transaction: trx })
				})
			}else if(user.jenis == 'DELETE'){
				kirimdataUser = {
					statusAktif: 0,
					deleteBy: user.idUser,
					deletedAt: new Date(),
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })	
			}else if(user.jenis == 'STATUSRECORD'){
				kirimdataUser = { 
					statusAktif: user.kondisi, 
					updateBy: user.idUser 
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })
			}else if(user.jenis == 'VALIDASIAKUN'){
				kirimdataUser = { 
					validasiAkun: user.kondisi, 
					updateBy: user.idUser 
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })
			}else if(user.jenis == 'MUTASIAKUN'){
				kirimdataUser = { 
					mutasiAkun: user.kondisi, 
					updateBy: user.idUser 
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function downloadTemplate (models) {
	return async (req, res, next) => {
		let { roleID } = req.params
	  try {
			let workbook = new excel.Workbook();
			if(roleID === '4'){
				let worksheet = workbook.addWorksheet("Data Siswa");
				let worksheetAgama = workbook.addWorksheet("Agama");
				let worksheetHobi = workbook.addWorksheet("Hobi");
				let worksheetCitaCita = workbook.addWorksheet("Cita - Cita");
				let worksheetJenjangSekolah = workbook.addWorksheet("Jenjang Sekolah");
				let worksheetStatusSekolah = workbook.addWorksheet("Status Sekolah");
				let worksheetStatusOrangTua = workbook.addWorksheet("Status Orang Tua");
				let worksheetPendidikan = workbook.addWorksheet("Pendidikan");
				let worksheetPekerjaan = workbook.addWorksheet("Pekerjaan");
				let worksheetStatusTempatTinggal = workbook.addWorksheet("Status Tempat Tinggal");
				let worksheetJarakRumah = workbook.addWorksheet("Jarak Rumah");
				let worksheetAlatTransportasi = workbook.addWorksheet("Alat Transportasi");
				let worksheetPenghasilan = workbook.addWorksheet("Penghasilan");

				//Data Siswa
				worksheet.columns = [
					{ header: "NAMA", key: "name", width: 20 },
					{ header: "EMAIL", key: "email", width: 20 },
					{ header: "NIK SISWA", key: "nik_siswa", width: 20 },
					{ header: "NISN", key: "nomor_induk", width: 20 },
					{ header: "TANGGAL LAHIR", key: "tgl_lahir", width: 20 },
					{ header: "TEMPAT", key: "tempat", width: 20 },
					{ header: "JENIS KELAMIN", key: "jeniskelamin", width: 20 },
					{ header: "AGAMA", key: "agama", width: 20 },
					{ header: "ANAK KE", key: "anakke", width: 20 },
					{ header: "JUMLAH SAUDARA", key: "jumlah_saudara", width: 20 },
					{ header: "HOBI", key: "hobi", width: 20 },
					{ header: "CITA-CITA", key: "cita_cita", width: 20 },
					{ header: "JENJANG SEKOLAH", key: "jenjang", width: 20 },
					{ header: "NAMA SEKOLAH", key: "nama_sekolah", width: 20 },
					{ header: "STATUS SEKOLAH", key: "status_sekolah", width: 20 },
					{ header: "NPSN", key: "npsn", width: 20 },
					{ header: "ALAMAT SEKOLAH", key: "alamat_sekolah", width: 40 },
					{ header: "KABUPATEN / KOTA SEKOLAH SEBELUMNYA", key: "kabkot_sekolah", width: 20 },
					{ header: "NOMOR KK", key: "no_kk", width: 20 },
					{ header: "NAMA KEPALA KELUARGA", key: "nama_kk", width: 20 },
					{ header: "NIK AYAH", key: "nik_ayah", width: 20 },
					{ header: "NAMA AYAH", key: "nama_ayah", width: 20 },
					{ header: "TAHUN AYAH", key: "tahun_ayah", width: 20 },
					{ header: "STATUS AYAH", key: "status_ayah", width: 20 },
					{ header: "PENDIDIKAN AYAH", key: "pendidikan_ayah", width: 20 },
					{ header: "PEKERJAAN AYAH", key: "pekerjaan_ayah", width: 20 },
					{ header: "NO HANDPHONE AYAH", key: "telp_ayah", width: 20 },
					{ header: "NIK IBU", key: "nik_ibu", width: 20 },
					{ header: "NAMA IBU", key: "nama_ibu", width: 20 },
					{ header: "TAHUN IBU", key: "tahun_ibu", width: 20 },
					{ header: "STATUS IBU", key: "status_ibu", width: 20 },
					{ header: "PENDIDIKAN IBU", key: "pendidikan_ibu", width: 20 },
					{ header: "PEKERJAAN IBU", key: "pekerjaan_ibu", width: 20 },
					{ header: "NO HANDPHONE IBU", key: "telp_ibu", width: 20 },
					{ header: "NIK WALI", key: "nik_wali", width: 20 },
					{ header: "NAMA WALI", key: "nama_wali", width: 20 },
					{ header: "TAHUN WALI", key: "tahun_wali", width: 20 },
					{ header: "PENDIDIKAN WALI", key: "pendidikan_wali", width: 20 },
					{ header: "PEKERJAAN WALI", key: "pekerjaan_wali", width: 20 },
					{ header: "NO HANDPHONE WALI", key: "telp_wali", width: 20 },
					{ header: "TELEPON", key: "telp", width: 20 },
					{ header: "ALAMAT", key: "alamat", width: 40 },
					{ header: "PROVINSI", key: "provinsi", width: 20 },
					{ header: "KABUPATEN / KOTA", key: "kabkota", width: 20 },
					{ header: "KECAMATAN", key: "kecamatan", width: 20 },
					{ header: "KELURAHAN", key: "kelurahan", width: 20 },
					{ header: "KODE POS", key: "kode_pos", width: 20 },
					{ header: "PENGHASILAN", key: "penghasilan", width: 20 },
					{ header: "STATUS TEMPAT TINGGAL", key: "status_tempat_tinggal", width: 20 },
					{ header: "JARAK RUMAH", key: "jarak_rumah", width: 20 },
					{ header: "TRANSPORTASI", key: "transportasi", width: 20 },
				];
				const figureColumns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 ,19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
				figureColumns.forEach((i) => {
					worksheet.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheet.addRows([{
					name: 'tes', 
					email: 'tes@gmail.com', 
					nik_siswa: '123', 
					nomor_induk: '123', 
					tgl_lahir: new Date(),
					tempat: 'Bogor', 
					jeniskelamin: 'Laki - Laki', 
					agama: 1, 
					anakke: '1', 
					jumlah_saudara: '1', 
					hobi: 1, 
					cita_cita: 1, 
					jenjang: 1, 
					nama_sekolah: 'SD. Teka Teki', 
					status_sekolah: 1, 
					npsn: '123', 
					alamat_sekolah: 'Bogor', 
					kabkot_sekolah: '32.01', 
					no_kk: '123', 
					nama_kk: 'Andre', 
					nik_ayah: '123', 
					nama_ayah: 'Andre', 
					tahun_ayah: '1970', 
					status_ayah: 1, 
					pendidikan_ayah: 1, 
					pekerjaan_ayah: 1, 
					telp_ayah: '123456789', 
					nik_ibu: '123', 
					nama_ibu: 'Susi', 
					tahun_ibu: '1989', 
					status_ibu: 1, 
					pendidikan_ibu: 1, 
					pekerjaan_ibu: 1, 
					telp_ibu: '123456789', 
					nik_wali: '', 
					nama_wali: '', 
					tahun_wali: '', 
					pendidikan_wali: null, 
					pekerjaan_wali: null, 
					telp_wali: '123456789', 
					telp: '123456789', 
					alamat: 'Bogor', 
					provinsi: '32', 
					kabkota: '32.01', 
					kecamatan: '32.01.01', 
					kelurahan: '32.01.01.1002', 
					kode_pos: '16913',
					penghasilan: 1,
					status_tempat_tinggal: 1,
					jarak_rumah: 1,
					transportasi: 1,
				}]);
				
				//Pil Agama
				worksheetAgama.columns = [
					{ header: "KODE", key: "kode", width: 15 },
					{ header: "LABEL", key: "label", width: 15 }
				];
				const figureColumnsAgama = [1, 2];
				figureColumnsAgama.forEach((i) => {
					worksheetAgama.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetAgama.addRows(await _allOption({ table: models.Agama }));

				//Pil Hobi
				worksheetHobi.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsHobi = [1, 2];
				figureColumnsHobi.forEach((i) => {
					worksheetHobi.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetHobi.addRows(await _allOption({ table: models.Hobi }));

				//Pil CitaCita
				worksheetCitaCita.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsCitaCita = [1, 2];
				figureColumnsCitaCita.forEach((i) => {
					worksheetCitaCita.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetCitaCita.addRows(await _allOption({ table: models.CitaCita }));

				//Pil JenjangSekolah
				worksheetJenjangSekolah.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsJenjangSekolah = [1, 2];
				figureColumnsJenjangSekolah.forEach((i) => {
					worksheetJenjangSekolah.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetJenjangSekolah.addRows(await _allOption({ table: models.JenjangSekolah }));

				//Pil StatusSekolah
				worksheetStatusSekolah.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsStatusSekolah = [1, 2];
				figureColumnsStatusSekolah.forEach((i) => {
					worksheetStatusSekolah.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetStatusSekolah.addRows(await _allOption({ table: models.StatusSekolah }));

				//Pil StatusOrangTua
				worksheetStatusOrangTua.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsStatusOrangTua = [1, 2];
				figureColumnsStatusOrangTua.forEach((i) => {
					worksheetStatusOrangTua.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetStatusOrangTua.addRows(await _allOption({ table: models.StatusOrangtua }));

				//Pil Pendidikan
				worksheetPendidikan.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsPendidikan = [1, 2];
				figureColumnsPendidikan.forEach((i) => {
					worksheetPendidikan.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetPendidikan.addRows(await _allOption({ table: models.Pendidikan }));

				//Pil Pekerjaan
				worksheetPekerjaan.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsPekerjaan = [1, 2];
				figureColumnsPekerjaan.forEach((i) => {
					worksheetPekerjaan.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetPekerjaan.addRows(await _allOption({ table: models.Pekerjaan }));

				//Pil StatusTempatTinggal
				worksheetStatusTempatTinggal.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsStatusTempatTinggal = [1, 2];
				figureColumnsStatusTempatTinggal.forEach((i) => {
					worksheetStatusTempatTinggal.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetStatusTempatTinggal.addRows(await _allOption({ table: models.StatusTempatTinggal }));

				//Pil JarakRumah
				worksheetJarakRumah.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsJarakRumah = [1, 2];
				figureColumnsJarakRumah.forEach((i) => {
					worksheetJarakRumah.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetJarakRumah.addRows(await _allOption({ table: models.JarakRumah }));

				//Pil AlatTransportasi
				worksheetAlatTransportasi.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsAlatTransportasi = [1, 2];
				figureColumnsAlatTransportasi.forEach((i) => {
					worksheetAlatTransportasi.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetAlatTransportasi.addRows(await _allOption({ table: models.Transportasi }));

				//Pil Penghasilan
				worksheetPenghasilan.columns = [
					{ header: "KODE", key: "kode", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsPenghasilan = [1, 2];
				figureColumnsPenghasilan.forEach((i) => {
					worksheetPenghasilan.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetPenghasilan.addRows(await _allOption({ table: models.Penghasilan }));

				res.setHeader(
					"Content-Disposition",
					"attachment; filename=TemplateDataSiswa.xlsx"
				);
			}
			// else if(roleID === '2'){
			// 	let worksheet = workbook.addWorksheet("Data Guru");
			// 	let worksheetAgama = workbook.addWorksheet("Agama");
			// 	let worksheetPendidikan = workbook.addWorksheet("Pendidikan");
			// 	let worksheetJabatan = workbook.addWorksheet("Jabatan");
			// 	let worksheetBidangMengajar = workbook.addWorksheet("Bidang Mengajar");

			// 	//Data Guru
			// 	worksheet.columns = [
			// 		{ header: "NAMA", key: "name", width: 20 },
			// 		{ header: "EMAIL", key: "email", width: 20 },
			// 		{ header: "TANGGAL LAHIR", key: "tgl_lahir", width: 20 },
			// 		{ header: "TEMPAT", key: "tempat", width: 20 },
			// 		{ header: "JENIS KELAMIN", key: "jeniskelamin", width: 20 },
			// 		{ header: "AGAMA", key: "agama", width: 20 },
			// 		{ header: "PENDIDIKAN TERAKHIR", key: "pendidikan_guru", width: 25 },
			// 		{ header: "JABATAN", key: "jabatan_guru", width: 20 },
			// 		{ header: "MENGAJAR BIDANG", key: "mengajar_bidang", width: 20 },
			// 		{ header: "MENGAJAR KELAS", key: "mengajar_kelas", width: 20 },
			// 		{ header: "TELEPON", key: "telp", width: 20 },
			// 		{ header: "ALAMAT", key: "alamat", width: 40 },
			// 		{ header: "PROVINSI", key: "provinsi", width: 20 },
			// 		{ header: "KABUPATEN / KOTA", key: "kabkota", width: 20 },
			// 		{ header: "KECAMATAN", key: "kecamatan", width: 20 },
			// 		{ header: "KELURAHAN", key: "kelurahan", width: 20 },
			// 		{ header: "KODE POS", key: "kode_pos", width: 20 },
			// 	];
			// 	const figureColumns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
			// 	figureColumns.forEach((i) => {
			// 		worksheet.getColumn(i).alignment = { horizontal: "left" };
			// 	});
			// 	worksheet.addRows([{
			// 		name: 'tes', 
			// 		email: 'tes@gmail.com',
			// 		tgl_lahir: new Date(),
			// 		tempat: 'Bogor', 
			// 		jeniskelamin: 'Laki - Laki', 
			// 		agama: 'Islam',  
			// 		pendidikan_guru: '5',  
			// 		jabatan_guru: 'Staff TU',  
			// 		mengajar_bidang: 'PKN',  
			// 		mengajar_kelas: '7,8,9',  
			// 		telp: '123456789', 
			// 		alamat: 'Bogor', 
			// 		provinsi: '32', 
			// 		kabkota: '32.01', 
			// 		kecamatan: '32.01.01', 
			// 		kelurahan: '32.01.01.1002', 
			// 		kode_pos: '16913',
			// 	}]);

			// 	//Pil Agama
			// 	worksheetAgama.columns = [
			// 		{ header: "KODE", key: "kode", width: 15 },
			// 		{ header: "LABEL", key: "label", width: 15 }
			// 	];
			// 	const figureColumnsAgama = [1, 2];
			// 	figureColumnsAgama.forEach((i) => {
			// 		worksheetAgama.getColumn(i).alignment = { horizontal: "left" };
			// 	});
			// 	worksheetAgama.addRows([
			// 		{ kode: 'Islam', label: 'Islam' },
			// 		{ kode: 'Katolik', label: 'Katolik' },
			// 		{ kode: 'Protestan', label: 'Protestan' },
			// 		{ kode: 'Hindu', label: 'Hindu' },
			// 		{ kode: 'Budha', label: 'Budha' }
			// 	]);

			// 	//Pil Pendidikan
			// 	worksheetPendidikan.columns = [
			// 		{ header: "KODE", key: "kode", width: 10 },
			// 		{ header: "LABEL", key: "label", width: 50 }
			// 	];
			// 	const figureColumnsPendidikan = [1, 2];
			// 	figureColumnsPendidikan.forEach((i) => {
			// 		worksheetPendidikan.getColumn(i).alignment = { horizontal: "left" };
			// 	});
			// 	worksheetPendidikan.addRows([
			// 		{ kode: '0', label: 'Tidak Berpendidikan Formal' },
			// 		{ kode: '1', label: 'SD/Sederajat' },
			// 		{ kode: '2', label: 'SMP/Sederajat' },
			// 		{ kode: '3', label: 'SMA/Sederajat' },
			// 		{ kode: '4', label: 'D1' },
			// 		{ kode: '5', label: 'D2' },
			// 		{ kode: '6', label: 'D3' },
			// 		{ kode: '7', label: 'S1' },
			// 		{ kode: '8', label: 'S2' },
			// 		{ kode: '9', label: '>S2' },
			// 	]);

			// 	//Pil Jabatan
			// 	worksheetJabatan.columns = [
			// 		{ header: "KODE", key: "kode", width: 30 },
			// 		{ header: "LABEL", key: "label", width: 30 }
			// 	];
			// 	const figureColumnsJabatan = [1, 2];
			// 	figureColumnsJabatan.forEach((i) => {
			// 		worksheetJabatan.getColumn(i).alignment = { horizontal: "left" };
			// 	});
			// 	worksheetJabatan.addRows([
			// 		{ value: 'Kepala Sekolah', label: 'Kepala Sekolah' },
			// 		{ value: 'WaKaBid. Kesiswaan', label: 'WaKaBid. Kesiswaan' },
			// 		{ value: 'WaKaBid. Kurikulum', label: 'WaKaBid. Kurikulum' },
			// 		{ value: 'WaKaBid. Sarpras', label: 'WaKaBid. Sarpras' },
			// 		{ value: 'Kepala TU', label: 'Kepala TU' },
			// 		{ value: 'Staff TU', label: 'Staff TU' },
			// 		{ value: 'Wali Kelas', label: 'Wali Kelas' },
			// 		{ value: 'BP / BK', label: 'BP / BK' },
			// 		{ value: 'Pembina Osis', label: 'Pembina Osis' },
			// 		{ value: 'Pembina Pramuka', label: 'Pembina Pramuka' },
			// 		{ value: 'Pembina Paskibra', label: 'Pembina Paskibra' },
			// 	]);

			// 	//Pil Bidang Mengajar
			// 	worksheetBidangMengajar.columns = [
			// 		{ header: "KODE", key: "kode", width: 30 },
			// 		{ header: "LABEL", key: "label", width: 30 }
			// 	];
			// 	const figureColumnsBidangworksheetBidangMengajar = [1, 2];
			// 	figureColumnsBidangworksheetBidangMengajar.forEach((i) => {
			// 		worksheetBidangMengajar.getColumn(i).alignment = { horizontal: "left" };
			// 	});
			// 	worksheetBidangMengajar.addRows([
			// 		{ kode: 'Alquran Hadits', label: 'Alquran Hadits' },
			// 		{ kode: 'Aqidah Akhlak', label: 'Aqidah Akhlak' },
			// 		{ kode: 'Bahasa Arab', label: 'Bahasa Arab' },
			// 		{ kode: 'Bahasa Indonesia', label: 'Bahasa Indonesia' },
			// 		{ kode: 'Bahasa Inggris', label: 'Bahasa Inggris' },
			// 		{ kode: 'Bahasa Sunda', label: 'Bahasa Sunda' },
			// 		{ kode: 'BTQ', label: 'BTQ' },
			// 		{ kode: 'Fiqih', label: 'Fiqih' },
			// 		{ kode: 'IPA Terpadu', label: 'IPA Terpadu' },
			// 		{ kode: 'IPS Terpadu', label: 'IPS Terpadu' },
			// 		{ kode: 'Matematika', label: 'Matematika' },
			// 		{ kode: 'Penjasorkes', label: 'Penjasorkes' },
			// 		{ kode: 'PKN', label: 'PKN' },
			// 		{ kode: 'Prakarya', label: 'Prakarya' },
			// 		{ kode: 'Seni Budaya', label: 'Seni Budaya' },
			// 		{ kode: 'SKI', label: 'SKI' },
			// 	]);

			// 	res.setHeader(
			// 		"Content-Disposition",
			// 		"attachment; filename=TemplateDataGuru.xlsx"
			// 	);
			// }
	
			res.setHeader(
				"Content-Type",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			);
  
			return workbook.xlsx.write(res).then(function () {
				res.status(200).end();
			});
	  } catch (err) {
			  return NOT_FOUND(res, err.message)
	  }
	}  
}

function importExcel (models) {
	return async (req, res, next) => {
		const dir = req.files[0];
		let body = req.body
	  try {
			let jsonDataInsert = [];
			let jsonDataPending = [];
			let jsonData = [];
			readXlsxFile(dir.path).then(async(rows) => {
				rows.shift();
				rows.map(async (row) => {
					let data = {
						nama: row[0], 
						email: row[1], 
						nikSiswa: row[2], 
						nomorInduk: row[3], 
						tanggalLahir: row[4],
						tempat: row[5], 
						jenisKelamin: row[6], 
						agama: row[7], 
						anakKe: row[8], 
						jumlahSaudara: row[9], 
						hobi: row[10], 
						citaCita: row[11], 
						jenjang: row[12], 
						namaSekolah: row[13], 
						statusSekolah: row[14], 
						npsn: row[15], 
						alamatSekolah: row[16], 
						kabkotSekolah: row[17], 
						noKK: row[18], 
						namaKK: row[19], 
						nikAyah: row[20], 
						namaAyah: row[21], 
						tahunAyah: row[22], 
						statusAyah: row[23], 
						pendidikanAyah: row[24], 
						pekerjaanAyah: row[25], 
						telpAyah: row[26], 
						nikIbu: row[27], 
						namaIbu: row[28], 
						tahunIbu: row[29], 
						statusIbu: row[30], 
						pendidikanIbu: row[31], 
						pekerjaanIbu: row[32], 
						telpIbu: row[33], 
						nikWali: row[34], 
						namaWali: row[35], 
						tahunWali: row[36], 
						pendidikanWali: row[37], 
						pekerjaanWali: row[38], 
						telpWali: row[39], 
						telp: row[40], 
						alamat: row[41], 
						provinsi: row[42], 
						kabKota: row[43], 
						kecamatan: row[44], 
						kelurahan: row[45], 
						kodePos: row[46],
						penghasilan: row[47],
						statusTempatTinggal: row[48],
						jarakRumah: row[49],
						transportasi: row[50],
					};
					jsonData.push(data);
				});

				//Proccess
				await Promise.all(jsonData.map(async str => {
					let where = { 
						statusAktif: true,
						consumerType: 4,
						[Op.or]: [
							{ email: str.email },
							{ '$UserDetail.nomor_induk$': str.nomorInduk },
						] 
					}
					const count = await models.User.count({
						where,
						include: [
							{ 
								model: models.UserDetail,
							}
						],
					});
					if(count){
						jsonDataPending.push(str)
					}else{
						jsonDataInsert.push(str)
					}
				}))

				if(jsonDataInsert.length) {
					let salt, hashPassword, kirimdataUser, kirimdataUserDetail;				
					salt = await bcrypt.genSalt();
					await Promise.all(jsonData.map(async str => {
						const ksuid = await createKSUID()
						hashPassword = await bcrypt.hash(convertDate3(str.tanggalLahir), salt);
						kirimdataUser = {
							idUser: ksuid,
							consumerType: 4,
							nama: str.nama,
							email: str.email,
							username: str.nama.split(' ')[0],
							password: hashPassword,
							kataSandi: encrypt(convertDate3(str.tanggalLahir)),
							statusAktif: 1,
							createBy: ksuid,
						}
						kirimdataUserDetail = {
							idUser: ksuid,
							nikSiswa: str.nikSiswa,
							nomorInduk: str.nomorInduk,
							tempat: str.tempat,
							tanggalLahir: convertDate(str.tanggalLahir),
							jenisKelamin: str.jenisKelamin,
							agama: str.agama,
							anakKe: str.anakKe,
							jumlahSaudara: str.jumlahSaudara,
							hobi: str.hobi,
							citaCita: str.citaCita,
							kelas: str.kelas,
							//dataSekolahSebelumnya
							jenjang: str.jenjang,
							statusSekolah: str.statusSekolah,
							namaSekolah: str.namaSekolah,
							npsn: str.npsn,
							alamatSekolah: str.alamatSekolah,
							kabkotSekolah: str.kabkotSekolah,
							noPesertaUN: str.noPesertaUN,
							noSKHUN: str.noSKHUN,
							noIjazah: str.noIjazah,
							nilaiUN: str.nilaiUN,
							//dataOrangtua
							noKK: str.noKK,
							namaKK: str.namaKK,
							penghasilan: str.penghasilan,
							//dataAyah
							namaAyah: str.namaAyah,
							tahunAyah: str.tahunAyah,
							statusAyah: str.statusAyah,
							nikAyah: str.nikAyah,
							pendidikanAyah: str.pendidikanAyah,
							pekerjaanAyah: str.pekerjaanAyah,
							telpAyah: str.telpAyah,
							//dataIbu
							namaIbu: str.namaIbu,
							tahunIbu: str.tahunIbu,
							statusIbu: str.statusIbu,
							nikIbu: str.nikIbu,
							pendidikanIbu: str.pendidikanIbu,
							pekerjaanIbu: str.pekerjaanIbu,
							telpIbu: str.telpIbu,
							//dataWali
							namaWali: str.namaWali,
							tahunWali: str.tahunWali,
							nikWali: str.nikWali,
							pendidikanWali: str.pendidikanWali,
							pekerjaanWali: str.pekerjaanWali,
							telpWali: str.telpWali,
							//dataAlamatOrangtua
							telp: str.telp,
							alamat: str.alamat,
							provinsi: str.provinsi,
							kabKota: str.kabKota,
							kecamatan: str.kecamatan,
							kelurahan: str.kelurahan,
							kodePos: str.kodePos,
							//dataLainnya
							statusTempatTinggal: str.statusTempatTinggal,
							jarakRumah: str.jarakRumah,
							transportasi: str.transportasi,
						}
						await sequelizeInstance.transaction(async trx => {
							await models.User.create(kirimdataUser, { transaction: trx })
							await models.UserDetail.create(kirimdataUserDetail, { transaction: trx })
						})	
					}))
				}
				return OK(res, { jsonDataInsert: jsonDataInsert.length, jsonDataPending: jsonDataPending.length })
			})
	  } catch (err) {
			  return NOT_FOUND(res, err.message)
	  }
	}  
}

function pdfCreate (models) {
	return async (req, res, next) => {
		let { uid } = req.params
		try {
			const dataSiswaSiswi = await models.User.findOne({
				where: { idUser: uid },
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
				include: [
					{ 
						model: models.Role,
						attributes: ['namaRole'],
						where: { status: true }
					},
					{ 
						model: models.UserDetail,
					},
				],
				order: [
					['createdAt', 'DESC'],
				],
			});
			
			let agama = await _agamaOption({ models, kode: dataSiswaSiswi.UserDetail.agama })
			let hobi = await _hobiOption({ models, kode: dataSiswaSiswi.UserDetail.hobi })
			let cita_cita = await _citacitaOption({ models, kode: dataSiswaSiswi.UserDetail.citaCita })
			let jenjang = await _jenjangsekolahOption({ models, kode: dataSiswaSiswi.UserDetail.jenjang })
			let status_sekolah = await _statussekolahOption({ models, kode: dataSiswaSiswi.UserDetail.statusSekolah })
			let kabkota_sekolah = await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kabkotSekolah })
			let status_ayah = await _statusortuOption({ models, kode: dataSiswaSiswi.UserDetail.statusAyah })
			let status_ibu = await _statusortuOption({ models, kode: dataSiswaSiswi.UserDetail.statusIbu })
			let pendidikan_ayah = await _pendidikanOption({ models, kode: dataSiswaSiswi.UserDetail.pendidikanAyah })
			let pendidikan_ibu = await _pendidikanOption({ models, kode: dataSiswaSiswi.UserDetail.pendidikanIbu })
			let pendidikan_wali = await _pendidikanOption({ models, kode: dataSiswaSiswi.UserDetail.pendidikanWali })
			let pekerjaan_ayah = await _pekerjaanOption({ models, kode: dataSiswaSiswi.UserDetail.pekerjaanAyah })
			let pekerjaan_ibu = await _pekerjaanOption({ models, kode: dataSiswaSiswi.UserDetail.pekerjaanIbu })
			let pekerjaan_wali = await _pekerjaanOption({ models, kode: dataSiswaSiswi.UserDetail.pekerjaanWali })
			let penghasilan = await _penghasilanOption({ models, kode: dataSiswaSiswi.UserDetail.penghasilan })
			let provinsi = await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.provinsi })
			let kabkota = await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kabKota })
			let kecamatan = await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kecamatan })
			let kelurahan = await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kelurahan })
			let status_tempat_tinggal = await _statustempattinggalOption({ models, kode: dataSiswaSiswi.UserDetail.statusTempatTinggal })
			let jarak_rumah = await _jarakrumahOption({ models, kode: dataSiswaSiswi.UserDetail.jarakRumah })
			let transportasi = await _transportasiOption({ models, kode: dataSiswaSiswi.UserDetail.transportasi })

			const hasil = {
				url: BASE_URL,
				idUser: dataSiswaSiswi.idUser,
				consumerType: dataSiswaSiswi.consumerType,
				nikSiswa: dataSiswaSiswi.UserDetail.nikSiswa,
				nomorInduk: dataSiswaSiswi.UserDetail.nomorInduk,
				namaRole: dataSiswaSiswi.Role.namaRole,
				nama: dataSiswaSiswi.nama,
				username: dataSiswaSiswi.username,
				email: dataSiswaSiswi.email,
				password: dataSiswaSiswi.password,
				kataSandi: dataSiswaSiswi.kataSandi,
				tempat: dataSiswaSiswi.UserDetail.tempat,
				tanggalLahir: dateconvert(dataSiswaSiswi.UserDetail.tanggalLahir),
				jenisKelamin: dataSiswaSiswi.UserDetail.jenisKelamin,
				agama: dataSiswaSiswi.UserDetail.agama ? agama.label : null,
				anakKe: dataSiswaSiswi.UserDetail.anakKe,
				jumlahSaudara: dataSiswaSiswi.UserDetail.jumlahSaudara,
				hobi: dataSiswaSiswi.UserDetail.hobi ? hobi.label : null,
				citaCita: dataSiswaSiswi.UserDetail.citaCita ? cita_cita.label : null,
				// dataSekolahSebelumnya: {
					jenjang: dataSiswaSiswi.UserDetail.jenjang ? jenjang.label : null,
					statusSekolah: dataSiswaSiswi.UserDetail.statusSekolah ? status_sekolah.label : null,
					namaSekolah: dataSiswaSiswi.UserDetail.namaSekolah,
					npsn: dataSiswaSiswi.UserDetail.npsn,
					alamatSekolah: dataSiswaSiswi.UserDetail.alamatSekolah,
					kabkotSekolah: dataSiswaSiswi.UserDetail.kabkotSekolah ? uppercaseLetterFirst(kabkota_sekolah.nama) : null,
					noPesertaUN: dataSiswaSiswi.UserDetail.noPesertaUN,
					noSKHUN: dataSiswaSiswi.UserDetail.noSKHUN,
					noIjazah: dataSiswaSiswi.UserDetail.noIjazah,
					nilaiUN: dataSiswaSiswi.UserDetail.nilaiUN,
				// },
				noKK: dataSiswaSiswi.UserDetail.noKK,
				namaKK: dataSiswaSiswi.UserDetail.namaKK,
				// dataOrangtua: {
				// 	dataAyah: {
						namaAyah: dataSiswaSiswi.UserDetail.namaAyah,
						tahunAyah: dataSiswaSiswi.UserDetail.tahunAyah,
						statusAyah: dataSiswaSiswi.UserDetail.statusAyah ? status_ayah.label : null,
						nikAyah: dataSiswaSiswi.UserDetail.nikAyah,
						pendidikanAyah: dataSiswaSiswi.UserDetail.pendidikanAyah ? pendidikan_ayah.label : null,
						pekerjaanAyah: dataSiswaSiswi.UserDetail.pekerjaanAyah ? pekerjaan_ayah.label : null,
						telpAyah: dataSiswaSiswi.UserDetail.telpAyah,
					// },
					// dataIbu: {
						namaIbu: dataSiswaSiswi.UserDetail.namaIbu,
						tahunIbu: dataSiswaSiswi.UserDetail.tahunIbu,
						statusIbu: dataSiswaSiswi.UserDetail.statusIbu ? status_ibu.label : null,
						nikIbu: dataSiswaSiswi.UserDetail.nikIbu,
						pendidikanIbu: dataSiswaSiswi.UserDetail.pendidikanIbu ? pendidikan_ibu.label : null,
						pekerjaanIbu: dataSiswaSiswi.UserDetail.pekerjaanIbu ? pekerjaan_ibu.label : null,
						telpIbu: dataSiswaSiswi.UserDetail.telpIbu,
					// },
					// dataWali: {
						namaWali: dataSiswaSiswi.UserDetail.namaWali,
						tahunWali: dataSiswaSiswi.UserDetail.tahunWali,
						nikWali: dataSiswaSiswi.UserDetail.nikWali,
						pendidikanWali: dataSiswaSiswi.UserDetail.pendidikanWali ? pendidikan_wali.label : null,
						pekerjaanWali: dataSiswaSiswi.UserDetail.pekerjaanWali ? pekerjaan_wali.label : null,
						telpWali: dataSiswaSiswi.UserDetail.telpWali,
				// 	}
				// },
				penghasilan: dataSiswaSiswi.UserDetail.penghasilan ? penghasilan.label : null,
				// dataAlamatOrangtua: {
					telp: dataSiswaSiswi.UserDetail.telp,
					alamat: dataSiswaSiswi.UserDetail.alamat,
					provinsi: dataSiswaSiswi.UserDetail.provinsi ? uppercaseLetterFirst(provinsi.nama) : null,
					kabKota: dataSiswaSiswi.UserDetail.kabKota ? uppercaseLetterFirst(kabkota.nama) : null,
					kecamatan: dataSiswaSiswi.UserDetail.kecamatan ? uppercaseLetterFirst(kecamatan.nama) : null,
					kelurahan: dataSiswaSiswi.UserDetail.kelurahan ? uppercaseLetterFirst(kelurahan.nama) : null,
					kodePos: dataSiswaSiswi.UserDetail.kodePos,
				// },
				kelas: dataSiswaSiswi.UserDetail.kelas,
				// dataLainnya: {
					statusTempatTinggal: dataSiswaSiswi.UserDetail.statusTempatTinggal ? status_tempat_tinggal.label : null,
					jarakRumah: dataSiswaSiswi.UserDetail.jarakRumah ? jarak_rumah.label : null,
					transportasi: dataSiswaSiswi.UserDetail.transportasi ? transportasi.label : null,
				// },
				fotoProfil: dataSiswaSiswi.UserDetail.fotoProfil,
				// berkas: {
					fcIjazah: dataSiswaSiswi.UserDetail.fcIjazah,
					fcSKHUN: dataSiswaSiswi.UserDetail.fcSKHUN,
					fcKK: dataSiswaSiswi.UserDetail.fcKK,
					fcKTPOrtu: dataSiswaSiswi.UserDetail.fcKTPOrtu,
					fcAktaLahir: dataSiswaSiswi.UserDetail.fcAktaLahir,
					fcSKL: dataSiswaSiswi.UserDetail.fcSKL,
				// },
				validasiAkun: dataSiswaSiswi.validasiAkun,
				statusAktif: dataSiswaSiswi.statusAktif,
			}
			// return OK(res, hasil)
			ejs.renderFile(path.join(__dirname, "../../src/views/viewSiswa.ejs"), { dataSiswa: hasil }, (err, data) => {
				if (err) {
					console.log(err);
				} else {
					// console.log(data)
					let options = {
						format: "A4",
						orientation: "portrait",
						quality: "10000",
						border: {
							top: "2cm",
							right: "2.2cm",
							bottom: "2cm",
							left: "2.2cm"
						},
						// header: {
						// 	height: "12mm",
						// },
						// footer: {
						// 	height: "15mm",
						// },
						httpHeaders: {
							"Content-type": "application/pdf",
						},
						type: "pdf",
					};
					pdf.create(data, options).toStream(function(err, stream){
						stream.pipe(res);
					});
				}
			});
		} catch (err) {
			return NOT_FOUND(res, err.message)
		}
	}
}

function testing (models) {
	return async (req, res, next) => {
		let { uid } = req.params
		try {
			const dataSiswaSiswi = await models.User.findOne({
				where: { idUser: uid },
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
				include: [
					{ 
						model: models.Role,
						attributes: ['namaRole'],
						where: { status: true }
					},
					{ 
						model: models.UserDetail,
					},
				],
				order: [
					['createdAt', 'DESC'],
				],
			});
			
			let agama = await _agamaOption({ models, kode: dataSiswaSiswi.UserDetail.agama })
			let hobi = await _hobiOption({ models, kode: dataSiswaSiswi.UserDetail.hobi })
			let cita_cita = await _citacitaOption({ models, kode: dataSiswaSiswi.UserDetail.citaCita })
			let jenjang = await _jenjangsekolahOption({ models, kode: dataSiswaSiswi.UserDetail.jenjang })
			let status_sekolah = await _statussekolahOption({ models, kode: dataSiswaSiswi.UserDetail.statusSekolah })
			let kabkota_sekolah = await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kabkotSekolah })
			let status_ayah = await _statusortuOption({ models, kode: dataSiswaSiswi.UserDetail.statusAyah })
			let status_ibu = await _statusortuOption({ models, kode: dataSiswaSiswi.UserDetail.statusIbu })
			let pendidikan_ayah = await _pendidikanOption({ models, kode: dataSiswaSiswi.UserDetail.pendidikanAyah })
			let pendidikan_ibu = await _pendidikanOption({ models, kode: dataSiswaSiswi.UserDetail.pendidikanIbu })
			let pendidikan_wali = await _pendidikanOption({ models, kode: dataSiswaSiswi.UserDetail.pendidikanWali })
			let pekerjaan_ayah = await _pekerjaanOption({ models, kode: dataSiswaSiswi.UserDetail.pekerjaanAyah })
			let pekerjaan_ibu = await _pekerjaanOption({ models, kode: dataSiswaSiswi.UserDetail.pekerjaanIbu })
			let pekerjaan_wali = await _pekerjaanOption({ models, kode: dataSiswaSiswi.UserDetail.pekerjaanWali })
			let penghasilan = await _penghasilanOption({ models, kode: dataSiswaSiswi.UserDetail.penghasilan })
			let provinsi = await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.provinsi })
			let kabkota = await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kabKota })
			let kecamatan = await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kecamatan })
			let kelurahan = await _wilayahOption({ models, kode: dataSiswaSiswi.UserDetail.kelurahan })
			let status_tempat_tinggal = await _statustempattinggalOption({ models, kode: dataSiswaSiswi.UserDetail.statusTempatTinggal })
			let jarak_rumah = await _jarakrumahOption({ models, kode: dataSiswaSiswi.UserDetail.jarakRumah })
			let transportasi = await _transportasiOption({ models, kode: dataSiswaSiswi.UserDetail.transportasi })

			const hasil = {
				url: BASE_URL,
				idUser: dataSiswaSiswi.idUser,
				consumerType: dataSiswaSiswi.consumerType,
				nikSiswa: dataSiswaSiswi.UserDetail.nikSiswa,
				nomorInduk: dataSiswaSiswi.UserDetail.nomorInduk,
				namaRole: dataSiswaSiswi.Role.namaRole,
				nama: dataSiswaSiswi.nama,
				username: dataSiswaSiswi.username,
				email: dataSiswaSiswi.email,
				password: dataSiswaSiswi.password,
				kataSandi: dataSiswaSiswi.kataSandi,
				tempat: dataSiswaSiswi.UserDetail.tempat,
				tanggalLahir: dateconvert(dataSiswaSiswi.UserDetail.tanggalLahir),
				jenisKelamin: dataSiswaSiswi.UserDetail.jenisKelamin,
				agama: dataSiswaSiswi.UserDetail.agama ? agama.label : null,
				anakKe: dataSiswaSiswi.UserDetail.anakKe,
				jumlahSaudara: dataSiswaSiswi.UserDetail.jumlahSaudara,
				hobi: dataSiswaSiswi.UserDetail.hobi ? hobi.label : null,
				citaCita: dataSiswaSiswi.UserDetail.citaCita ? cita_cita.label : null,
				// dataSekolahSebelumnya: {
					jenjang: dataSiswaSiswi.UserDetail.jenjang ? jenjang.label : null,
					statusSekolah: dataSiswaSiswi.UserDetail.statusSekolah ? status_sekolah.label : null,
					namaSekolah: dataSiswaSiswi.UserDetail.namaSekolah,
					npsn: dataSiswaSiswi.UserDetail.npsn,
					alamatSekolah: dataSiswaSiswi.UserDetail.alamatSekolah,
					kabkotSekolah: dataSiswaSiswi.UserDetail.kabkotSekolah ? uppercaseLetterFirst(kabkota_sekolah.nama) : null,
					noPesertaUN: dataSiswaSiswi.UserDetail.noPesertaUN,
					noSKHUN: dataSiswaSiswi.UserDetail.noSKHUN,
					noIjazah: dataSiswaSiswi.UserDetail.noIjazah,
					nilaiUN: dataSiswaSiswi.UserDetail.nilaiUN,
				// },
				noKK: dataSiswaSiswi.UserDetail.noKK,
				namaKK: dataSiswaSiswi.UserDetail.namaKK,
				// dataOrangtua: {
				// 	dataAyah: {
						namaAyah: dataSiswaSiswi.UserDetail.namaAyah,
						tahunAyah: dataSiswaSiswi.UserDetail.tahunAyah,
						statusAyah: dataSiswaSiswi.UserDetail.statusAyah ? status_ayah.label : null,
						nikAyah: dataSiswaSiswi.UserDetail.nikAyah,
						pendidikanAyah: dataSiswaSiswi.UserDetail.pendidikanAyah ? pendidikan_ayah.label : null,
						pekerjaanAyah: dataSiswaSiswi.UserDetail.pekerjaanAyah ? pekerjaan_ayah.label : null,
						telpAyah: dataSiswaSiswi.UserDetail.telpAyah,
					// },
					// dataIbu: {
						namaIbu: dataSiswaSiswi.UserDetail.namaIbu,
						tahunIbu: dataSiswaSiswi.UserDetail.tahunIbu,
						statusIbu: dataSiswaSiswi.UserDetail.statusIbu ? status_ibu.label : null,
						nikIbu: dataSiswaSiswi.UserDetail.nikIbu,
						pendidikanIbu: dataSiswaSiswi.UserDetail.pendidikanIbu ? pendidikan_ibu.label : null,
						pekerjaanIbu: dataSiswaSiswi.UserDetail.pekerjaanIbu ? pekerjaan_ibu.label : null,
						telpIbu: dataSiswaSiswi.UserDetail.telpIbu,
					// },
					// dataWali: {
						namaWali: dataSiswaSiswi.UserDetail.namaWali,
						tahunWali: dataSiswaSiswi.UserDetail.tahunWali,
						nikWali: dataSiswaSiswi.UserDetail.nikWali,
						pendidikanWali: dataSiswaSiswi.UserDetail.pendidikanWali ? pendidikan_wali.label : null,
						pekerjaanWali: dataSiswaSiswi.UserDetail.pekerjaanWali ? pekerjaan_wali.label : null,
						telpWali: dataSiswaSiswi.UserDetail.telpWali,
				// 	}
				// },
				penghasilan: dataSiswaSiswi.UserDetail.penghasilan ? penghasilan.label : null,
				// dataAlamatOrangtua: {
					telp: dataSiswaSiswi.UserDetail.telp,
					alamat: dataSiswaSiswi.UserDetail.alamat,
					provinsi: dataSiswaSiswi.UserDetail.provinsi ? uppercaseLetterFirst(provinsi.nama) : null,
					kabKota: dataSiswaSiswi.UserDetail.kabKota ? uppercaseLetterFirst(kabkota.nama) : null,
					kecamatan: dataSiswaSiswi.UserDetail.kecamatan ? uppercaseLetterFirst(kecamatan.nama) : null,
					kelurahan: dataSiswaSiswi.UserDetail.kelurahan ? uppercaseLetterFirst(kelurahan.nama) : null,
					kodePos: dataSiswaSiswi.UserDetail.kodePos,
				// },
				kelas: dataSiswaSiswi.UserDetail.kelas,
				// dataLainnya: {
					statusTempatTinggal: dataSiswaSiswi.UserDetail.statusTempatTinggal ? status_tempat_tinggal.label : null,
					jarakRumah: dataSiswaSiswi.UserDetail.jarakRumah ? jarak_rumah.label : null,
					transportasi: dataSiswaSiswi.UserDetail.transportasi ? transportasi.label : null,
				// },
				fotoProfil: dataSiswaSiswi.UserDetail.fotoProfil,
				// berkas: {
					fcIjazah: dataSiswaSiswi.UserDetail.fcIjazah,
					fcSKHUN: dataSiswaSiswi.UserDetail.fcSKHUN,
					fcKK: dataSiswaSiswi.UserDetail.fcKK,
					fcKTPOrtu: dataSiswaSiswi.UserDetail.fcKTPOrtu,
					fcAktaLahir: dataSiswaSiswi.UserDetail.fcAktaLahir,
					fcSKL: dataSiswaSiswi.UserDetail.fcSKL,
				// },
				validasiAkun: dataSiswaSiswi.validasiAkun,
				statusAktif: dataSiswaSiswi.statusAktif,
			}
			// return OK(res, hasil)
			ejs.renderFile(path.join(__dirname, "../../src/views/viewSiswa.ejs"), { dataSiswa: hasil }, (err, data) => {
				if (err) {
					console.log(err);
				} else {
					// console.log(data)
					let options = {
						format: "A4",
						orientation: "portrait",
						quality: "10000",
						border: {
							top: "2cm",
							right: "2.2cm",
							bottom: "2cm",
							left: "2.2cm"
						},
						// header: {
						// 	height: "12mm",
						// },
						// footer: {
						// 	height: "15mm",
						// },
						httpHeaders: {
							"Content-type": "application/pdf",
						},
						type: "pdf",
					};
					pdf.create(data, options).toStream(function(err, stream){
						stream.pipe(res);
					});
				}
			});
		} catch (err) {
			return NOT_FOUND(res, err.message)
		}
	}
}

module.exports = {
  getAdmin,
  getAdminbyUid,
  postAdmin,
  getStruktural,
  getStrukturalbyUid,
  postStruktural,
  getSiswaSiswi,
  getSiswaSiswibyUid,
  postSiswaSiswi,
  downloadTemplate,
  importExcel,
  pdfCreate,
  testing,
}