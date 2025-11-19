const {
	response,
	OK,
	NOT_FOUND,
	NO_CONTENT,
	UNPROCESSABLE
} = require('@triyogagp/backend-common/utils/response.utils');
const {
	encrypt,
	decrypt,
	shuffleArray,
	getRandomArray,
	makeRandom,
	dateconvert,
	convertDate,
	convertDate3,
	convertDateTime2,
	splitTime,
	createKSUID,
	pembilang,
	makeRandomAngka,
	uppercaseLetterFirst2,
	buildMysqlResponseWithPagination,
	paginate,
	buildOrderQuery,
} = require('@triyogagp/backend-common/utils/helper.utils');
const {
	_allOption,
	_allOptionCms,
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
	_KelasListOption,
	_wilayahOption,
	_wilayah2023Option,
} = require('../controllers/helper.service')
const { validateRequestBodyPayload } = require('../middleware/validator')
const { Op, literal } = require('sequelize')
const sequelize = require('sequelize')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const excel = require("exceljs");
const ejs = require("ejs");
const pdf = require("html-pdf");
const path = require("path");
const fs = require('fs');
const _ = require('lodash');
const { logger } = require('../configs/db.winston')
const nodeGeocoder = require('node-geocoder');
const readXlsxFile = require('read-excel-file/node');
const { sequelizeInstance } = require('../configs/db.config');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const id = require('dayjs/locale/id');
const dotenv = require('dotenv');
dotenv.config();
const BASE_URL = process.env.BASE_URL

dayjs.extend(utc);
dayjs.extend(timezone);

async function dataCMSSettings(params) {
	const { models } = params
	const cms_setting = {}
	const dataCMS = await models.CMSSetting.findAll();
	dataCMS.forEach(str => {
		let eva = JSON.parse(str.setting)
		if(eva.label){
			cms_setting[str.kode] = eva
		}else{
			cms_setting[str.kode] = eva.value
		}
	})
	return cms_setting
}

function getDashboard (models) {
  return async (req, res, next) => {
		let { kelas } = req.query
		let where = {}
    try {
			const { userID, consumerType } = req.JWTDecoded
			const checkUser = await models.UserDetail.findOne({
				where: { idUser: userID },
				attributes: ['jabatanGuru', 'mengajarBidang', 'mengajarKelas']
			})
			let kelasData = []
			let data = ''
			if(consumerType === 3){
				let jabatan = checkUser.jabatanGuru.split(', ')
				if(jabatan.includes('1') || jabatan.includes('2')){
					const dataKelas = await models.Kelas.findAll({ where: { status: true }, attributes: ['kelas'] });
					dataKelas.map(val => {
						let key = val.kelas.split('-')[0]
						if(!_.includes(kelasData, key)){
							kelasData.push(key)
						}
					})
				}else{
					data = checkUser.mengajarKelas.split(', ')
					data.map(val => {
						let key = val.split('-')[0]
						if(!_.includes(kelasData, key)){
							kelasData.push(key)
						}
					})
				}
			}

			let whereUserDetail = {}
			if(kelas){
				whereUserDetail.kelas = kelas.split(', ')
			}
			const dataUser = await models.User.findAll({
				where: { statusAktif: true },
				include: [
					{ 
						model: models.UserDetail,
						where: whereUserDetail,
					},
				],
			});
			const dataKelas = await models.Kelas.findAll({ where: { status: true } });
			
			where = consumerType === 1 || consumerType === 2 ? { statusAktif: true } : checkUser.mengajarBidang ? { statusAktif: true, mapel: checkUser.mengajarBidang.split(', '), kelas: kelasData } : { statusAktif: true, kelas: kelasData }
			const dataQuestionExam = await models.QuestionExam.findAll({ where });

			const resultUser = dataUser.reduce((memo, data) => {
				const tmp = memo
				const { mutasiAkun, validasiAkun, consumerType: typeConsumer } = data
				const { jenisKelamin } = data.UserDetail
				if((typeConsumer === 1 || typeConsumer === 2)) tmp.admin += 1
				if(typeConsumer === 3) tmp.struktural += 1
				if(mutasiAkun && typeConsumer === 4) tmp.siswa_mutasi_1 += 1
				if(!mutasiAkun && typeConsumer === 4) tmp.siswa_mutasi_0 += 1
				if(validasiAkun && typeConsumer === 4) tmp.siswa_validasi_1 += 1
				if(!validasiAkun && typeConsumer === 4) tmp.siswa_validasi_0 += 1
				if(jenisKelamin === 'Laki - Laki' && typeConsumer === 4) tmp.siswa_laki_laki += 1
				if(jenisKelamin === 'Perempuan' && typeConsumer === 4) tmp.siswa_perempuan += 1
				return tmp
			}, {
				admin: 0,
				struktural: 0,
				siswa_mutasi_1: 0,
				siswa_mutasi_0: 0,
				siswa_validasi_1: 0,
				siswa_validasi_0: 0,
				siswa_laki_laki: 0,
				siswa_perempuan: 0,
			})

			const resultKelas = dataKelas.reduce((memo, data) => {
				const tmp = memo
				const { kelas } = data
				let split = kelas.split('-')
				if(split[0] === '7') tmp.kelas_7 += 1
				if(split[0] === '8') tmp.kelas_8 += 1
				if(split[0] === '9') tmp.kelas_9 += 1
				return tmp
			}, {
				kelas_7: 0,
				kelas_8: 0,
				kelas_9: 0,
			})

			const resultQuestionExam = dataQuestionExam.reduce((memo, data) => {
				const tmp = memo
				const { jenis } = data
				if(jenis === 'pilihan ganda') tmp.pilihan_ganda += 1
				if(jenis === 'essay') tmp.essay += 1
				if(jenis === 'menjodohkan') tmp.menjodohkan += 1
				if(jenis === 'benar salah') tmp.bs += 1
				return tmp
			}, {
				pilihan_ganda: 0,
				essay: 0,
				menjodohkan: 0,
				bs: 0,
			})

			const response = {
				jmlAdmin: resultUser.admin,
				jmlStruktural: resultUser.struktural,
				jmlSiswa: {
					mutation: resultUser.siswa_mutasi_1,
					not_mutation: resultUser.siswa_mutasi_0,
					validation: resultUser.siswa_validasi_1,
					not_validation: resultUser.siswa_validasi_0,
					laki_laki: resultUser.siswa_laki_laki,
					perempuan: resultUser.siswa_perempuan,
				},
				jmlKelas: {
					kelas_7: resultKelas.kelas_7,
					kelas_8: resultKelas.kelas_8,
					kelas_9: resultKelas.kelas_9,
				},
				jmlQuestionExam: {
					jenisPG: resultQuestionExam.pilihan_ganda,
					jenisEssay: resultQuestionExam.essay,
					jenisMenjodohkan: resultQuestionExam.menjodohkan,
					jenisBS: resultQuestionExam.bs,
				},
			}

			return OK(res, response);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getAdmin (models) {
  return async (req, res, next) => {
		let { page = 1, limit = 20, sort = '', keyword } = req.query
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

			const mappingSortField = [
				'nama',
				['namaRole', sequelize.literal('`Role.namaRole`')],
				'statusAktif',
			]

			const orders = buildOrderQuery(sort, mappingSortField)
			
			if(orders.length === 0){
				orders.push(['createdAt', 'DESC'])
			}

			where = { ...whereKey, consumerType: [1, 2] }

      const { count, rows: dataAdmin } = await models.User.findAndCountAll({
				where,
				// attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
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
				order: orders,
				limit: parseInt(limit),
				offset: OFFSET,
			});

			// return OK(res, dataAdmin)
			const arrangeResponse = item => {
				return item.map(async val => {
					const { UserDetail, Role } = val
					return {
						idUser: val.idUser,
						consumerType: val.consumerType,
						namaRole: Role.namaRole,
						nama: val.nama,
						username: val.username,
						email: val.email,
						password: val.password,
						kataSandi: val.kataSandi,
						tempat: UserDetail.tempat,
						tanggalLahir: UserDetail.tanggalLahir,
						jenisKelamin: UserDetail.jenisKelamin,
						agama: await _allOptionCms(models, { where: { kode: 'agama' } }, { param: UserDetail.agama }),
						telp: UserDetail.telp,
						alamat: UserDetail.alamat,
						provinsi: await _wilayah2023Option({ models, kode: UserDetail.provinsi, bagian: 'provinsi' }),
						kabKota: await _wilayah2023Option({ models, kode: UserDetail.kabKota, bagian: 'kabkota' }),
						kecamatan: await _wilayah2023Option({ models, kode: UserDetail.kecamatan, bagian: 'kecamatan' }),
						kelurahan: await _wilayah2023Option({ models, kode: UserDetail.kelurahan, bagian: 'keldes' }),
						kodePos: UserDetail.kodePos,
						fotoProfil: UserDetail.fotoProfil ? `${BASE_URL}image/${UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
						isActive: val.isActive,
						statusAktif: val.statusAktif,
						flag: val.deleteBy !== null || val.deletedAt !== null,
					}
				})
			}
			
			const responseData = buildMysqlResponseWithPagination(
				await Promise.all(arrangeResponse(dataAdmin)),
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

			const { UserDetail, Role } = dataAdmin
			return OK(res, {
				idUser: dataAdmin.idUser,
				consumerType: dataAdmin.consumerType,
				namaRole: Role.namaRole,
				nama: dataAdmin.nama,
				username: dataAdmin.username,
				email: dataAdmin.email,
				password: dataAdmin.password,
				kataSandi: dataAdmin.kataSandi,
				tempat: UserDetail.tempat,
				tanggalLahir: UserDetail.tanggalLahir,
				jenisKelamin: UserDetail.jenisKelamin,
				agama: await _allOptionCms(models, { where: { kode: 'agama' } }, { param: UserDetail.agama }),
				telp: UserDetail.telp,
				alamat: UserDetail.alamat,
				provinsi: await _wilayah2023Option({ models, kode: UserDetail.provinsi, bagian: 'provinsi' }),
				kabKota: await _wilayah2023Option({ models, kode: UserDetail.kabKota, bagian: 'kabkota' }),
				kecamatan: await _wilayah2023Option({ models, kode: UserDetail.kecamatan, bagian: 'kecamatan' }),
				kelurahan: await _wilayah2023Option({ models, kode: UserDetail.kelurahan, bagian: 'keldes' }),
				kodePos: UserDetail.kodePos,
				fotoProfil: UserDetail.fotoProfil ? `${BASE_URL}image/${UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
				isActive: dataAdmin.isActive,
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
    try {
			if((user.jenis == 'ADD' || user.jenis == 'EDIT') && validateRequestBodyPayload(req)) return UNPROCESSABLE(res, validateRequestBodyPayload(req))
			const { userID } = req.JWTDecoded
			let salt, hashPassword, kirimdataUser, kirimdataUserDetail;
			if(user.jenis == 'ADD'){
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
					createBy: userID,
				}
				kirimdataUserDetail = {
					idUserDetail: makeRandom(10),
					idUser: user.idUser,
					nomorInduk: '-',
					tempat: userdetail.tempat,
					tanggalLahir: convertDate(userdetail.tanggalLahir),
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
				salt = await bcrypt.genSalt();
				hashPassword = await bcrypt.hash(user.password, salt);
				kirimdataUser = {
					consumerType: user.consumerType,
					nama: user.nama,
					email: user.email,
					username: user.username,
					password: hashPassword,
					kataSandi: encrypt(user.password),
					statusAktif: 1,
					updateBy: userID,
				}
				kirimdataUserDetail = {
					tempat: userdetail.tempat,
					tanggalLahir: convertDate(userdetail.tanggalLahir),
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
			}else if(user.jenis == 'DELETESOFT'){
				kirimdataUser = {
					statusAktif: 0,
					deleteBy: userID,
					deletedAt: new Date(),
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })	
			}else if(user.jenis == 'DELETEHARD'){
				await sequelizeInstance.transaction(async trx => {
					const datauser = await models.UserDetail.findOne({
						where: { idUser: user.idUser },
					}, { transaction: trx });
					const { fotoProfil } = datauser
					if(fotoProfil){
						let path_dir = path.join(__dirname, `../public/image/${user.idUser}`);
						fs.readdirSync(path_dir, { withFileTypes: true });
						fs.rm(path_dir, { recursive: true, force: true }, (err) => {
							if (err) {
								console.log(err);
							}
						});
					}
					await models.User.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.UserDetail.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
				})
			}else if(user.jenis == 'STATUSRECORD'){
				kirimdataUser = { 
					statusAktif: user.kondisi, 
					updateBy: userID
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
		let { page = 1, limit = 20, sort = '', keyword } = req.query
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

			const mappingSortField = [
				'nama',
				['nomorInduk', sequelize.literal('`UserDetail.nomorInduk`')],
				'statusAktif',
			]

			const orders = buildOrderQuery(sort, mappingSortField)
			
			if(orders.length === 0){
				orders.push(['createdAt', 'DESC'])
			}

			where = { ...whereKey, consumerType: 3 }

      const { count, rows: dataStruktural } = await models.User.findAndCountAll({
				where,
				// attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
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
				order: orders,
				limit: parseInt(limit),
				offset: OFFSET,
			});

			// return OK(res, dataStruktural)
			const arrangeResponse = item => {
				return item.map(async val => {
					const { UserDetail, Role } = val
					return {
						idUser: val.idUser,
						consumerType: val.consumerType,
						nomorInduk: UserDetail.nomorInduk,
						namaRole: Role.namaRole,
						nama: val.nama,
						username: val.username,
						email: val.email,
						password: val.password,
						kataSandi: val.kataSandi,
						tempat: UserDetail.tempat,
						tanggalLahir: UserDetail.tanggalLahir,
						jenisKelamin: UserDetail.jenisKelamin,
						agama: await _allOptionCms(models, { where: { kode: 'agama' } }, { param: UserDetail.agama }),
						telp: UserDetail.telp,
						alamat: UserDetail.alamat,
						provinsi: await _wilayah2023Option({ models, kode: UserDetail.provinsi, bagian: 'provinsi' }),
						kabKota: await _wilayah2023Option({ models, kode: UserDetail.kabKota, bagian: 'kabkota' }),
						kecamatan: await _wilayah2023Option({ models, kode: UserDetail.kecamatan, bagian: 'kecamatan' }),
						kelurahan: await _wilayah2023Option({ models, kode: UserDetail.kelurahan, bagian: 'keldes' }),
						kodePos: UserDetail.kodePos,
						pendidikanGuru: await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail.pendidikanGuru }),
						jabatanGuru: UserDetail.jabatanGuru ? await _allOptionCms(models, { where: { kode: 'jabatan' } }, { param: UserDetail.jabatanGuru }) : null,
						mengajarBidang: UserDetail.mengajarBidang ? await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: UserDetail.mengajarBidang }) : null,
						mengajarKelas: UserDetail.mengajarKelas,
						waliKelas: UserDetail.waliKelas,
						fotoProfil: UserDetail.fotoProfil ? `${BASE_URL}image/${UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
						signature: UserDetail.signature ? `${BASE_URL}image/${UserDetail.signature}` : null,
						isActive: val.isActive,
						statusAktif: val.statusAktif,
						flag: val.deleteBy !== null || val.deletedAt !== null,
					}
				})
			}

			const responseData = buildMysqlResponseWithPagination(
				await Promise.all(arrangeResponse(dataStruktural)),
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
			const { UserDetail, Role } = dataStruktural
			let jabatan = dataStruktural.UserDetail.jabatanGuru === null ? null : await _allOptionCms(models, { where: { kode: 'jabatan' } }, { param: UserDetail.jabatanGuru })
			let mengajar = UserDetail.mengajarBidang === null ? null : await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: UserDetail.mengajarBidang })
			return OK(res, {
				idUser: dataStruktural.idUser,
				consumerType: dataStruktural.consumerType,
				nomorInduk: UserDetail.nomorInduk,
				namaRole: Role.namaRole,
				nama: dataStruktural.nama,
				username: dataStruktural.username,
				email: dataStruktural.email,
				password: dataStruktural.password,
				kataSandi: dataStruktural.kataSandi,
				tempat: UserDetail.tempat,
				tanggalLahir: UserDetail.tanggalLahir,
				jenisKelamin: UserDetail.jenisKelamin,
				agama: await _allOptionCms(models, { where: { kode: 'agama' } }, { param: UserDetail.agama }),
				telp: UserDetail.telp,
				alamat: UserDetail.alamat,
				provinsi: await _wilayah2023Option({ models, kode: UserDetail.provinsi, bagian: 'provinsi' }),
				kabKota: await _wilayah2023Option({ models, kode: UserDetail.kabKota, bagian: 'kabkota' }),
				kecamatan: await _wilayah2023Option({ models, kode: UserDetail.kecamatan, bagian: 'kecamatan' }),
				kelurahan: await _wilayah2023Option({ models, kode: UserDetail.kelurahan, bagian: 'keldes' }),
				kodePos: UserDetail.kodePos,
				pendidikanGuru: await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail.pendidikanGuru }),
				jabatanGuru: UserDetail.jabatanGuru !== null ? jabatan.map(str => { return str.value; }) : null,
				mengajarBidang: UserDetail.mengajarBidang !== null ? mengajar.map(str => { return str.value; }) : null,
				mengajarKelas: UserDetail.mengajarKelas,
				waliKelas: UserDetail.waliKelas,
				fotoProfil: UserDetail.fotoProfil ? `${BASE_URL}image/${UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
				signature: UserDetail.signature ? `${BASE_URL}image/${UserDetail.signature}` : null,
				isActive: dataStruktural.isActive,
				statusAktif: dataStruktural.statusAktif,
			})
    } catch (err) {
			console.log(err);
			return NOT_FOUND(res, err.message)
    }
  }  
}

function postStruktural (models) {
  return async (req, res, next) => {
		let { user, userdetail } = req.body
    try {
			if((user.jenis == 'ADD' || user.jenis == 'EDIT') && validateRequestBodyPayload(req)) return UNPROCESSABLE(res, validateRequestBodyPayload(req))
			const { userID } = req.JWTDecoded
			let salt, hashPassword, kirimdataUser, kirimdataUserDetail;
			if(user.jenis == 'ADD'){
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
					createBy: userID,
				}
				kirimdataUserDetail = {
					idUserDetail: makeRandom(10),
					idUser: user.idUser,
					nomorInduk: userdetail.nomorInduk,
					// nomorInduk: `1992023${makeRandomAngka(13)}`,
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

				let kumpulan = []
				let kumpul = []
				if(userdetail.mengajarBidang && userdetail.mengajarKelas){
					let kelas = userdetail.mengajarKelas.split(', ')
					const dataMengajar = await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: userdetail.mengajarBidang })
					dataMengajar.forEach(mapel => {
						kelas.forEach(kelasItem => {
							kumpul.push({
								idUser: user.idUser,
								mapel: mapel.value,
								kelas: kelasItem
							})
						})
					})
					
					await Promise.all(kumpul.map(async val => {
						const dataJadwal = await models.JadwalMengajar.findOne({ 
							where: { idUser: val.idUser, mapel: val.mapel, kelas: val.kelas, status: true },
							attributes: ['idJadwalMengajar', 'idUser', 'mapel', 'kelas', 'jumlahTugas', 'status'],
							raw: true
						})
						
						if(!dataJadwal){
							kumpulan.push({
								idJadwalMengajar: makeRandom(10),
								idUser: val.idUser,
								mapel: val.mapel,
								kelas: val.kelas,
								jumlahTugas: 10,
								status: true
							})
						}else{
							kumpulan.push(dataJadwal)
						}
					}))
				}

				await sequelizeInstance.transaction(async trx => {
					await models.User.create(kirimdataUser, { transaction: trx })
					await models.UserDetail.create(kirimdataUserDetail, { transaction: trx })
					if(userdetail.mengajarBidang && userdetail.mengajarKelas){
						await models.JadwalMengajar.bulkCreate(_.orderBy(kumpulan, ['mapel', 'kelas'], ['asc', 'asc']), { transaction: trx })
					}
				})
			}else if(user.jenis == 'EDIT'){
				salt = await bcrypt.genSalt();
				hashPassword = await bcrypt.hash(user.password, salt);
				kirimdataUser = {
					consumerType: user.consumerType,
					nama: user.nama,
					email: user.email,
					username: user.username,
					password: hashPassword,
					kataSandi: encrypt(user.password),
					statusAktif: 1,
					updateBy: userID,
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

				let kumpul = []
				let kumpulan = []
				if(userdetail.mengajarBidang && userdetail.mengajarKelas){
					let kelas = userdetail.mengajarKelas.split(', ')
					const dataMengajar = await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: userdetail.mengajarBidang })					
					dataMengajar.forEach(mapel => {
						kelas.forEach(kelasItem => {
							kumpul.push({
								idUser: user.idUser,
								mapel: mapel.value,
								kelas: kelasItem
							})
						})
					})
					
					await Promise.all(kumpul.map(async val => {
						const dataJadwal = await models.JadwalMengajar.findOne({ 
							where: { idUser: val.idUser, mapel: val.mapel, kelas: val.kelas, status: true },
							attributes: ['idJadwalMengajar', 'idUser', 'mapel', 'kelas', 'jumlahTugas', 'status'],
							raw: true
						})
						
						if(!dataJadwal){
							kumpulan.push({
								idJadwalMengajar: makeRandom(10),
								idUser: val.idUser,
								mapel: val.mapel,
								kelas: val.kelas,
								jumlahTugas: 10,
								status: true
							})
						}else{
							kumpulan.push(dataJadwal)
						}
					}))
				}

				await sequelizeInstance.transaction(async trx => {
					await models.User.update(kirimdataUser, { where: { idUser: user.idUser } }, { transaction: trx })
					await models.UserDetail.update(kirimdataUserDetail, { where: { idUser: user.idUser } }, { transaction: trx })
					await models.JadwalMengajar.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					if(userdetail.mengajarBidang && userdetail.mengajarKelas){
						await models.JadwalMengajar.bulkCreate(_.orderBy(kumpulan, ['mapel', 'kelas'], ['asc', 'asc']), { transaction: trx })
					}
				})
			}else if(user.jenis == 'DELETESOFT'){
				kirimdataUser = {
					statusAktif: 0,
					deleteBy: userID,
					deletedAt: new Date(),
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })	
			}else if(user.jenis == 'DELETEHARD'){
				await sequelizeInstance.transaction(async trx => {
					const datauser = await models.UserDetail.findOne({
						where: { idUser: user.idUser },
					}, { transaction: trx });
					const { fotoProfil } = datauser
					if(fotoProfil){
						let path_dir = path.join(__dirname, `../public/image/${user.idUser}`);
						fs.readdirSync(path_dir, { withFileTypes: true });
						fs.rm(path_dir, { recursive: true, force: true }, (err) => {
							if (err) {
								console.log(err);
							}
						});
					}
					await models.User.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.UserDetail.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.JadwalMengajar.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.Notifikasi.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.QuestionExam.destroy({ where: { createBy: user.idUser } }, { transaction: trx });
					await models.Absensi.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.DataKartu.update({ idUser: null, use: 0 }, { where: { idUser: user.idUser } }, { transaction: trx })	
				})
			}else if(user.jenis == 'DELETESELECTEDHARD'){
				await sequelizeInstance.transaction(async trx => {
					user.idUser.map(async str => {
						const datauser = await models.UserDetail.findOne({
							where: { idUser: str },
						}, { transaction: trx });
						const { fotoProfil } = datauser
						if(fotoProfil){
							let path_dir = path.join(__dirname, `../public/image/${str}`);
							fs.readdirSync(path_dir, { withFileTypes: true });
							fs.rm(path_dir, { recursive: true, force: true }, (err) => {
								if (err) {
									console.log(err);
								}
							});
						}
						await models.User.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.UserDetail.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.JadwalMengajar.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.Notifikasi.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.QuestionExam.destroy({ where: { createBy: str } }, { transaction: trx });
						await models.Absensi.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.DataKartu.update({ idUser: null, use: 0 }, { where: { idUser: str } }, { transaction: trx })	
					})
				})
			}else if(user.jenis == 'STATUSRECORD'){
				kirimdataUser = { 
					statusAktif: user.kondisi, 
					updateBy: userID 
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
		let { page = 1, limit = 20, sort = '', keyword, kelas, filter } = req.query
    let where = {}
    try {			
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined

			let whereUserDetail = {}
			let wherePlus = {}
			let whereFilter = {}

			const mappingSortField = [
				'nama',
				['nomorInduk', sequelize.literal('`UserDetail.nomorInduk`')],
				['kelas', sequelize.literal('`UserDetail.kelas`')],
				'statusAktif',
			]

			const orders = buildOrderQuery(sort, mappingSortField)
			
			if(orders.length === 0){
				orders.push(['createdAt', 'DESC'])
			}

			if(kelas){
				whereUserDetail.kelas = kelas.split(', ')
				wherePlus.mutasiAkun = false
				wherePlus.statusAktif = true
				orders.push(['nama', 'ASC'])
			}

			if(filter){
				let splitFilter = filter.split('-')
				if(splitFilter[0] === 'status') {
					whereFilter.statusAktif = splitFilter[1] === 'true' ? true : false
				}else if(splitFilter[0] === 'validasi') {
					whereFilter.validasiAkun = splitFilter[1] === 'true' ? true : false
				}else if(splitFilter[0] === 'mutasi') {
					whereFilter.mutasiAkun = splitFilter[1] === 'true' ? true : false
				}
			}

			const whereKey = keyword ? {
				[Op.or]: [
					{ nama : { [Op.like]: `%${keyword}%` }},
					{ username : { [Op.like]: `%${keyword}%` }},
					{ email : { [Op.like]: `%${keyword}%` }},
					{ '$UserDetail.nomor_induk$' : { [Op.like]: `%${keyword}%` }},
					{ '$UserDetail.kelas$' : { [Op.like]: `%${keyword}%` }},
				]
			} : {}

			where = { ...whereKey, consumerType: 4, ...wherePlus, ...whereFilter }

      const { count, rows: dataSiswaSiswi } = await models.User.findAndCountAll({
				where,
				// attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'updatedAt', 'deletedAt'] },
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
				order: orders,
				limit: parseInt(limit),
				offset: OFFSET,
			});

			// return OK(res, dataSiswaSiswi)
			const datapenilaian = async (idUser, kelas) => {
				const cms_setting = await dataCMSSettings({ models })
				const getNilai = await models.Nilai.findAll({ where: { idUser } })
				const dataPenilaian = await Promise.all(getNilai.map(async k => {
					const { mapel, dataNilai, dataKehadiran, dataKoreksiNilai } = k.dataValues
					const dataJadwal = await models.JadwalMengajar.findOne({ where: { kelas, mapel, status: true } });
					// const mengajar = await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: mapel })
					let nilai = JSON.parse(dataNilai)
					let kehadiran = JSON.parse(dataKehadiran)
					let koreksi = JSON.parse(dataKoreksiNilai)
					let semester = cms_setting.semester.label.toLowerCase()

					return {
						// mapel: mengajar[0]?.label || [],
						mapel,
						semester,
						dataNK: {
							nilai: nilai.filter(str => str.semester === semester)[0].nilai,
							kehadiran: kehadiran.filter(str => str.semester === semester)[0].kehadiran,
							koreksi: koreksi.filter(str => str.semester === semester)[0].koreksi,
						},
						dataJadwal: {
							jumlahTugas: dataJadwal?.jumlahTugas || '0',
							kkm: dataJadwal?.kkm || cms_setting?.kkm,
						},
					}
				}))
				return dataPenilaian
			} 

			const arrangeResponse = item => {
				return item.map(async val => {
					const { UserDetail, Role } = val
					return {
						dataPenilaian: await datapenilaian(val.idUser, UserDetail.kelas),
						idUser: val.idUser,
						consumerType: val.consumerType,
						nikSiswa: UserDetail.nikSiswa,
						nomorInduk: UserDetail.nomorInduk,
						namaRole: Role.namaRole,
						nama: val.nama,
						username: val.username,
						email: val.email,
						password: val.password,
						kataSandi: val.kataSandi,
						tempat: UserDetail.tempat,
						tanggalLahir: UserDetail.tanggalLahir,
						jenisKelamin: UserDetail.jenisKelamin,
						agama: await _allOptionCms(models, { where: { kode: 'agama' } }, { param: UserDetail.agama }),
						anakKe: UserDetail.anakKe,
						jumlahSaudara: UserDetail.jumlahSaudara,
						hobi: UserDetail.hobi ? await _allOptionCms(models, { where: { kode: 'hobi' } }, { param: UserDetail.hobi }) : null,
						citaCita: UserDetail.citaCita ? await _allOptionCms(models, { where: { kode: 'citacita' } }, { param: UserDetail.citaCita }) : null,
						dataSekolahSebelumnya: {
							jenjang: UserDetail.jenjang ? await _allOptionCms(models, { where: { kode: 'jenjangsekolah' } }, { param: UserDetail.jenjang }) : null,
							statusSekolah: UserDetail.statusSekolah ? await _allOptionCms(models, { where: { kode: 'status_sekolah' } }, { param: UserDetail.statusSekolah }) : null,
							namaSekolah: UserDetail.namaSekolah,
							npsn: UserDetail.npsn,
							alamatSekolah: UserDetail.alamatSekolah,
							kabkotSekolah: await _wilayah2023Option({ models, kode: UserDetail.kabkotSekolah, bagian: 'kabkota' }),
							noPesertaUN: UserDetail.noPesertaUN,
							noSKHUN: UserDetail.noSKHUN,
							noIjazah: UserDetail.noIjazah,
							nilaiUN: UserDetail.nilaiUN,
						},
						noKK: UserDetail.noKK,
						namaKK: UserDetail.namaKK,
						dataOrangtua: {
							dataAyah: {
								namaAyah: UserDetail.namaAyah,
								tahunAyah: UserDetail.tahunAyah,
								statusAyah: await _allOptionCms(models, { where: { kode: 'statusorangtua' } }, { param: UserDetail.statusAyah }),
								nikAyah: UserDetail.nikAyah,
								pendidikanAyah: await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail.pendidikanAyah }),
								pekerjaanAyah: await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail.pekerjaanAyah }),
								telpAyah: UserDetail.telpAyah,
							},
							dataIbu: {
								namaIbu: UserDetail.namaIbu,
								tahunIbu: UserDetail.tahunIbu,
								statusIbu: await _allOptionCms(models, { where: { kode: 'statusorangtua' } }, { param: UserDetail.statusIbu }),
								nikIbu: UserDetail.nikIbu,
								pendidikanIbu: await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail.pendidikanIbu }),
								pekerjaanIbu: await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail.pekerjaanIbu }),
								telpIbu: UserDetail.telpIbu,
							},
							dataWali: {
								namaWali: UserDetail.namaWali,
								tahunWali: UserDetail.tahunWali,
								nikWali: UserDetail.nikWali,
								pendidikanWali: UserDetail.pendidikanWali ? await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail.pendidikanWali }) : null,
								pekerjaanWali: UserDetail.pekerjaanWali ? await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail.pekerjaanWali }) : null,
								telpWali: UserDetail.telpWali,
							}
						},
						penghasilan: UserDetail.penghasilan ? await _allOptionCms(models, { where: { kode: 'penghasilan' } }, { param: UserDetail.penghasilan }) : null,
						dataAlamatOrangtua: {
							telp: UserDetail.telp,
							alamat: UserDetail.alamat,
							provinsi: await _wilayah2023Option({ models, kode: UserDetail.provinsi, bagian: 'provinsi' }),
							kabKota: await _wilayah2023Option({ models, kode: UserDetail.kabKota, bagian: 'kabkota' }),
							kecamatan: await _wilayah2023Option({ models, kode: UserDetail.kecamatan, bagian: 'kecamatan' }),
							kelurahan: await _wilayah2023Option({ models, kode: UserDetail.kelurahan, bagian: 'keldes' }),
							kodePos: UserDetail.kodePos,
						},
						kelas: UserDetail.kelas,
						dataLainnya: {
							statusTempatTinggal: UserDetail.statusTempatTinggal ? await _allOptionCms(models, { where: { kode: 'statustempattinggal' } }, { param: UserDetail.statusTempatTinggal }) : null,
							jarakRumah: UserDetail.jarakRumah ? await _allOptionCms(models, { where: { kode: 'jarakrumah' } }, { param: UserDetail.jarakRumah }) : null,
							transportasi: UserDetail.transportasi ? await _allOptionCms(models, { where: { kode: 'transportasi' } }, { param: UserDetail.transportasi }) : null,
						},
						fotoProfil: UserDetail.fotoProfil ? `${BASE_URL}image/${UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
						berkas: {
							fcIjazah: UserDetail.fcIjazah ? `${BASE_URL}pdf/${UserDetail.fcIjazah}` : null,
							fcSKHUN: UserDetail.fcSKHUN ? `${BASE_URL}pdf/${UserDetail.fcSKHUN}` : null,
							fcKK: UserDetail.fcKK ? `${BASE_URL}pdf/${UserDetail.fcKK}` : null,
							fcKTPOrtu: UserDetail.fcKTPOrtu ? `${BASE_URL}pdf/${UserDetail.fcKTPOrtu}` : null,
							fcAktaLahir: UserDetail.fcAktaLahir ? `${BASE_URL}pdf/${UserDetail.fcAktaLahir}` : null,
							fcSKL: UserDetail.fcSKL ? `${BASE_URL}pdf/${UserDetail.fcSKL}` : null,
						},
						mutasiAkun: val.mutasiAkun,
						validasiAkun: val.validasiAkun,
						condition: new Date().getDate() === new Date(val.createdAt).getDate() ? true : false,
						isActive: val.isActive,
						statusAktif: val.statusAktif,
						flag: val.deleteBy !== null || val.deletedAt !== null,
					}
				})
			}

			const responseData = buildMysqlResponseWithPagination(
				await Promise.all(arrangeResponse(dataSiswaSiswi)),
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
		let { mapel } = req.query
		let where = {}
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
			let dataJadwal = null
			let dataStruktural = null
			const { UserDetail, Role } = dataSiswaSiswi
			if(mapel) {
				where.mapel = mapel
				where.kelas = UserDetail.kelas
				where.status = true
				dataJadwal = await models.JadwalMengajar.findOne({ where });
				if(dataJadwal) {
					dataStruktural = await models.User.findOne({ where: { idUser: dataJadwal.idUser } });
				}else{
					dataJadwal = null
					dataStruktural = null
				}
			}

			const cms_setting = await dataCMSSettings({ models })
			return OK(res, {
				idUser: dataSiswaSiswi.idUser,
				consumerType: dataSiswaSiswi.consumerType,
				nikSiswa: UserDetail.nikSiswa,
				nomorInduk: UserDetail.nomorInduk,
				namaRole: Role.namaRole,
				nama: dataSiswaSiswi.nama,
				username: dataSiswaSiswi.username,
				email: dataSiswaSiswi.email,
				password: dataSiswaSiswi.password,
				kataSandi: dataSiswaSiswi.kataSandi,
				tempat: UserDetail.tempat,
				tanggalLahir: UserDetail.tanggalLahir,
				jenisKelamin: UserDetail.jenisKelamin,
				agama: await _allOptionCms(models, { where: { kode: 'agama' } }, { param: UserDetail.agama }),
				anakKe: UserDetail.anakKe,
				jumlahSaudara: UserDetail.jumlahSaudara,
				hobi: UserDetail.hobi ? await _allOptionCms(models, { where: { kode: 'hobi' } }, { param: UserDetail.hobi }) : null,
				citaCita: UserDetail.citaCita ? await _allOptionCms(models, { where: { kode: 'citacita' } }, { param: UserDetail.citaCita }) : null,
				dataSekolahSebelumnya: {
					jenjang: await _allOptionCms(models, { where: { kode: 'jenjangsekolah' } }, { param: UserDetail.jenjang }),
					statusSekolah: await _allOptionCms(models, { where: { kode: 'status_sekolah' } }, { param: UserDetail.statusSekolah }),
					namaSekolah: UserDetail.namaSekolah,
					npsn: UserDetail.npsn,
					alamatSekolah: UserDetail.alamatSekolah,
					kabkotSekolah: await _wilayah2023Option({ models, kode: UserDetail.kabkotSekolah, bagian: 'kabkota' }),
					noPesertaUN: UserDetail.noPesertaUN,
					noSKHUN: UserDetail.noSKHUN,
					noIjazah: UserDetail.noIjazah,
					nilaiUN: UserDetail.nilaiUN,
				},
				noKK: UserDetail.noKK,
				namaKK: UserDetail.namaKK,
				dataOrangtua: {
					dataAyah: {
						namaAyah: UserDetail.namaAyah,
						tahunAyah: UserDetail.tahunAyah,
						statusAyah: await _allOptionCms(models, { where: { kode: 'statusorangtua' } }, { param: UserDetail.statusAyah }),
						nikAyah: UserDetail.nikAyah,
						pendidikanAyah: await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail.pendidikanAyah }),
						pekerjaanAyah: await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail.pekerjaanAyah }),
						telpAyah: UserDetail.telpAyah,
					},
					dataIbu: {
						namaIbu: UserDetail.namaIbu,
						tahunIbu: UserDetail.tahunIbu,
						statusIbu: await _allOptionCms(models, { where: { kode: 'statusorangtua' } }, { param: UserDetail.statusIbu }),
						nikIbu: UserDetail.nikIbu,
						pendidikanIbu: await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail.pendidikanIbu }),
						pekerjaanIbu: await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail.pekerjaanIbu }),
						telpIbu: UserDetail.telpIbu,
					},
					dataWali: {
						namaWali: UserDetail.namaWali,
						tahunWali: UserDetail.tahunWali,
						nikWali: UserDetail.nikWali,
						pendidikanWali: UserDetail.pendidikanWali ? await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail.pendidikanWali }) : null,
						pekerjaanWali: UserDetail.pekerjaanWali ? await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail.pekerjaanWali }) : null,
						telpWali: UserDetail.telpWali,
					}
				},
				penghasilan: UserDetail.penghasilan ? await _allOptionCms(models, { where: { kode: 'penghasilan' } }, { param: UserDetail.penghasilan }) : null,
				dataAlamatOrangtua: {
					telp: UserDetail.telp,
					alamat: UserDetail.alamat,
					provinsi: await _wilayah2023Option({ models, kode: UserDetail.provinsi, bagian: 'provinsi' }),
					kabKota: await _wilayah2023Option({ models, kode: UserDetail.kabKota, bagian: 'kabkota' }),
					kecamatan: await _wilayah2023Option({ models, kode: UserDetail.kecamatan, bagian: 'kecamatan' }),
					kelurahan: await _wilayah2023Option({ models, kode: UserDetail.kelurahan, bagian: 'keldes' }),
					kodePos: UserDetail.kodePos,
				},
				kelas: UserDetail.kelas,
				dataLainnya: {
					statusTempatTinggal: UserDetail.statusTempatTinggal ? await _allOptionCms(models, { where: { kode: 'statustempattinggal' } }, { param: UserDetail.statusTempatTinggal }) : null,
					jarakRumah: UserDetail.jarakRumah ? await _allOptionCms(models, { where: { kode: 'jarakrumah' } }, { param: UserDetail.jarakRumah }) : null,
					transportasi: UserDetail.transportasi ? await _allOptionCms(models, { where: { kode: 'transportasi' } }, { param: UserDetail.transportasi }) : null,
				},
				fotoProfil: UserDetail.fotoProfil ? `${BASE_URL}image/${UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
				berkas: {
					fcIjazah: UserDetail.fcIjazah ? `${BASE_URL}pdf/${UserDetail.fcIjazah}` : null,
					fcSKHUN: UserDetail.fcSKHUN ? `${BASE_URL}pdf/${UserDetail.fcSKHUN}` : null,
					fcKK: UserDetail.fcKK ? `${BASE_URL}pdf/${UserDetail.fcKK}` : null,
					fcKTPOrtu: UserDetail.fcKTPOrtu ? `${BASE_URL}pdf/${UserDetail.fcKTPOrtu}` : null,
					fcAktaLahir: UserDetail.fcAktaLahir ? `${BASE_URL}pdf/${UserDetail.fcAktaLahir}` : null,
					fcSKL: UserDetail.fcSKL ? `${BASE_URL}pdf/${UserDetail.fcSKL}` : null,
				},
				dataPenilaian: {
					namaGuru: dataStruktural ? dataStruktural.nama : '-',
					jumlahTugas: dataJadwal?.jumlahTugas || '0',
					kkm: dataJadwal?.kkm || cms_setting?.kkm,
				},
				isActive: dataSiswaSiswi.isActive,
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
    try {
			if((user.jenis == 'ADD' || user.jenis == 'EDIT') && validateRequestBodyPayload(req)) return UNPROCESSABLE(res, validateRequestBodyPayload(req))
			const { userID } = req.JWTDecoded
			let salt, hashPassword, kirimdataUser, kirimdataUserDetail;
			if(user.jenis == 'ADD'){
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
					createBy: userID,
				}
				kirimdataUserDetail = {
					idUserDetail: makeRandom(10),
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

				let dataMengajar = await _allOption({ table: models.Mengajar })
				let kirimdataNilai = []
				await dataMengajar.map(str => {
					kirimdataNilai.push({
						idUser: user.idUser,
						mapel: str.kode,
						dataNilai: JSON.stringify([
							{
								semester: 'ganjil',
								nilai: { tugas1: 0, tugas2: 0, tugas3: 0, tugas4: 0, tugas5: 0, tugas6: 0, tugas7: 0, tugas8: 0, tugas9: 0, tugas10: 0, uts: 0, uas: 0 }
							},
							{
								semester: 'genap',
								nilai: { tugas1: 0, tugas2: 0, tugas3: 0, tugas4: 0, tugas5: 0, tugas6: 0, tugas7: 0, tugas8: 0, tugas9: 0, tugas10: 0, uts: 0, uas: 0 }
							},
						]),
						dataKehadiran: JSON.stringify([
							{
								semester: 'ganjil',
								kehadiran: { sakit: 0, alfa: 0, ijin: 0 }
							},
							{
								semester: 'genap',
								kehadiran: { sakit: 0, alfa: 0, ijin: 0 }
							},
						]),
						dataKoreksiNilai: JSON.stringify([
							{
								semester: 'ganjil',
								koreksi: { pilihanganda: 0, menjodohkan: 0, benarsalah: 0, essay: { dataessay: [], total: 0 } }
							},
							{
								semester: 'genap',
								koreksi: { pilihanganda: 0, menjodohkan: 0, benarsalah: 0, essay: { dataessay: [], total: 0 } }
							},
						]),
					})
				})
				await sequelizeInstance.transaction(async trx => {
					await models.User.create(kirimdataUser, { transaction: trx })
					await models.UserDetail.create(kirimdataUserDetail, { transaction: trx })
					await models.Nilai.bulkCreate(kirimdataNilai, { transaction: trx })
				})

			}else if(user.jenis == 'EDIT'){
				salt = await bcrypt.genSalt();
				hashPassword = await bcrypt.hash(user.password, salt);
				kirimdataUser = {
					consumerType: user.consumerType,
					nama: user.nama,
					email: user.email,
					username: user.username,
					password: hashPassword,
					kataSandi: encrypt(user.password),
					statusAktif: 1,
					updateBy: userID,
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
			}else if(user.jenis == 'DELETESOFT'){
				kirimdataUser = {
					statusAktif: 0,
					deleteBy: userID,
					deletedAt: new Date(),
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })	
			}else if(user.jenis == 'DELETEHARD'){
				await sequelizeInstance.transaction(async trx => {
					const datauser = await models.UserDetail.findOne({
						where: { idUser: user.idUser },
					}, { transaction: trx });
					const { fotoProfil, fcIjazah, fcSKHUN, fcKK, fcKTPOrtu, fcAktaLahir, fcSKL } = datauser
					if(fotoProfil) {
						let path_dir1 = path.join(__dirname, `../public/image/${user.idUser}`);
						fs.readdirSync(path_dir1, { withFileTypes: true });
						fs.rm(path_dir1, { recursive: true, force: true }, (err) => {
						if (err) {
								console.log(err);
							}
						});
					}
					if(fcIjazah || fcSKHUN || fcKK || fcKTPOrtu || fcAktaLahir || fcSKL) {
						let path_dir2 = path.join(__dirname, `../public/pdf/${user.idUser}`);
						fs.readdirSync(path_dir2, { withFileTypes: true });
						fs.rm(path_dir2, { recursive: true, force: true }, (err) => {
							if (err) {
								console.log(err);
							}
						});
					}
					await models.User.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.UserDetail.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.Nilai.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.Notifikasi.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.AnswerExam.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.Absensi.destroy({ where: { idUser: user.idUser } }, { transaction: trx });
					await models.DataKartu.update({ idUser: null, use: 0 }, { where: { idUser: user.idUser } }, { transaction: trx })	
				})
			}else if(user.jenis == 'DELETESELECTEDHARD'){
				await sequelizeInstance.transaction(async trx => {
					user.idUser.map(async str => {
						const datauser = await models.UserDetail.findOne({
							where: { idUser: str },
						}, { transaction: trx });
						const { fotoProfil, fcIjazah, fcSKHUN, fcKK, fcKTPOrtu, fcAktaLahir, fcSKL } = datauser
						if(fotoProfil) {
							let path_dir1 = path.join(__dirname, `../public/image/${str}`);
							fs.readdirSync(path_dir1, { withFileTypes: true });
							fs.rm(path_dir1, { recursive: true, force: true }, (err) => {
							if (err) {
									console.log(err);
								}
							});
						}
						if(fcIjazah || fcSKHUN || fcKK || fcKTPOrtu || fcAktaLahir || fcSKL) {
							let path_dir2 = path.join(__dirname, `../public/pdf/${str}`);
							fs.readdirSync(path_dir2, { withFileTypes: true });
							fs.rm(path_dir2, { recursive: true, force: true }, (err) => {
								if (err) {
									console.log(err);
								}
							});
						}
						await models.User.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.UserDetail.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.Nilai.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.Notifikasi.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.AnswerExam.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.Absensi.destroy({ where: { idUser: str } }, { transaction: trx });
						await models.DataKartu.update({ idUser: null, use: 0 }, { where: { idUser: str } }, { transaction: trx })	
					})
				})
			}else if(user.jenis == 'STATUSRECORD'){
				kirimdataUser = { 
					statusAktif: user.kondisi, 
					updateBy: userID 
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })
			}else if(user.jenis == 'VALIDASIAKUN'){
				kirimdataUser = { 
					validasiAkun: user.kondisi, 
					updateBy: userID
				}
				await models.User.update(kirimdataUser, { where: { idUser: user.idUser } })
			}else if(user.jenis == 'MUTASIAKUN'){
				kirimdataUser = { 
					mutasiAkun: user.kondisi, 
					statusAktif: 0, 
					updateBy: userID
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

function getWaliKelas (models) {
  return async (req, res, next) => {
		let { page, kelas } = req.query
    let where = {}
    try {
			let { consumerType } = req.JWTDecoded
			if(consumerType === 1 || consumerType === 2 || consumerType === 3){
				let whereUserDetail = {}
				let wherePlus = {}
				if(kelas){
					whereUserDetail.kelas = kelas
					wherePlus.mutasiAkun = false
					wherePlus.statusAktif = true
				}
				where = { consumerType: 4, ...wherePlus }
				const dataSiswaSiswi = await models.User.findAll({
					where,
					attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'updatedAt', 'deletedAt'] },
					include: [
						{ 
							model: models.UserDetail,
							where: whereUserDetail,
						},
					],
					order: [
						['nama', 'ASC'],
						// [models.UserDetail, 'nomor_induk', 'ASC'],
					],
				});

				const cms_setting = await dataCMSSettings({ models })

				const jumlahSiswa = await models.User.count({
					where: { mutasiAkun: false },
					include: [
						{ 
							model: models.UserDetail,
							where: { kelas },
						},
					],
				});

				const wali_kelas = await models.User.findOne({
					include: [
						{ 
							model: models.UserDetail,
							where: { waliKelas: kelas }
						},
					],
				});

				const getResult = await Promise.all(dataSiswaSiswi.map(async val => {
					const dataNilai = await models.Nilai.findAll({
						where: { idUser: val.idUser },
						attributes: ['mapel', 'dataNilai', 'dataKehadiran']
					})

					let hasilBayangan = 0
					let kehadiranBayangan = {
						sakit: 0,
						alfa: 0,
						ijin: 0,
					}
					let semester = cms_setting.semester.label.toLowerCase()
					let resultNilai = await Promise.all(dataNilai.map(async str => {
						const dataJadwal = await models.JadwalMengajar.findOne({ where: { kelas, mapel: str.mapel, status: true } });
						const mengajar = await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: str.mapel })
						const { label } = mengajar[0]
						let jumlahTugas = dataJadwal ? dataJadwal.jumlahTugas : 0
						let kkm = dataJadwal?.kkm || cms_setting?.kkm
						let dataStruktural = null
						if(dataJadwal) {
							dataStruktural = await models.User.findOne({ where: { idUser: dataJadwal.idUser } });
						}
						let hasil = JSON.parse(str.dataNilai)
						let hasil2 = JSON.parse(str.dataKehadiran)
						let nilaiData = hasil.filter(str => str.semester === semester)[0].nilai
						let kehadiranData = hasil2.filter(str => str.semester === semester)[0].kehadiran
						let totalNilaiTugas = Number(nilaiData.tugas1) + Number(nilaiData.tugas2) + Number(nilaiData.tugas3) + Number(nilaiData.tugas4) + Number(nilaiData.tugas5) + Number(nilaiData.tugas6) + Number(nilaiData.tugas7) + Number(nilaiData.tugas8) + Number(nilaiData.tugas9) + Number(nilaiData.tugas10)
						let rataRataTugas = totalNilaiTugas === 0 ? 0 : totalNilaiTugas / Number(jumlahTugas)
						let rataRataNilai = (Number(rataRataTugas) + Number(nilaiData.uts) + Number(nilaiData.uas)) / 3
						let hurufNilai = rataRataNilai <= 50 ? 'E' : rataRataNilai <= 65 ? 'D' : rataRataNilai <= 75 ? 'C' : rataRataNilai <= 85 ? 'B' : 'A'
						let nilaiakhir = rataRataNilai != 0 ? Math.ceil(rataRataNilai) : 0 
						hasilBayangan += nilaiakhir
						kehadiranBayangan.sakit += kehadiranData.sakit
						kehadiranBayangan.alfa += kehadiranData.alfa
						kehadiranBayangan.ijin += kehadiranData.ijin
						return {
							mapel: label,
							nilai: nilaiakhir,
							kehadiran: kehadiranData,
							namaGuru: dataStruktural ? dataStruktural.nama : '-',
							kkm,
							hurufNilai,
						}
					}))
					
					let hasilAkhir = Math.ceil(hasilBayangan / dataNilai.length)
					let hurufNilai = hasilAkhir <= 50 ? 'E' : hasilAkhir <= 65 ? 'D' : hasilAkhir <= 75 ? 'C' : hasilAkhir <= 85 ? 'B' : 'A'
					return {
						idUser: val.idUser,
						nomorInduk: val.UserDetail.nomorInduk,
						nama: uppercaseLetterFirst2(val.nama),
						peringkat: val.UserDetail.peringkat,
						waliKelas: wali_kelas ? wali_kelas.nama : '',
						jumlahSiswa,
						hasilAkhir,
						hurufNilai,
						pembilang: hasilAkhir === 0 ? 'Nol' : pembilang(hasilAkhir),
						dataNilai: resultNilai,
						kehadiran: kehadiranBayangan,
					}
				}))

				const totalPages = Math.ceil(getResult.length / 1)

				return OK(res, {
					records: paginate(getResult, 1, Number(page)),
					pageSummary: {
						page: Number(page),
						limit: 1,
						total: getResult.length,
						totalPages,
					}
				});
			}
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function updatePeringkat (models) {
  return async (req, res, next) => {
		let { kelas } = req.query
    let where = {}
    try {
			let kelasAktif = kelas.split(', ')
			let result = []
			for (let x = 0; x < kelasAktif.length; x++) {
				let whereUserDetail = {}
				let wherePlus = {}
				if(kelas){
					whereUserDetail.kelas = kelasAktif[x]
					wherePlus.mutasiAkun = false
				}
				where = { consumerType: 4, ...wherePlus }
				const dataSiswaSiswi = await models.User.findAll({
					where,
					attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'updatedAt', 'deletedAt'] },
					include: [
						{ 
							model: models.UserDetail,
							where: whereUserDetail
						},
					],
					order: [
						['createdAt', 'DESC'],
					],
				});
	
				const cms_setting = await dataCMSSettings({ models })

				let semester = cms_setting.semester.label.toLowerCase()
				const getResult = await Promise.all(dataSiswaSiswi.map(async val => {
					const dataNilai = await models.Nilai.findAll({
						where: { idUser: val.idUser },
						attributes: ['mapel', 'dataNilai']
					})
	
					let hasilBayangan = 0
					await Promise.all(dataNilai.map(async str => {
						const dataJadwal = await models.JadwalMengajar.findOne({ where: { kelas: kelasAktif[x], mapel: str.mapel, status: true } });
						let jumlahTugas = dataJadwal ? dataJadwal.jumlahTugas : 0
						let hasil = JSON.parse(str.dataNilai)
						let nilaiData = hasil.filter(str => str.semester === semester)[0].nilai
						let totalNilaiTugas = Number(nilaiData.tugas1) + Number(nilaiData.tugas2) + Number(nilaiData.tugas3) + Number(nilaiData.tugas4) + Number(nilaiData.tugas5) + Number(nilaiData.tugas6) + Number(nilaiData.tugas7) + Number(nilaiData.tugas8) + Number(nilaiData.tugas9) + Number(nilaiData.tugas10)
						let rataRataTugas = totalNilaiTugas === 0 ? 0 : totalNilaiTugas / Number(jumlahTugas)
						let rataRataNilai = (Number(rataRataTugas) + Number(nilaiData.uts) + Number(nilaiData.uas)) / 3
						let nilaiakhir = rataRataNilai != 0 ? Math.ceil(rataRataNilai) : 0 
						hasilBayangan += nilaiakhir
					}))
	
					let hasilAkhir = Math.ceil(hasilBayangan / dataNilai.length)
					return {
						idUser: val.idUser,
						nama: val.nama,
						hasilAkhir,
					}
				}))
				let peringkatSiswa = _.orderBy(getResult, ['hasilAkhir', 'nama'], ['desc', 'asc'])
				result.push({ peringkatSiswa })
			}

			result.map(str => {
				str.peringkatSiswa.map(async (val, i) => {
					await models.UserDetail.update({ peringkat: i+1 }, { where: { idUser: val.idUser } })
				})
			})

			return OK(res, result)
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getJadwalMengajar (models) {
  return async (req, res, next) => {
		let { page, limit = 20, keyword } = req.query
    try {
			const dataJadwalMengajar = await models.JadwalMengajar.findAll({
				where: { status: true },
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'updatedAt', 'deletedAt'] },
			});

			let kelompokByID = _.groupBy(dataJadwalMengajar, 'idUser')
			let kumpul = await Promise.all(Object.entries(kelompokByID).map(val => {
				let key = val[0]
				let data = val[1]
				let resdata = []
				data.map(async str => {
					resdata.push({
						idJadwalMengajar: str.idJadwalMengajar,
						mapel: str.mapel,
						kelas: str.kelas,
						hari: str.hari,
						startTime: str.startTime ? splitTime(str.startTime) : null,
						endTime: str.endTime ? splitTime(str.endTime) : null,
						jumlahTugas: str.jumlahTugas,
						kkm: str.kkm,
						modul: str.modul,
						status: str.status,
					})
				})
				return { idUser: key, resdata }
			}))

			let result = []
			await Promise.all(kumpul.map(async val => {
				const dataUser = await models.User.findOne({ 
					where: { idUser: val.idUser },
					include: [
						{ 
							model: models.UserDetail,
						},
					],
				})
				let dataMapel = _.groupBy(val.resdata, 'mapel')
				let hasil = await Promise.all(Object.entries(dataMapel).map(async val => {
					let key = val[0]
					let data = val[1]
					let resdata = []
					data.map(str => {
						resdata.push({
							idJadwalMengajar: str.idJadwalMengajar,
							kelas: str.kelas,
							hari: str.hari,
							startTime: str.startTime,
							endTime: str.endTime,
							jumlahTugas: str.jumlahTugas,
							kkm: str.kkm,
							modul: str.modul,
							status: str.status,
						})
					})
					const mengajar = await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: key })
					const { value, label } = mengajar[0]
					return { mapel: { value, label }, resdata: _.orderBy(resdata, 'kelas', 'asc') }
				}))
				result.push({
					idUser: dataUser.idUser,
					nama: dataUser.nama,
					nomorInduk: dataUser.UserDetail.nomorInduk,
					kelas: dataUser.UserDetail.mengajarKelas.split(', '),
					dataJadwalMengajar: hasil,
				})
			}))

			if(keyword) {
  			let searchRegExp = new RegExp(keyword , 'i');
				result = result.filter(val => {
					return searchRegExp.test(val.nama)
				})
			}

			let records = _.orderBy(result, ['nomorInduk', 'nama'], ['asc', 'asc'])

			const totalPages = Math.ceil(records.length / Number(limit))

			return OK(res, {
				records: paginate(records, Number(limit), Number(page)),
				pageSummary: {
					page: Number(page),
					limit: Number(limit),
					total: records.length,
					totalPages,
				}
			});
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getJadwalPelajaran (models) {
  return async (req, res, next) => {
    try {
			let hariArray = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
			const dataKelas = await models.Kelas.findAll({ where: { status: true } })
			const cms_setting = await dataCMSSettings({ models })
			let tambahJadwal = []
			const gabungResponse = item => {
				return item.map(async x => {
					const mengajar = await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: x.dataValues.mapel })
					return { ...x.dataValues, Mengajar: mengajar[0] }
				})
			}

			const arrangeResponseStruktural = item => {
				return item.map(async val => {
					const { UserDetail } = val
					return {
						idUser: val.idUser,
						nama: val.nama,
						jabatanGuru: UserDetail.jabatanGuru ? await _allOptionCms(models, { where: { kode: 'jabatan' } }, { param: UserDetail.jabatanGuru }) : [],
						mengajarBidang: UserDetail.mengajarBidang ? await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: UserDetail.mengajarBidang }) : [],
						mengajarKelas: UserDetail.mengajarKelas,
						waliKelas: UserDetail.waliKelas,
					}
				})
			}

			const arrangeResponseUser = item => {
				let kepala_sekolah = null, kurikulum = null
				item.filter(x => x.UserDetail.jabatanGuru !== null).map(x => {
					let splitJabatan = x.UserDetail.jabatanGuru.split(', ')
					if(splitJabatan.includes('1')){
						kepala_sekolah = {
							idUser: x.idUser,
							nama: x.nama,
							nomorInduk: x.UserDetail.nomorInduk,
							signature: x.UserDetail.signature ? `${BASE_URL}image/${x.UserDetail.signature}` : null,
						}
					}else if(splitJabatan.includes('3')){
						kurikulum = {
							idUser: x.idUser,
							nama: x.nama,
							nomorInduk: x.UserDetail.nomorInduk,
							signature: x.UserDetail.signature ? `${BASE_URL}image/${x.UserDetail.signature}` : null,
						}
					}
				})
				return { kepalaSekolah: kepala_sekolah, kurikulum }
			}

			const strukturalData = async () => {
				const dataStruktural = await models.User.findAll({
					where: {
						consumerType: 3,
						statusAktif: true
					},
					attributes: ['idUser', 'nama'],
					include: [
						{ 
							model: models.UserDetail,
							attributes: ['nomorInduk', 'jabatanGuru', 'mengajarBidang', 'mengajarKelas', 'waliKelas', 'signature'],
						},
					],
					order: [['createdAt', 'ASC']],
				});

				return { 
					dataGuru: await Promise.all(arrangeResponseStruktural(dataStruktural)),
					...arrangeResponseUser(dataStruktural)
				 }
			}
			
			let result = await Promise.all(hariArray.map(async str => {
				const dataJadwal = await models.JadwalMengajar.findAll({ 
					where: { hari: str, status: true },
					attributes: ['idJadwalMengajar', 'idUser', 'mapel', 'kelas', 'hari', 'startTime', 'endTime', 'modul'],
					include: [
						{ model: models.User, attributes: ['nama'] },
					],
					nest: true
				});
				const dataKumpul = await Promise.all(gabungResponse(dataJadwal))
				
				tambahJadwal = str !== 'Sabtu' ? [ ...dataKumpul, {
					idJadwalMengajar: null,
					idUser: null,
					kelas: null,
					hari: str,
					startTime: '07:00:00',
					endTime: '08:00:00',
					User: { nama: 'ALL' },
					Mengajar: { 
						label: str === 'Senin' ? 'Upacara Bendera' : 'Bimbingan Konseling / Tadarus',
						alias: str === 'Senin' ? 'Upacara Bendera' : 'Bimbingan Konseling / Tadarus',
						color: '#e1e1f0'
					}
				},
				{
					idJadwalMengajar: null,
					idUser: null,
					kelas: null,
					hari: str,
					startTime: '09:30:00',
					endTime: '10:00:00',
					User: { nama: 'ALL' },
					Mengajar: {
						label: 'Istirahat',
						alias: 'Istirahat',
						color: '#e1e1f0'
					}
				},
				{
					idJadwalMengajar: null,
					idUser: null,
					kelas: null,
					hari: str,
					startTime: '11:30:00',
					endTime: '12:30:00',
					User: { nama: 'ALL' },
					Mengajar: {
						label: str === 'Jumat' ? 'Istirahat / Shalat Jumat' : 'Istirahat / Shalat Zuhur',
						alias: str === 'Jumat' ? 'Istirahat / Shalat Jumat' : 'Istirahat / Shalat Zuhur',
						color: '#e1e1f0'
					}
				}] : [ ...dataKumpul, {
					idJadwalMengajar: null,
					idUser: null,
					kelas: null,
					hari: str,
					startTime: '08:00:00',
					endTime: '15:00:00',
					User: { nama: 'ALL' },
					Mengajar: {
						label: 'Ekstrakulikuler',
						alias: 'Ekstrakulikuler',
						color: '#e1e1f0'
					}
				}]
				let record = _.groupBy(_.orderBy(tambahJadwal, ['startTime', 'kelas'], ['asc', 'asc']), 'startTime')
				let kumpul = await Promise.all(Object.entries(record).map(val => {
					let key = val[0]
					let data = val[1]
					let resdata = []
					let waktu = ''
					data.map(x => {
						const { idJadwalMengajar, idUser, kelas, hari, startTime, endTime } = x
						resdata.push({
							idJadwalMengajar,
							idUser,
							namaGuru: x?.User?.nama,
							mapel: x?.Mengajar?.label,
							alias: x?.Mengajar?.alias,
							color: x?.Mengajar?.color,
							kelas,
						})
						waktu = `${startTime} - ${endTime}`
					})
					return { waktu, jadwal: resdata }
				}))
				return { hari: str, dataJadwal: kumpul }
			}))

			return OK(res, {
				jadwal: result,
				dataKelas,
				struktural: await strukturalData(),
				ttd: {
					namasekolah: cms_setting.namasekolah,
					tempat: cms_setting.kelurahan.label,
					tanggal: dateconvert(new Date())
				},
			});
    } catch (err) {
			console.log(err);
			
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getModulPelajaran (models) {
  return async (req, res, next) => {
		let { kelas } = req.query
    try {
			const dataJadwal = await models.JadwalMengajar.findAll({ where: { kelas }, order: [[literal('CAST(mapel AS UNSIGNED)'), 'ASC']], raw: true });
			const gabungResponse = item => {
				return item.map(async x => {
					const mengajar = await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: x.mapel })
					const { label } = mengajar[0]
					const modul = await models.Berkas.findOne({where: { idBerkas: x.modul }, raw: true})
					return { ...x, namaMapel: label, modul: { ...modul, file: modul ? `${BASE_URL}/berkas/${modul.file}` : null } }
				})
			}

			return OK(res, await Promise.all(gabungResponse(dataJadwal)));
    } catch (err) {
			console.log(err);
			
			return NOT_FOUND(res, err.message)
    }
  }  
}

function postJadwalMengajar (models) {
	return async (req, res, next) => {
		let body = req.body
		try {
			if(body.jenis === 'JadwalMengajar'){
				let kumpul = []
				let kumpulan = []
				body.mapel.forEach(mapelItem => {
					body.kelas.forEach(kelasItem => {
						kumpul.push({
							idUser: body.idUser,
							mapel: mapelItem,
							kelas: kelasItem
						})
					})
				})

				await Promise.all(kumpul.map(async val => {
					const dataJadwal = await models.JadwalMengajar.findOne({ 
						where: { idUser: body.idUser, mapel: val.mapel, kelas: val.kelas, status: true },
						attributes: ['idJadwalMengajar', 'idUser', 'mapel', 'kelas', 'startTime', 'endTime', 'jumlahTugas', 'kkm', 'modul', 'status'],
						raw: true
					});
					if(!dataJadwal){
						kumpulan.push({
							idJadwalMengajar: makeRandom(10),
							idUser: body.idUser,
							mapel: val.mapel,
							kelas: val.kelas,
							hari: null,
							startTime: null,
							endTime: null,
							jumlahTugas: 10,
							kkm: 0,
							status: true
						})
					}else{
						kumpulan.push(dataJadwal)
					}
				}))

				let kirimdataUserDetail = {
					mengajarBidang: body.mapel.join(', '),
					mengajarKelas: body.kelas.join(', ')
				}
				await sequelizeInstance.transaction(async trx => {
					await models.JadwalMengajar.destroy({ where: { idUser: body.idUser } }, { transaction: trx });
					await models.UserDetail.update(kirimdataUserDetail, { where: { idUser: body.idUser } }, { transaction: trx })
					await models.JadwalMengajar.bulkCreate(_.orderBy(kumpulan, ['mapel', 'kelas'], ['asc', 'asc']), { transaction: trx })
				})
			}else if(body.jenis === 'ModulAndTime'){
				for (let index = 0; index < body.idJadwalMengajar.length; index++) {
					let timeJadwal = body.timeJadwal[index] ? body.timeJadwal[index] : []
					let startTime = timeJadwal.length ? `${timeJadwal[0].hours}:${timeJadwal[0].minutes}:${timeJadwal[0].seconds}` : null
					let endTime = timeJadwal.length ? `${timeJadwal[1].hours}:${timeJadwal[1].minutes}:${timeJadwal[1].seconds}` : null
					let kirimData = {
						hari: body.hari[index],
						startTime,
						endTime,
						modul: body.tautan[index],
					}					
					await models.JadwalMengajar.update(kirimData, { where: { idJadwalMengajar: body.idJadwalMengajar[index], idUser: body.idUser } })
				}
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res, body)
		} catch (err) {
			console.log(err);
			
			return NOT_FOUND(res, err.message)
		}
	}
}

function getKelasSiswa (models) {
  return async (req, res, next) => {
		let { kelas, mengajar } = req.query
    let where = {}
    try {
			if(kelas){
				where.status = true
				where.kelas = { [Op.like]: `${kelas}%` }
			}

			if(mengajar){
				let splitarr = mengajar.split(', ')
				let kumpulKelas = []
				splitarr.map(str => {
					if(kelas){
						let split = str.split('-')
						if(split[0] == kelas){
							kumpulKelas.push(`${split[0]}-${split[1]}`)
						}
					}else{
						kumpulKelas.push(str)
					}
				})

				const dataKelas = await models.Kelas.findAll({
					where: { kelas: kumpulKelas },
					order: [
						['idKelas', 'ASC'],
					],
				});
	
				let result = await Promise.all(dataKelas.map(async val => {
					let jumlah = await models.User.count({
						where: { mutasiAkun: false, statusAktif: true },
						include: [
							{ 
								model: models.UserDetail,
								where: { kelas: val.dataValues.kelas },
							},
						],
					})
					return { kelas: val.dataValues.kelas, jumlah }
				}))

				return OK(res, result)
			}

			where.status = true
      const dataKelas = await models.Kelas.findAll({
				where,
				order: [
					['idKelas', 'ASC'],
				],
				raw: true
			});

			let result = await Promise.all(dataKelas.map(async val => {
				let jumlah = await models.User.count({
					where: { mutasiAkun: false },
					include: [
						{ 
							model: models.UserDetail,
							where: { kelas: val.kelas },
						},
					],
				})
				return { kelas: val.kelas, jumlah }
			}))

			return OK(res, result)
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getQuestionExam (models) {
  return async (req, res, next) => {
		let { page = 1, limit = 20, keyword } = req.query
    let where = {}
    try {
			const { userID, consumerType } = req.JWTDecoded
			const dataUser = await models.UserDetail.findOne({
				where: { idUser: userID },
				attributes: ["mengajarBidang", "mengajarKelas"]
			})
			let kelas = []
			if(consumerType === 3){
				let data = dataUser?.mengajarKelas?.split(', ') || []
				data.map(val => {
					let key = val.split('-')[0]
					if(!_.includes(kelas, key)){
						kelas.push(key)
					}
				})
			}

			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined
			const whereKey = keyword ? {
				[Op.or]: [
					{ mapel : { [Op.like]: `%${keyword}` }},
					{ kelas : { [Op.like]: `%${keyword}` }},
					{ jenis : { [Op.like]: `%${keyword}` }},
				]
			} : {}
			
			where = consumerType === 1 || consumerType === 2 ? whereKey : { ...whereKey, mapel: dataUser?.mengajarBidang?.split(', ') || [], kelas: kelas }

			const { count, rows: dataQuestionExam } = await models.QuestionExam.findAndCountAll({
				where,
				order: [
					['createdAt', 'DESC'],
				],
				limit: parseInt(limit),
				offset: OFFSET,
			});
			const getResult = await Promise.all(dataQuestionExam.map(async val => {
				const dataUser = await models.User.findOne({where: { idUser: val.createBy },attributes: ["idUser", "nama"]})
				const dataUserUpdate = await models.User.findOne({where: { idUser: val.updateBy },attributes: ["idUser", "nama"]})
				// const dataMapel = await _mengajarOption({ models, kode: val.mapel })
				const mengajar = await _allOptionCms(models, { where: { kode: 'mengajar' } }, { param: val.mapel })
				const { value, label } = mengajar[0]
				const pertanyaan = JSON.parse(val.pertanyaan)
				const pilihan = val.pilihan ? JSON.parse(val.pilihan) : []
				return {
					idExam: val.idExam,
					idUser: dataUser.idUser,
					kode: val.kode,
					kodemapel: value,
					namamapel: label,
					kelas: val.kelas,
					jenis: val.jenis,
					pertanyaan: {
						text: pertanyaan.text,
						file: pertanyaan.file ? `${BASE_URL}berkas/${pertanyaan.file}` : null,
					},
					pilihan: val.jenis === 'pilihan ganda' || val.jenis === 'benar salah' ? 
						pilihan.map(v => {
							return {
								jenis: v.jenis,
								value: v.value,
								text: v.text,
								file: v.file ? `${BASE_URL}berkas/${v.file}` : null,
							}
						})
					: {
						...pilihan[0],
						file: pilihan.length ? `${BASE_URL}berkas/${pilihan[0].file}` : null,
					},
					kunci: val.kunci,
					statusAktif: val.statusAktif,
					flag: val.deleteBy !== null || val.deletedAt !== null,
					createBy: dataUser.nama,
					updateBy: dataUserUpdate ? dataUserUpdate.nama : '-',
					createdAt: val.createdAt,
				}
			}))

			const responseData = buildMysqlResponseWithPagination(
				getResult,
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			console.log(err);
			return NOT_FOUND(res, err.message)
    }
  }  
}

function postQuestionExam (models) {
  return async (req, res, next) => {
		let body = req.body
    try {
			const { userID } = req.JWTDecoded
			let kirimdata;
			if(body.proses == 'ADD'){
				kirimdata = {
					mapel: body.mapel,
					kelas: body.kelas,
					kode: makeRandom(10),
					jenis: body.jenis,
					pertanyaan: body.enabledPertanyaan ? JSON.stringify(body.pertanyaan) : JSON.stringify({text: body.pertanyaan.text, file: null}),
					pilihan: body.pilihan ? JSON.stringify(body.pilihan) : null,
					kunci: body.kunci ? body.kunci : null,
					statusAktif: 1,
					createBy: userID,
				}

				await sequelizeInstance.transaction(async trx => {
					await models.QuestionExam.create(kirimdata, { transaction: trx })
					let pertanyaan = JSON.parse(kirimdata.pertanyaan)
					let pilihan = kirimdata.pilihan ? JSON.parse(kirimdata.pilihan) : []
					let jenis_pilihan = pilihan.length ? pilihan[0].jenis : pilihan
					if(pertanyaan.file){
						await models.TemporaryFile.update({ use: 1 }, { where: { file: pertanyaan.file } }, { transaction: trx })
					}
					if(jenis_pilihan === 'gambar' && (body.jenis === 'pilihan ganda' || body.jenis === 'menjodohkan')){
						let filePilihan = []
						pilihan.map(x => filePilihan.push(x.file))
						await models.TemporaryFile.update({ use: 1 }, { where: { file: filePilihan } }, { transaction: trx })
					}
				})
			}else if(body.proses == 'EDIT'){
				kirimdata = {
					mapel: body.mapel,
					kelas: body.kelas,
					jenis: body.jenis,
					pertanyaan: body.enabledPertanyaan ? JSON.stringify(body.pertanyaan) : JSON.stringify({text: body.pertanyaan.text, file: null}),
					pilihan: body.pilihan ? JSON.stringify(body.pilihan) : null,
					kunci: body.kunci ? body.kunci : null,
					updateBy: userID,
				}
				
				await sequelizeInstance.transaction(async trx => {
					const question = await models.QuestionExam.findOne({ where: { kode: body.kode } }, { transaction: trx })
					const { pertanyaan, pilihan } = question.dataValues
					let pertanyaanBody = JSON.parse(kirimdata.pertanyaan)
					let pilihanBody = JSON.parse(kirimdata.pilihan)
					let cekPertanyaan = JSON.parse(pertanyaan)
					let cekPilihan = JSON.parse(pilihan)

					if(cekPertanyaan.file !== pertanyaanBody.file){
						await models.TemporaryFile.update({ use: 0 }, { where: { file: cekPertanyaan.file } }, { transaction: trx })
						await models.TemporaryFile.update({ use: 1 }, { where: { file: pertanyaanBody.file } }, { transaction: trx })
					}
					if(cekPilihan){
						cekPilihan.map(async x => {
							if(x.jenis === 'gambar'){
								await models.TemporaryFile.update({ use: 0 }, { where: { file: x.file } }, { transaction: trx })
							}
						})
						let filePilihan = []
						pilihanBody.map(x => filePilihan.push(x.file))
						await models.TemporaryFile.update({ use: 1 }, { where: { file: filePilihan } }, { transaction: trx })
					}
					await models.QuestionExam.update(kirimdata, { where: { kode: body.kode } }, { transaction: trx })
				})
			}else if(body.proses == 'DELETESOFT'){
				kirimdata = {
					statusAktif: 0,
					deleteBy: userID,
					deletedAt: new Date(),
				}
				await models.QuestionExam.update(kirimdata, { where: { kode: body.kode } })	
			}else if(body.proses == 'DELETEHARD'){
				await sequelizeInstance.transaction(async trx => {
					const dataQuestionExam = await models.QuestionExam.findOne({
						where: { kode: body.kode }
					}, { transaction: trx });
					const { pertanyaan, pilihan } = dataQuestionExam.dataValues
					let pertanyaanFile = JSON.parse(pertanyaan)
					let pilihanFile = JSON.parse(pilihan)
					if(pertanyaanFile.file){ 
						fs.unlinkSync(path.join(__dirname, `../public/berkas/${pertanyaanFile.file}`)); 
						await models.TemporaryFile.destroy({ where: { file: pertanyaanFile.file } }, { transaction: trx })
					}
					if(pilihanFile){
						pilihanFile.map(async x => {
							if(x.file){
								fs.unlinkSync(path.join(__dirname, `../public/berkas/${x.file}`));
								await models.TemporaryFile.destroy({ where: { file: x.file } }, { transaction: trx })
							}
						})
					}
					await models.QuestionExam.destroy({ where: { kode: body.kode } }, { transaction: trx })
				})
			}else if(body.proses == 'STATUSRECORD'){
				kirimdata = { 
					statusAktif: body.kondisi, 
					updateBy: userID
				}
				await models.QuestionExam.update(kirimdata, { where: { kode: body.kode } })
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getJadwalExam (models) {
  return async (req, res, next) => {
		let { page = 1, limit = 20, sort = '', mapel, kelas } = req.query
    let where = {}
    try {
			// const { userID, consumerType } = req.JWTDecoded
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined
			if(mapel) {
				where.mapel = mapel
			}
			if(kelas) {
				where.kelas = kelas
			}

			const mappingSortField = [
				'kelas',
				['namamapel', sequelize.literal('`Mengajar.label`')],
				'status',
			]

			const orders = buildOrderQuery(sort, mappingSortField)
			
			if(orders.length === 0){
				orders.push(['createdAt', 'DESC'])
			}

			const { count, rows: dataJadwalExam } = await models.JadwalExam.findAndCountAll({
				where,
				include: [
					{ 
						model: models.Mengajar,
					},
				],
				order: orders,
				limit: parseInt(limit),
				offset: OFFSET,
			});
			const getResult = await Promise.all(dataJadwalExam.map(async val => {
				const date1 = dayjs(val.startDate);
				const date2 = dayjs(val.endDate);
				let minutes = date2.diff(date1, 'minutes');
				const limitSoal = JSON.parse(val.limitSoal);
				const kumpulanKodeSoal = JSON.parse(val.kumpulanKodeSoal);
				return {
					idJadwalExam: val.idJadwalExam,
					kodemapel: val.Mengajar.kode,
					namamapel: val.Mengajar.label,
					kelas: val.kelas,
					waktu: minutes,
					startDate: val.startDate,
					endDate: val.endDate,
					limitSoal: {
						pilihanganda: typeof limitSoal.pilihanganda === 'undefined' ? 0 : limitSoal.pilihanganda,
						essay: typeof limitSoal.essay === 'undefined' ? 0 : limitSoal.essay,
						menjodohkan: typeof limitSoal.menjodohkan === 'undefined' ? 0 : limitSoal.menjodohkan,
						benarsalah: typeof limitSoal.benarsalah === 'undefined' ? 0 : limitSoal.benarsalah,
					},
					kumpulanKodeSoal: {
						pilihanganda: typeof kumpulanKodeSoal.pilihanganda === 'undefined' ? [] : kumpulanKodeSoal.pilihanganda,
						essay: typeof kumpulanKodeSoal.essay === 'undefined' ? [] : kumpulanKodeSoal.essay,
						menjodohkan: typeof kumpulanKodeSoal.menjodohkan === 'undefined' ? [] : kumpulanKodeSoal.menjodohkan,
						benarsalah: typeof kumpulanKodeSoal.benarsalah === 'undefined' ? [] : kumpulanKodeSoal.benarsalah,
					},
					status: val.status,
					createdAt: val.createdAt,
				}
			}))

			const responseData = buildMysqlResponseWithPagination(
				getResult,
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			console.log(err);
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getRandomQuestion (models) {
	return async (req, res, next) => {
    const { mapel, kelas, limitSoal } = req.body
	  try {
			const dataQuestionExam = await models.QuestionExam.findAll({
				where: {
					mapel: mapel,
					kelas: kelas.split('-')[0],
				},
				attributes: ['kode', 'jenis'],
				raw: true
			});

			let pilihanganda = [], temppilihanganda = [], essay = [], tempessay = [], menjodohkan = [], tempmenjodohkan = [], benarsalah = [], tempbenarsalah = []

			await dataQuestionExam.map(x => {
				if(limitSoal.pilihanganda > 0 && x.jenis === 'pilihan ganda'){
					temppilihanganda.push(x.kode)
				}
				
				if(limitSoal.essay > 0 && x.jenis === 'essay'){
					tempessay.push(x.kode)
				}
				
				if(limitSoal.menjodohkan > 0 && x.jenis === 'menjodohkan'){
					tempmenjodohkan.push(x.kode)
				}
				
				if(limitSoal.benarsalah > 0 && x.jenis === 'benar salah'){
					tempbenarsalah.push(x.kode)
				}
			})
			if(temppilihanganda.length < limitSoal.pilihanganda) return UNPROCESSABLE(res, temppilihanganda.length == 0 ? `Soal Pilihan Ganda tidak tersedia, harap menambahkan dahulu soal tersebut` : `Soal Pilihan Ganda yang tersedia hanya ${temppilihanganda.length}`)
			if(tempessay.length < limitSoal.essay) return UNPROCESSABLE(res, tempessay.length == 0 ? `Soal Essay tidak tersedia, harap menambahkan dahulu soal tersebut` : `Soal Essay yang tersedia hanya ${tempessay.length}`)
			if(tempmenjodohkan.length < limitSoal.menjodohkan) return UNPROCESSABLE(res, tempmenjodohkan.length == 0 ? `Soal Menjodohkan tidak tersedia, harap menambahkan dahulu soal tersebut` : `Soal Menjodohkan yang tersedia hanya ${tempmenjodohkan.length}`)
			if(tempbenarsalah.length < limitSoal.benarsalah) return UNPROCESSABLE(res, tempbenarsalah.length == 0 ? `Soal Benar Salah tidak tersedia, harap menambahkan dahulu soal tersebut` : `Soal Benar Salah yang tersedia hanya ${tempbenarsalah.length}`)

			pilihanganda = getRandomArray(temppilihanganda, limitSoal.pilihanganda)
			essay = getRandomArray(tempessay, limitSoal.essay)
			menjodohkan = getRandomArray(tempmenjodohkan, limitSoal.menjodohkan)
			benarsalah = getRandomArray(tempbenarsalah, limitSoal.benarsalah)
			
			return OK(res, { pilihanganda, essay, menjodohkan, benarsalah })
    } catch (err) {
      return NOT_FOUND(res, err.message)
	  }
	}
}

function postJadwalExam (models) {
	return async (req, res, next) => {
		  let body = req.body
	  try {
			  const { userID } = req.JWTDecoded
			  let kirimdata;
			  if(body.jenis == 'ADD'){
				  kirimdata = {
					  idJadwalExam: makeRandom(10),
					  mapel: body.mapel,
					  kelas: body.kelas,
					  startDate: body.dateRange[0],
					  endDate: body.dateRange[1],
					  limitSoal: body.limitSoal,
					  kumpulanKodeSoal: body.kumpulanKodeSoal,
					  status: 1,
				  }
				  await models.JadwalExam.create(kirimdata)
			  }else if(body.jenis == 'EDIT'){
				  kirimdata = {
					  mapel: body.mapel,
					  kelas: body.kelas,
					  startDate: body.dateRange[0],
					  endDate: body.dateRange[1],
						limitSoal: body.limitSoal,
					  kumpulanKodeSoal: body.kumpulanKodeSoal,
				  }
				  await models.JadwalExam.update(kirimdata, { where: { idJadwalExam: body.idJadwalExam } })
			  }else if(body.jenis == 'DELETE'){
				  await models.JadwalExam.destroy({ where: { idJadwalExam: body.idJadwalExam } })	
			  }else if(body.jenis == 'STATUSRECORD'){
				  kirimdata = { 
					  status: body.status, 
					}
				  await models.JadwalExam.update(kirimdata, { where: { idJadwalExam: body.idJadwalExam } })
			  }else{
				  return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			  }
  
			  return OK(res);
	  } catch (err) {
			  return NOT_FOUND(res, err.message)
	  }
	}  
}

function getListPickExam (models) {
  return async (req, res, next) => {
		let { page = 1, limit = 20, keyword, jenis, kelas, mapel } = req.query
    let where = {}
    try {
			// const { userID, consumerType } = req.JWTDecoded
			// const dataUser = await models.UserDetail.findOne({
			// 	where: { idUser: userID },
			// 	attributes: ["mengajarBidang", "mengajarKelas"]
			// })
			// let kelas = []
			// if(consumerType === 3){
			// 	let data = dataUser.mengajarKelas.split(', ')
			// 	data.map(val => {
			// 		let key = val.split('-')[0]
			// 		if(!_.includes(kelas, key)){
			// 			kelas.push(key)
			// 		}
			// 	})
			// }

			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined
			const whereKey = keyword ? {
				[Op.or]: [
					{ mapel : { [Op.like]: `%${keyword}` }},
					{ kelas : { [Op.like]: `%${keyword}` }},
					{ jenis : { [Op.like]: `%${keyword}` }},
				],
			} : {}
			
			// where = consumerType === 1 || consumerType === 2 ? { ...whereKey, jenis, kelas: kelasOp } : { ...whereKey, jenis, mapel: dataUser.mengajarBidang.split(', '), kelas }
			where = { ...whereKey, jenis, kelas, mapel }

			const { count, rows: dataQuestionExam } = await models.QuestionExam.findAndCountAll({
				where,
				order: [
					['createdAt', 'DESC'],
				],
				limit: parseInt(limit),
				offset: OFFSET,
			});
			const records = await Promise.all(dataQuestionExam.map(async val => {
				const dataUser = await models.User.findOne({where: { idUser: val.createBy },attributes: ["idUser", "nama"]})
				const dataUserUpdate = await models.User.findOne({where: { idUser: val.updateBy },attributes: ["idUser", "nama"]})
				const dataMapel = await _mengajarOption({ models, kode: val.mapel })
				const pertanyaan = JSON.parse(val.pertanyaan)
				const pilihan = val.pilihan ? JSON.parse(val.pilihan) : []
				return {
					kode: val.kode,
					idUser: dataUser.idUser,
					kodemapel: dataMapel ? dataMapel[0].kode : '',
					namamapel: dataMapel ? dataMapel[0].label : '',
					kelas: val.kelas,
					jenis: val.jenis,
					pertanyaan: {
						text: pertanyaan.text,
						file: pertanyaan.file ? `${BASE_URL}berkas/${pertanyaan.file}` : null,
					},
					pilihan: val.jenis === 'pilihan ganda' || val.jenis === 'benar salah' ? 
						pilihan.map(v => {
							return {
								jenis: v.jenis,
								value: v.value,
								text: v.text,
								file: v.file ? `${BASE_URL}berkas/${v.file}` : null,
							}
						})
					: {
						...pilihan[0],
						file: pilihan.length ? `${BASE_URL}berkas/${pilihan[0].file}` : null,
					},
					kunci: val.kunci,
					createdAt: val.createdAt,
					status: 'nonaktif',
				}
			}))
			const arrangeResponse = () => {
				const totalPage = Math.ceil(count / limit)
				const hasNext = totalPage > parseInt(page, 10)
				const pageSummary = { limit: Number(limit), page: Number(page), hasNext, lastID: '', total: count, totalPage }

				if(count > 0){
					pageSummary.lastID = dataQuestionExam[dataQuestionExam.length - 1].kode
					return { records, pageSummary }
				}
				return { records: [], pageSummary }
			}

			return OK(res, arrangeResponse());
    } catch (err) {
			console.log(err);
			return NOT_FOUND(res, err.message)
    }
  }  
}

function postListPickExam (models) {
  return async (req, res, next) => {
		let body = req.body
    try {
			const dataJadwalExam = await models.JadwalExam.findOne({
				where: { idJadwalExam: body.idJadwalExam },
			});
			let limitsoal = JSON.parse(dataJadwalExam.dataValues.limitSoal)
			let kumpulankodesoal = JSON.parse(dataJadwalExam.dataValues.kumpulanKodeSoal)
			let kode = JSON.parse(body.kode)
			let limit = () => {
				if(body.jenis === 'pilihan ganda'){
					return { ...limitsoal, pilihanganda: kode.length }
				}else if(body.jenis === 'menjodohkan'){
					return { ...limitsoal, menjodohkan: kode.length }
				}else if(body.jenis === 'benar salah'){
					return { ...limitsoal, benarsalah: kode.length }
				}else if(body.jenis === 'essay'){
					return { ...limitsoal, essay: kode.length }
				}
			}
			let kumpulankode = () => {
				if(body.jenis === 'pilihan ganda'){
					return { ...kumpulankodesoal, pilihanganda: getRandomArray(kode, kode.length) }
				}else if(body.jenis === 'menjodohkan'){
					return { ...kumpulankodesoal, menjodohkan: getRandomArray(kode, kode.length) }
				}else if(body.jenis === 'benar salah'){
					return { ...kumpulankodesoal, benarsalah: getRandomArray(kode, kode.length) }
				}else if(body.jenis === 'essay'){
					return { ...kumpulankodesoal, essay: getRandomArray(kode, kode.length) }
				}
			}
			let kirimdata = {
				limitSoal: JSON.stringify(limit()),
				kumpulanKodeSoal: JSON.stringify(kumpulankode()),
			}
			await models.JadwalExam.update(kirimdata, { where: { idJadwalExam: body.idJadwalExam } })
			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getPenilaian (models) {
	return async (req, res, next) => {
		let { idUser, kelas, mapel } = req.query
		let where = {}
		try {
			if(idUser){
				where.idUser = idUser
				where.kelas = kelas
			}
			if(kelas){
				where.kelas = kelas
			}

			const cms_setting = await dataCMSSettings({ models })

			const dataSiswaSiswi = await models.UserDetail.findAll({
				where,
				attributes: ['idUser'],
				order: [
					['nomorInduk', 'ASC'],
				],
			});
			const dataJadwal = await models.JadwalMengajar.findOne({ where: { kelas: kelas, mapel: mapel, status: true } });
			let arrayData = await dataSiswaSiswi.map(str => { return str.idUser })
			const dataNilai = await models.Nilai.findAll({ where: { idUser: arrayData, mapel: mapel } });

			let result = await Promise.all(dataNilai.map(async (str) => {
				let hasil = JSON.parse(str.dataNilai)
				let hasil2 = JSON.parse(str.dataKehadiran)
				let semester = cms_setting.semester.label.toLowerCase()

				return {
					idUser: str.idUser,
					mapel: str.mapel,
					semester,
					nilai: hasil.filter(str => str.semester === semester)[0].nilai,
					kehadiran: hasil2.filter(str => str.semester === semester)[0].kehadiran,
				}
			}))

			return OK(res, {
				dataSiswaSiswi: result,
				jumlahTugas: dataJadwal?.jumlahTugas || '0',
				kkm: dataJadwal?.kkm || cms_setting?.kkm,
			})
		} catch (err) {
			return NOT_FOUND(res, err.message)
		}
	}
}

function postPenilaian (models) {
	return async (req, res, next) => {
		let body = req.body
		try {
			let kirimdata
			if(body.jenis === 'nilai'){
				const dataNilai = await models.Nilai.findOne({ where: { idUser: body.idUser, mapel: body.mapel } });
				let hasil = JSON.parse(dataNilai.dataNilai)
				let nilai = hasil.filter(str => str.semester !== body.semester)[0]
				let obj = [ nilai, body.dataNilai ]
				kirimdata = {
					dataNilai: JSON.stringify(obj),
				}
				// console.log(kirimdata, body.mapel);
				await models.Nilai.update(kirimdata, { where: { idUser: body.idUser, mapel: body.mapel } })
			}else if(body.jenis === 'nilaiAll'){
				await Promise.all(body.dataNilai.map(async val => {
					const nilaiALL = await models.Nilai.findOne({ where: { idUser: val.idUser, mapel: body.mapel } });
					let hasil = JSON.parse(nilaiALL.dataNilai)
					let nilai = hasil.filter(str => str.semester !== val.semester)[0]
					let obj = [ nilai, val.dataNilai ]
					kirimdata = {
						dataNilai: JSON.stringify(obj),
					}
					// console.log(kirimdata, body.mapel);
					await models.Nilai.update(kirimdata, { where: { idUser: val.idUser, mapel: body.mapel } })
				}))
			}else if(body.jenis === 'jumlah_tugas'){
				kirimdata = {
					jumlahTugas: body.jumlahTugas,
					kkm: body.kkm,
				}
				await models.JadwalMengajar.update(kirimdata, { where: { kelas: body.kelas, mapel: body.mapel } })
			}else if(body.jenis === 'kehadiran'){
				const dataKehadiran = await models.Nilai.findOne({ where: { idUser: body.idUser, mapel: body.mapel } });
				let hasil = JSON.parse(dataKehadiran.dataKehadiran)
				let nilai = hasil.filter(str => str.semester !== body.semester)[0]
				let obj = [ nilai, body.dataKehadiran ]
				kirimdata = {
					dataKehadiran: JSON.stringify(obj),
				}
				await models.Nilai.update(kirimdata, { where: { idUser: body.idUser, mapel: body.mapel } })
			}else if(body.jenis === 'koreksi'){
				const dataNilai = await models.Nilai.findOne({ where: { idUser: body.idUser, mapel: body.mapel } });
				let hasil = JSON.parse(dataNilai.dataKoreksiNilai)
				let nilai = hasil.filter(str => str.semester !== body.semester)[0]
				let obj = [ nilai, body.dataKoreksiNilai ]
				kirimdata = {
					dataKoreksiNilai: JSON.stringify(obj),
				}
				await models.Nilai.update(kirimdata, { where: { idUser: body.idUser, mapel: body.mapel } })
			}else if(body.jenis === 'resetkoreksi'){
				kirimdata = {
					dataKoreksiNilai: JSON.stringify([
						{
							semester: 'ganjil',
							koreksi: { pilihanganda: 0, menjodohkan: 0, benarsalah: 0, essay: { dataessay: [], total: 0 } }
						},
						{
							semester: 'genap',
							koreksi: { pilihanganda: 0, menjodohkan: 0, benarsalah: 0, essay: { dataessay: [], total: 0 } }
						},
					]),
				}
				await models.Nilai.update(kirimdata, { where: { idUser: body.idUser, mapel: body.mapel } })
			}
			
			return OK(res, body)
		} catch (err) {
			return NOT_FOUND(res, err.message)
		}
	}
}

function getJadwalExamID (models) {	
	return async (req, res, next) => {
    const { idJadwalExam } = req.params
	  try {
			const { userID } = req.JWTDecoded
			const dataSiswaSiswi = await models.User.findOne({
				where: { idUser: userID },
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
				include: [
					{ 
						model: models.UserDetail,
					},
				],
			});
			const dataExam = await models.JadwalExam.findOne({ where: { idJadwalExam: idJadwalExam, status: true } });
			let kelasSplit = dataExam.dataValues.kelas.split('-')[0]
			let limitSoal = JSON.parse(dataExam.dataValues.limitSoal)
			let kumpulanKodeSoal = JSON.parse(dataExam.dataValues.kumpulanKodeSoal)
			const dataMapel = await models.Mengajar.findOne({ where: { kode: dataExam.dataValues.mapel } });  
			const dataJadwal = await models.JadwalMengajar.findOne({ where: { kelas: dataExam.dataValues.kelas, mapel: dataExam.dataValues.mapel, status: true } });
			const dataQuestionExamPG = await models.QuestionExam.findAll({ where: { kode: kumpulanKodeSoal.pilihanganda, mapel: dataExam.dataValues.mapel, kelas: kelasSplit, statusAktif: true } });
			const dataQuestionExamESSAY = await models.QuestionExam.findAll({ where: { kode: kumpulanKodeSoal.essay, mapel: dataExam.dataValues.mapel, kelas: kelasSplit, statusAktif: true } });
			const dataQuestionExamJODOH = await models.QuestionExam.findAll({ where: { kode: kumpulanKodeSoal.menjodohkan, mapel: dataExam.dataValues.mapel, kelas: kelasSplit, statusAktif: true } });
			const dataQuestionExamBS = await models.QuestionExam.findAll({ where: { kode: kumpulanKodeSoal.benarsalah, mapel: dataExam.dataValues.mapel, kelas: kelasSplit, statusAktif: true } });
			let pilihanganda = [], essay = [], menjodohkan = [], benarsalah = [], gabungPilihanMenjodohkan = []
			await Promise.all(dataQuestionExamPG.map(val => {
				pilihanganda.push({
					...val.dataValues,
					kunci: null,
					pertanyaan: JSON.parse(val.dataValues.pertanyaan),
					pilihan: JSON.parse(val.dataValues.pilihan),
				})
			}))
			await Promise.all(dataQuestionExamESSAY.map(val => {
				essay.push({
					...val.dataValues,
					kunci: null,
					pertanyaan: JSON.parse(val.dataValues.pertanyaan),
				})
			}))
			await Promise.all(dataQuestionExamJODOH.map(val => {
				gabungPilihanMenjodohkan.push(JSON.parse(val.dataValues.pilihan)[0])
			}))
			let sufflePilihanMenjodohkan = shuffleArray(gabungPilihanMenjodohkan)
			await Promise.all(dataQuestionExamJODOH.map(val => {
				menjodohkan.push({
					...val.dataValues,
					kunci: null,
					pertanyaan: JSON.parse(val.dataValues.pertanyaan),
					pilihan: sufflePilihanMenjodohkan,
				})
			}))
			await Promise.all(dataQuestionExamBS.map(val => {
				benarsalah.push({
					...val.dataValues,
					kunci: null,
					pertanyaan: JSON.parse(val.dataValues.pertanyaan),
					pilihan: JSON.parse(val.dataValues.pilihan),
				})
			}))
			let dataStruktural = null
			if(dataJadwal) {
				dataStruktural = await models.User.findOne({ where: { idUser: dataJadwal.dataValues.idUser } });
			}
			return OK(res, {
        ...dataExam.dataValues,
				idUser: dataSiswaSiswi.idUser,
				nama: uppercaseLetterFirst2(dataSiswaSiswi.nama),
				nomorInduk: dataSiswaSiswi.UserDetail.nomorInduk,
				namaGuru: dataStruktural ? uppercaseLetterFirst2(dataStruktural.nama) : '-',
        kodemapel: dataMapel.kode,
        mapel: dataMapel.label,
				dataQuestionExam: {
					pilihanganda: shuffleArray(pilihanganda),
					essay: shuffleArray(essay),
					menjodohkan: shuffleArray(menjodohkan),
					benarsalah: shuffleArray(benarsalah) }
      })
    } catch (err) {
      return NOT_FOUND(res, err.message)
	  }
	}
}

function postJawabanExam (models) {
  return async (req, res, next) => {
		let body = req.body
    try {
			const check = await models.AnswerExam.count({ where: { idUser: body.idUser, mapel: body.mapel, kelas: body.kelas } });
			if(check) return NOT_FOUND(res, "data sudah di gunakan !")
			kirimdata = {
				idAnswerExam: makeRandom(10),
				idUser: body.idUser,
				mapel: body.mapel,
				kelas: body.kelas,
				jawabanPG: body.jawabanPG,
				jawabanEssay: body.jawabanEssay,
				jawabanMenjodohkan: body.jawabanMenjodohkan,
				jawabanBenarSalah: body.jawabanBenarSalah,
			}
			await models.AnswerExam.create(kirimdata)
			return OK(res);
    } catch (err) {
			console.log(err);
			return NOT_FOUND(res, err.message)
    }
  }  
}

function postKoreksiExam (models) {
  return async (req, res, next) => {
		let { mapel, kelas, idUser } = req.body
    try {
			const { userID, consumerType } = req.JWTDecoded
			const dataMapel = await _mengajarOption({ models, kode: mapel })
			const count = await models.AnswerExam.count({ where: { mapel, kelas, idUser } });
			if(count <= 0) return NO_CONTENT(res)
			const dataJawabanExam = await models.AnswerExam.findOne({
				where: { mapel, kelas, idUser },
				include: [
					{ 
						model: models.User,
					},
				],
			});
			let pilihanganda = [], essay = [], menjodohkan = [], benarsalah = [], gabungPilihanMenjodohkan = []
			let jawabanpg = JSON.parse(dataJawabanExam.jawabanPG)
			let jawabanessay = JSON.parse(dataJawabanExam.jawabanEssay)
			let jawabanmenjodohkan = JSON.parse(dataJawabanExam.jawabanMenjodohkan)
			let jawabanbenarsalah = JSON.parse(dataJawabanExam.jawabanBenarSalah)
			await Promise.all(jawabanpg.map(async val => {
				const dataQuestionExam = await models.QuestionExam.findOne({ where: { kode: val.kode, jenis: 'pilihan ganda' } })
				pilihanganda.push({
					...val,
					kunciJawaban: dataQuestionExam.kunci,
					pertanyaan: JSON.parse(dataQuestionExam.pertanyaan),
					pilihan: JSON.parse(dataQuestionExam.pilihan),
					kondisi: val.jawaban === dataQuestionExam.kunci,
					point: val.jawaban === dataQuestionExam.kunci ? 1 : 0,
				})
			}))
			await Promise.all(jawabanmenjodohkan.map(async val => {
				const dataQuestionExam = await models.QuestionExam.findOne({ where: { kode: val.kode, jenis: 'menjodohkan' } })
				gabungPilihanMenjodohkan.push(JSON.parse(dataQuestionExam.pilihan)[0])
				menjodohkan.push({
					...val,
					kunciJawaban: dataQuestionExam.kunci,
					pertanyaan: JSON.parse(dataQuestionExam.pertanyaan),
					pilihan: gabungPilihanMenjodohkan,
					kondisi: val.jawaban === dataQuestionExam.kunci,
					point: val.jawaban === dataQuestionExam.kunci ? 1 : 0,
				})
			}))
			await Promise.all(jawabanbenarsalah.map(async val => {
				const dataQuestionExam = await models.QuestionExam.findOne({ where: { kode: val.kode, jenis: 'benar salah' } })
				benarsalah.push({
					...val,
					kunciJawaban: dataQuestionExam.kunci,
					pertanyaan: JSON.parse(dataQuestionExam.pertanyaan),
					pilihan: JSON.parse(dataQuestionExam.pilihan),
					kondisi: val.jawaban === dataQuestionExam.kunci,
					point: val.jawaban === dataQuestionExam.kunci ? 1 : 0,
				})
			}))
			const cms_setting = await dataCMSSettings({ models })
			await Promise.all(jawabanessay.map(async val => {
				const dataQuestionExam = await models.QuestionExam.findOne({ where: { kode: val.kode, jenis: 'essay' } })
				const getNilai = await models.Nilai.findOne({ where: { idUser, mapel } })
				let koreksi = JSON.parse(getNilai.dataKoreksiNilai)
				let point = koreksi.filter(str => str.semester === cms_setting.semester.label.toLowerCase())[0]?.koreksi?.essay
				essay.push({
					...val,
					pertanyaan: JSON.parse(dataQuestionExam.pertanyaan),
					point: point?.dataessay.filter(str => str.kode == val.kode)[0]?.point || '0',
				})
			}))
			return OK(res, {
				idAnswerExam: dataJawabanExam.idAnswerExam,
				kodeMapel: dataMapel[0]?.kode,
				namaMapel: dataMapel[0]?.label,
				jawabanPG: pilihanganda,
				jawabanEssay: essay,
				jawabanMenjodohkan: menjodohkan,
				jawabanBenarSalah: benarsalah,
				idUser: dataJawabanExam?.User?.idUser,
				nama: dataJawabanExam?.User?.nama,
			});
    } catch (err) {
			console.log(err);
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
					{ header: "NAMA", key: "nama", width: 20 },
					{ header: "EMAIL", key: "email", width: 20 },
					{ header: "NIK SISWA", key: "nikSiswa", width: 20 },
					{ header: "NISN", key: "nomorInduk", width: 20 },
					{ header: "TANGGAL LAHIR", key: "tanggalLahir", width: 20 },
					{ header: "TEMPAT", key: "tempat", width: 20 },
					{ header: "JENIS KELAMIN", key: "jenisKelamin", width: 20 },
					{ header: "AGAMA", key: "agama", width: 20 },
					{ header: "ANAK KE", key: "anakKe", width: 20 },
					{ header: "JUMLAH SAUDARA", key: "jumlahSaudara", width: 20 },
					{ header: "HOBI", key: "hobi", width: 20 },
					{ header: "CITA-CITA", key: "citaCita", width: 20 },
					{ header: "JENJANG SEKOLAH", key: "jenjang", width: 20 },
					{ header: "NAMA SEKOLAH", key: "namaSekolah", width: 20 },
					{ header: "STATUS SEKOLAH", key: "statusSekolah", width: 20 },
					{ header: "NPSN", key: "npsn", width: 20 },
					{ header: "ALAMAT SEKOLAH", key: "alamatSekolah", width: 40 },
					{ header: "KABUPATEN / KOTA SEKOLAH SEBELUMNYA", key: "kabkotSekolah", width: 20 },
					{ header: "NOMOR KK", key: "noKK", width: 20 },
					{ header: "NAMA KEPALA KELUARGA", key: "namaKK", width: 20 },
					{ header: "NIK AYAH", key: "nikAyah", width: 20 },
					{ header: "NAMA AYAH", key: "namaAyah", width: 20 },
					{ header: "TAHUN AYAH", key: "tahunAyah", width: 20 },
					{ header: "STATUS AYAH", key: "statusAyah", width: 20 },
					{ header: "PENDIDIKAN AYAH", key: "pendidikanAyah", width: 20 },
					{ header: "PEKERJAAN AYAH", key: "pekerjaanAyah", width: 20 },
					{ header: "NO HANDPHONE AYAH", key: "telpAyah", width: 20 },
					{ header: "NIK IBU", key: "nikIbu", width: 20 },
					{ header: "NAMA IBU", key: "namaIbu", width: 20 },
					{ header: "TAHUN IBU", key: "tahunIbu", width: 20 },
					{ header: "STATUS IBU", key: "statusIbu", width: 20 },
					{ header: "PENDIDIKAN IBU", key: "pendidikanIbu", width: 20 },
					{ header: "PEKERJAAN IBU", key: "pekerjaanIbu", width: 20 },
					{ header: "NO HANDPHONE IBU", key: "telpIbu", width: 20 },
					{ header: "NIK WALI", key: "nikWali", width: 20 },
					{ header: "NAMA WALI", key: "namaWali", width: 20 },
					{ header: "TAHUN WALI", key: "tahunWali", width: 20 },
					{ header: "PENDIDIKAN WALI", key: "pendidikanWali", width: 20 },
					{ header: "PEKERJAAN WALI", key: "pekerjaanWali", width: 20 },
					{ header: "NO HANDPHONE WALI", key: "telpWali", width: 20 },
					{ header: "TELEPON", key: "telp", width: 20 },
					{ header: "ALAMAT", key: "alamat", width: 40 },
					{ header: "PROVINSI", key: "provinsi", width: 20 },
					{ header: "KABUPATEN / KOTA", key: "kabKota", width: 20 },
					{ header: "KECAMATAN", key: "kecamatan", width: 20 },
					{ header: "KELURAHAN", key: "kelurahan", width: 20 },
					{ header: "KODE POS", key: "kodePos", width: 20 },
					{ header: "PENGHASILAN", key: "penghasilan", width: 20 },
					{ header: "STATUS TEMPAT TINGGAL", key: "statusTempatTinggal", width: 20 },
					{ header: "JARAK RUMAH", key: "jarakRumah", width: 20 },
					{ header: "TRANSPORTASI", key: "transportasi", width: 20 },
					{ header: "KELAS", key: "kelas", width: 20 },
				];
				const figureColumns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 ,19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
				figureColumns.forEach((i) => {
					worksheet.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheet.addRows([{
					nama: 'tes', 
					email: 'tes@gmail.com', 
					nikSiswa: '123', 
					nomorInduk: '123', 
					tanggalLahir: new Date(),
					tempat: 'Bogor', 
					jenisKelamin: 'Laki - Laki', 
					agama: 1, 
					anakKe: '1', 
					jumlahSaudara: '1', 
					hobi: 1, 
					citaCita: 1, 
					jenjang: 1, 
					namaSekolah: 'SD. Teka Teki', 
					statusSekolah: 1, 
					npsn: '123', 
					alamatSekolah: 'Bogor', 
					kabkotSekolah: '32.01', 
					noKK: '123', 
					namaKK: 'Andre', 
					nikAyah: '123', 
					namaAyah: 'Andre', 
					tahunAyah: '1970', 
					statusAyah: 1, 
					pendidikanAyah: 1, 
					pekerjaanAyah: 1, 
					telpAyah: '123456789', 
					nikIbu: '123', 
					namaIbu: 'Susi', 
					tahunIbu: '1989', 
					statusIbu: 1, 
					pendidikanIbu: 1, 
					pekerjaanIbu: 1, 
					telpIbu: '123456789', 
					nikWali: '', 
					namaWali: '', 
					tahunWali: '', 
					pendidikanWali: null, 
					pekerjaanWali: null, 
					telpWali: '123456789', 
					telp: '123456789', 
					alamat: 'Bogor', 
					provinsi: '32', 
					kabKota: '32.01', 
					kecamatan: '32.01.01', 
					kelurahan: '32.01.01.1002', 
					kodePos: '16913',
					penghasilan: 1,
					statusTempatTinggal: 1,
					jarakRumah: 1,
					transportasi: 1,
					kelas: '7-1',
				}]);
				
				//Pil Agama
				worksheetAgama.columns = [
					{ header: "KODE", key: "value", width: 15 },
					{ header: "LABEL", key: "label", width: 15 }
				];
				const figureColumnsAgama = [1, 2];
				figureColumnsAgama.forEach((i) => {
					worksheetAgama.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetAgama.addRows(await _allOptionCms(models, { where: { kode: 'agama' } }));

				//Pil Hobi
				worksheetHobi.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsHobi = [1, 2];
				figureColumnsHobi.forEach((i) => {
					worksheetHobi.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetHobi.addRows(await _allOptionCms(models, { where: { kode: 'hobi' } }));

				//Pil CitaCita
				worksheetCitaCita.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsCitaCita = [1, 2];
				figureColumnsCitaCita.forEach((i) => {
					worksheetCitaCita.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetCitaCita.addRows(await _allOptionCms(models, { where: { kode: 'citacita' } }));

				//Pil JenjangSekolah
				worksheetJenjangSekolah.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsJenjangSekolah = [1, 2];
				figureColumnsJenjangSekolah.forEach((i) => {
					worksheetJenjangSekolah.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetJenjangSekolah.addRows(await _allOptionCms(models, { where: { kode: 'jenjangsekolah' } }));

				//Pil StatusSekolah
				worksheetStatusSekolah.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsStatusSekolah = [1, 2];
				figureColumnsStatusSekolah.forEach((i) => {
					worksheetStatusSekolah.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetStatusSekolah.addRows(await _allOptionCms(models, { where: { kode: 'status_sekolah' } }));

				//Pil StatusOrangTua
				worksheetStatusOrangTua.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsStatusOrangTua = [1, 2];
				figureColumnsStatusOrangTua.forEach((i) => {
					worksheetStatusOrangTua.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetStatusOrangTua.addRows(await _allOptionCms(models, { where: { kode: 'statusorangtua' } }));

				//Pil Pendidikan
				worksheetPendidikan.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsPendidikan = [1, 2];
				figureColumnsPendidikan.forEach((i) => {
					worksheetPendidikan.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetPendidikan.addRows(await _allOptionCms(models, { where: { kode: 'pendidikan' } }));

				//Pil Pekerjaan
				worksheetPekerjaan.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsPekerjaan = [1, 2];
				figureColumnsPekerjaan.forEach((i) => {
					worksheetPekerjaan.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetPekerjaan.addRows(await _allOptionCms(models, { where: { kode: 'pekerjaan' } }));

				//Pil StatusTempatTinggal
				worksheetStatusTempatTinggal.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsStatusTempatTinggal = [1, 2];
				figureColumnsStatusTempatTinggal.forEach((i) => {
					worksheetStatusTempatTinggal.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetStatusTempatTinggal.addRows(await _allOptionCms(models, { where: { kode: 'statustempattinggal' } }));

				//Pil JarakRumah
				worksheetJarakRumah.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsJarakRumah = [1, 2];
				figureColumnsJarakRumah.forEach((i) => {
					worksheetJarakRumah.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetJarakRumah.addRows(await _allOptionCms(models, { where: { kode: 'jarakrumah' } }));

				//Pil AlatTransportasi
				worksheetAlatTransportasi.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsAlatTransportasi = [1, 2];
				figureColumnsAlatTransportasi.forEach((i) => {
					worksheetAlatTransportasi.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetAlatTransportasi.addRows(await _allOptionCms(models, { where: { kode: 'transportasi' } }));

				//Pil Penghasilan
				worksheetPenghasilan.columns = [
					{ header: "KODE", key: "value", width: 10 },
					{ header: "LABEL", key: "label", width: 50 }
				];
				const figureColumnsPenghasilan = [1, 2];
				figureColumnsPenghasilan.forEach((i) => {
					worksheetPenghasilan.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheetPenghasilan.addRows(await _allOptionCms(models, { where: { kode: 'penghasilan' } }));

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

function downloadTemplateNilai (models) {
	return async (req, res, next) => {
		let { kelas, mapel } = req.params
	  try {
      const dataSiswaSiswi = await models.User.findAll({
				where: { consumerType: 4, mutasiAkun: false },
				attributes: ['idUser', 'nama', 'createdAt'],
				include: [
					{ 
						model: models.UserDetail,
						attributes: ['nikSiswa', 'nomorInduk', 'kelas'],
						where: {
							kelas: kelas.split(', ')
						}
					},
				],
				order: [
					['createdAt', 'DESC'],
				],
			});

			let result = []
			const cms_setting = await dataCMSSettings({ models })
			await Promise.all(dataSiswaSiswi.map(async val => {
				const getNilai = await models.Nilai.findOne({ where: { idUser: val.idUser, mapel } })
				let nilai = JSON.parse(getNilai.dataNilai)
				let kehadiran = JSON.parse(getNilai.dataKehadiran)
				let semester = cms_setting.semester.label.toLowerCase()
				let resNilai = nilai.filter(str => str.semester === semester)[0].nilai
				let resKehadiran = kehadiran.filter(str => str.semester === semester)[0].kehadiran
				result.push({
					idUser: val.idUser,
					nama: val.nama,
					tugas1: resNilai.tugas1,
					tugas2: resNilai.tugas2,
					tugas3: resNilai.tugas3,
					tugas4: resNilai.tugas4,
					tugas5: resNilai.tugas5,
					tugas6: resNilai.tugas6,
					tugas7: resNilai.tugas7,
					tugas8: resNilai.tugas8,
					tugas9: resNilai.tugas9,
					tugas10: resNilai.tugas10,
					uts: resNilai.uts,
					uas: resNilai.uas,
					sakit: resKehadiran.sakit,
					alfa: resKehadiran.alfa,
					ijin: resKehadiran.ijin,
				})
			}))

			let workbook = new excel.Workbook();
			let worksheet = workbook.addWorksheet("Data Nilai Siswa");
			//Data Siswa
			worksheet.columns = [
				{ header: "ID", key: "idUser", width: 30 },
				{ header: "NAMA", key: "nama", width: 40 },
				{ header: "TUGAS 1", key: "tugas1", width: 10 },
				{ header: "TUGAS 2", key: "tugas2", width: 10 },
				{ header: "TUGAS 3", key: "tugas3", width: 10 },
				{ header: "TUGAS 4", key: "tugas4", width: 10 },
				{ header: "TUGAS 5", key: "tugas5", width: 10 },
				{ header: "TUGAS 6", key: "tugas6", width: 10 },
				{ header: "TUGAS 7", key: "tugas7", width: 10 },
				{ header: "TUGAS 8", key: "tugas8", width: 10 },
				{ header: "TUGAS 9", key: "tugas9", width: 10 },
				{ header: "TUGAS 10", key: "tugas10", width: 10 },
				{ header: "UTS", key: "uts", width: 10 },
				{ header: "UAS", key: "uas", width: 10 },
				{ header: "SAKIT", key: "sakit", width: 10},
				{ header: "ALFA", key: "alfa", width: 10 },
				{ header: "IJIN", key: "ijin", width: 10 },
			];
			const figureColumns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
			figureColumns.forEach((i) => {
				worksheet.getColumn(i).alignment = { horizontal: "left" };
			});
			worksheet.addRows(result);
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

function downloadTemplateJadwalExam (models) {
	return async (req, res, next) => {
	  try {
			let workbook = new excel.Workbook();
			let worksheet = workbook.addWorksheet("Data Nilai Siswa");
			let worksheetMapel = workbook.addWorksheet("Mata Pelajaran");
			let worksheetKelas = workbook.addWorksheet("Kelas");
			//Data Siswa
			worksheet.columns = [
				{ header: "KODE MAPEL", key: "mapel", width: 15 },
				{ header: "KELAS", key: "kelas", width: 10 },
				{ header: "START DATE", key: "startDate", width: 20 },
				{ header: "END DATE", key: "endDate", width: 20 },
			];
			const figureColumns = [1, 2, 3, 4];
			figureColumns.forEach((i) => {
				worksheet.getColumn(i).alignment = { horizontal: "left" };
			});
			worksheet.addRows([{
				mapel: '1', 
				kelas: '7-1', 
				startDate: '2023-01-01 09:00:00', 
				endDate: '2023-01-01 12:00:00'
			},{
				mapel: '1', 
				kelas: '7-2', 
				startDate: '2023-01-01 09:00:00', 
				endDate: '2023-01-01 12:00:00'
			}]);

			//Pil Mapel
			worksheetMapel.columns = [
				{ header: "KODE", key: "value", width: 10 },
				{ header: "LABEL", key: "label", width: 10 }
			];
			const figureColumnsMapel = [1, 2];
			figureColumnsMapel.forEach((i) => {
				worksheetMapel.getColumn(i).alignment = { horizontal: "left" };
			});
			worksheetMapel.addRows(await _allOptionCms(models, { where: { kode: 'mengajar' } }));
			
			//Pil Kelas
			worksheetKelas.columns = [
				{ header: "KELAS", key: "kelas", width: 10 }
			];
			const figureColumnsKelas = [1, 2];
			figureColumnsKelas.forEach((i) => {
				worksheetKelas.getColumn(i).alignment = { horizontal: "left" };
			});
			worksheetKelas.addRows(await _KelasListOption({ models, status: true }));

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
			if(body.kategori === 'datasiswa'){
				let jsonDataInsert = [];
				let jsonDataPending = [];
				let jsonData = [];
				let workbook = new excel.Workbook();
				readXlsxFile(dir.path).then(async(rows) => {
					rows.shift();
					rows.map(async (row) => {
						jsonData.push({
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
							kelas: row[51],
						});
					});
					//Proccess
					await Promise.all(jsonData.map(async str => {
						const ksuid = await createKSUID()
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
							jsonDataInsert.push({...str, idUser: ksuid})
						}
					}))

					if(jsonDataInsert.length) {
						await Promise.all(jsonDataInsert.map(async str => {
							let salt, hashPassword, kirimdataUser, kirimdataUserDetail;				
							salt = await bcrypt.genSalt();
							hashPassword = await bcrypt.hash(convertDate3(str.tanggalLahir), salt);
							kirimdataUser = {
								idUser: str.idUser,
								consumerType: 4,
								nama: str.nama,
								email: str.email,
								username: _.lowerCase(str.nama.split(' ')),
								password: hashPassword,
								kataSandi: encrypt(convertDate3(str.tanggalLahir)),
								statusAktif: 1,
								createBy: body.createupdateBy,
							}
							kirimdataUserDetail = {
								idUserDetail: makeRandom(10),
								idUser: str.idUser,
								// nikSiswa: str.nikSiswa,
								// nomorInduk: str.nomorInduk,
								nikSiswa: `2052023${makeRandomAngka(13)}`,
								nomorInduk: `1992023${makeRandomAngka(13)}`,
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
	
							let dataMengajar = await _allOption({ table: models.Mengajar })
							let kirimdataNilai = []
							await dataMengajar.map(val => {
								kirimdataNilai.push({
									idUser: str.idUser,
									mapel: val.kode,
									dataNilai: JSON.stringify([
										{
											semester: 'ganjil',
											nilai: { tugas1: 0, tugas2: 0, tugas3: 0, tugas4: 0, tugas5: 0, tugas6: 0, tugas7: 0, tugas8: 0, tugas9: 0, tugas10: 0, uts: 0, uas: 0 }
										},
										{
											semester: 'genap',
											nilai: { tugas1: 0, tugas2: 0, tugas3: 0, tugas4: 0, tugas5: 0, tugas6: 0, tugas7: 0, tugas8: 0, tugas9: 0, tugas10: 0, uts: 0, uas: 0 }
										},
									]),
									dataKehadiran: JSON.stringify([
										{
											semester: 'ganjil',
											kehadiran: { sakit: 0, alfa: 0, ijin: 0 }
										},
										{
											semester: 'genap',
											kehadiran: { sakit: 0, alfa: 0, ijin: 0 }
										},
									]),
									dataKoreksiNilai: JSON.stringify([
										{
											semester: 'ganjil',
											koreksi: { pilihanganda: 0, menjodohkan: 0, benarsalah: 0, essay: { dataessay: [], total: 0 } }
										},
										{
											semester: 'genap',
											koreksi: { pilihanganda: 0, menjodohkan: 0, benarsalah: 0, essay: { dataessay: [], total: 0 } }
										},
									]),
								})
							})
							await sequelizeInstance.transaction(async trx => {
								await models.User.create(kirimdataUser, { transaction: trx })
								await models.UserDetail.create(kirimdataUserDetail, { transaction: trx })
								await models.Nilai.bulkCreate(kirimdataNilai, { transaction: trx })
							})	
						}))
					}
					if(jsonDataPending.length) {
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
							{ header: "NAMA", key: "nama", width: 20 },
							{ header: "EMAIL", key: "email", width: 20 },
							{ header: "NIK SISWA", key: "nikSiswa", width: 20 },
							{ header: "NISN", key: "nomorInduk", width: 20 },
							{ header: "TANGGAL LAHIR", key: "tanggalLahir", width: 20 },
							{ header: "TEMPAT", key: "tempat", width: 20 },
							{ header: "JENIS KELAMIN", key: "jenisKelamin", width: 20 },
							{ header: "AGAMA", key: "agama", width: 20 },
							{ header: "ANAK KE", key: "anakKe", width: 20 },
							{ header: "JUMLAH SAUDARA", key: "jumlahSaudara", width: 20 },
							{ header: "HOBI", key: "hobi", width: 20 },
							{ header: "CITA-CITA", key: "citaCita", width: 20 },
							{ header: "JENJANG SEKOLAH", key: "jenjang", width: 20 },
							{ header: "NAMA SEKOLAH", key: "namaSekolah", width: 20 },
							{ header: "STATUS SEKOLAH", key: "statusSekolah", width: 20 },
							{ header: "NPSN", key: "npsn", width: 20 },
							{ header: "ALAMAT SEKOLAH", key: "alamatSekolah", width: 40 },
							{ header: "KABUPATEN / KOTA SEKOLAH SEBELUMNYA", key: "kabkotSekolah", width: 20 },
							{ header: "NOMOR KK", key: "noKK", width: 20 },
							{ header: "NAMA KEPALA KELUARGA", key: "namaKK", width: 20 },
							{ header: "NIK AYAH", key: "nikAyah", width: 20 },
							{ header: "NAMA AYAH", key: "namaAyah", width: 20 },
							{ header: "TAHUN AYAH", key: "tahunAyah", width: 20 },
							{ header: "STATUS AYAH", key: "statusAyah", width: 20 },
							{ header: "PENDIDIKAN AYAH", key: "pendidikanAyah", width: 20 },
							{ header: "PEKERJAAN AYAH", key: "pekerjaanAyah", width: 20 },
							{ header: "NO HANDPHONE AYAH", key: "telpAyah", width: 20 },
							{ header: "NIK IBU", key: "nikIbu", width: 20 },
							{ header: "NAMA IBU", key: "namaIbu", width: 20 },
							{ header: "TAHUN IBU", key: "tahunIbu", width: 20 },
							{ header: "STATUS IBU", key: "statusIbu", width: 20 },
							{ header: "PENDIDIKAN IBU", key: "pendidikanIbu", width: 20 },
							{ header: "PEKERJAAN IBU", key: "pekerjaanIbu", width: 20 },
							{ header: "NO HANDPHONE IBU", key: "telpIbu", width: 20 },
							{ header: "NIK WALI", key: "nikWali", width: 20 },
							{ header: "NAMA WALI", key: "namaWali", width: 20 },
							{ header: "TAHUN WALI", key: "tahunWali", width: 20 },
							{ header: "PENDIDIKAN WALI", key: "pendidikanWali", width: 20 },
							{ header: "PEKERJAAN WALI", key: "pekerjaanWali", width: 20 },
							{ header: "NO HANDPHONE WALI", key: "telpWali", width: 20 },
							{ header: "TELEPON", key: "telp", width: 20 },
							{ header: "ALAMAT", key: "alamat", width: 40 },
							{ header: "PROVINSI", key: "provinsi", width: 20 },
							{ header: "KABUPATEN / KOTA", key: "kabKota", width: 20 },
							{ header: "KECAMATAN", key: "kecamatan", width: 20 },
							{ header: "KELURAHAN", key: "kelurahan", width: 20 },
							{ header: "KODE POS", key: "kodePos", width: 20 },
							{ header: "PENGHASILAN", key: "penghasilan", width: 20 },
							{ header: "STATUS TEMPAT TINGGAL", key: "statusTempatTinggal", width: 20 },
							{ header: "JARAK RUMAH", key: "jarakRumah", width: 20 },
							{ header: "TRANSPORTASI", key: "transportasi", width: 20 },
						];
						const figureColumns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 ,19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
						figureColumns.forEach((i) => {
							worksheet.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheet.addRows(jsonDataPending);
						
						//Pil Agama
						worksheetAgama.columns = [
							{ header: "KODE", key: "value", width: 15 },
							{ header: "LABEL", key: "label", width: 15 }
						];
						const figureColumnsAgama = [1, 2];
						figureColumnsAgama.forEach((i) => {
							worksheetAgama.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetAgama.addRows(await _allOptionCms(models, { where: { kode: 'agama' } }));
	
						//Pil Hobi
						worksheetHobi.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsHobi = [1, 2];
						figureColumnsHobi.forEach((i) => {
							worksheetHobi.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetHobi.addRows(await _allOptionCms(models, { where: { kode: 'hobi' } }));
	
						//Pil CitaCita
						worksheetCitaCita.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsCitaCita = [1, 2];
						figureColumnsCitaCita.forEach((i) => {
							worksheetCitaCita.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetCitaCita.addRows(await _allOptionCms(models, { where: { kode: 'citacita' } }));
	
						//Pil JenjangSekolah
						worksheetJenjangSekolah.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsJenjangSekolah = [1, 2];
						figureColumnsJenjangSekolah.forEach((i) => {
							worksheetJenjangSekolah.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetJenjangSekolah.addRows(await _allOptionCms(models, { where: { kode: 'jenjangsekolah' } }));
	
						//Pil StatusSekolah
						worksheetStatusSekolah.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsStatusSekolah = [1, 2];
						figureColumnsStatusSekolah.forEach((i) => {
							worksheetStatusSekolah.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetStatusSekolah.addRows(await _allOptionCms(models, { where: { kode: 'status_sekolah' } }));
	
						//Pil StatusOrangTua
						worksheetStatusOrangTua.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsStatusOrangTua = [1, 2];
						figureColumnsStatusOrangTua.forEach((i) => {
							worksheetStatusOrangTua.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetStatusOrangTua.addRows(await _allOptionCms(models, { where: { kode: 'statusorangtua' } }));
	
						//Pil Pendidikan
						worksheetPendidikan.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsPendidikan = [1, 2];
						figureColumnsPendidikan.forEach((i) => {
							worksheetPendidikan.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetPendidikan.addRows(await _allOptionCms(models, { where: { kode: 'pendidikan' } }));
	
						//Pil Pekerjaan
						worksheetPekerjaan.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsPekerjaan = [1, 2];
						figureColumnsPekerjaan.forEach((i) => {
							worksheetPekerjaan.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetPekerjaan.addRows(await _allOptionCms(models, { where: { kode: 'pekerjaan' } }));
	
						//Pil StatusTempatTinggal
						worksheetStatusTempatTinggal.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsStatusTempatTinggal = [1, 2];
						figureColumnsStatusTempatTinggal.forEach((i) => {
							worksheetStatusTempatTinggal.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetStatusTempatTinggal.addRows(await _allOptionCms(models, { where: { kode: 'statustempattinggal' } }));
	
						//Pil JarakRumah
						worksheetJarakRumah.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsJarakRumah = [1, 2];
						figureColumnsJarakRumah.forEach((i) => {
							worksheetJarakRumah.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetJarakRumah.addRows(await _allOptionCms(models, { where: { kode: 'jarakrumah' } }));
	
						//Pil AlatTransportasi
						worksheetAlatTransportasi.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsAlatTransportasi = [1, 2];
						figureColumnsAlatTransportasi.forEach((i) => {
							worksheetAlatTransportasi.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetAlatTransportasi.addRows(await _allOptionCms(models, { where: { kode: 'transportasi' } }));
	
						//Pil Penghasilan
						worksheetPenghasilan.columns = [
							{ header: "KODE", key: "value", width: 10 },
							{ header: "LABEL", key: "label", width: 50 }
						];
						const figureColumnsPenghasilan = [1, 2];
						figureColumnsPenghasilan.forEach((i) => {
							worksheetPenghasilan.getColumn(i).alignment = { horizontal: "left" };
						});
						worksheetPenghasilan.addRows(await _allOptionCms(models, { where: { kode: 'penghasilan' } }));
	
						res.setHeader(
							"Content-Disposition",
							"attachment; filename=DataSiswaPending.xlsx"
						);
						res.setHeader(
							"Content-Type",
							"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
						);
						
						return workbook.xlsx.writeFile(path.join(__dirname, '../public/Data Siswa Siswi Pending.xlsx'))
						.then(() => {
							fs.unlinkSync(dir.path);
							return OK(res, {
								dataJsonDataInsert: jsonDataInsert,
								jsonDataInsert: jsonDataInsert.length,
								dataJsonDataPending: jsonDataPending,
								jsonDataPending: jsonDataPending.length,
								path: `${BASE_URL}Data Siswa Siswi Pending.xlsx`,
							})
						});
					}
					fs.unlinkSync(dir.path);
					return OK(res, {
						dataJsonDataInsert: jsonDataInsert,
						jsonDataInsert: jsonDataInsert.length,
						dataJsonDataPending: jsonDataPending,
						jsonDataPending: jsonDataPending.length,
					})
				})
			}else if(body.kategori === 'datanilaisiswa'){
				let jsonData = [];
				readXlsxFile(dir.path).then(async(rows) => {
					rows.shift();
					rows.map(async (row) => {
						jsonData.push({
							idUser: row[0],
							nama: row[1],
							tugas1: row[2],
							tugas2: row[3],
							tugas3: row[4],
							tugas4: row[5],
							tugas5: row[6],
							tugas6: row[7],
							tugas7: row[8],
							tugas8: row[9],
							tugas9: row[10],
							tugas10: row[11],
							uts: row[12],
							uas: row[13],
							sakit: row[14],
							alfa: row[15],
							ijin: row[16],
						});
					});

					const cms_setting = await dataCMSSettings({ models })
					let semester = cms_setting.semester.label.toLowerCase()
					await Promise.all(jsonData.map(async val => {
						const dataNilai = await models.Nilai.findOne({ where: { idUser: val.idUser, mapel: body.mapel } });
						let hasilNilai = JSON.parse(dataNilai.dataNilai)
						let hasilKehadiran = JSON.parse(dataNilai.dataKehadiran)
						let nilai = hasilNilai.filter(str => str.semester !== semester)[0]
						let kehadiran = hasilKehadiran.filter(str => str.semester !== semester)[0]
						let objNilai = [nilai, {
							semester,
							nilai: { tugas1: val.tugas1, tugas2: val.tugas2, tugas3: val.tugas3, tugas4: val.tugas4, tugas5: val.tugas5, tugas6: val.tugas6, tugas7: val.tugas7, tugas8: val.tugas8, tugas9: val.tugas9, tugas10: val.tugas10, uts: val.uts, uas: val.uas }
						}]
						let objKehadiran = [kehadiran, {
							semester,
							kehadiran: { sakit: val.sakit, alfa: val.alfa, ijin: val.ijin }
						}]
						let kirimdata = {
							dataNilai: JSON.stringify(objNilai),
							dataKehadiran: JSON.stringify(objKehadiran),
						}
						await models.Nilai.update(kirimdata, { where: { idUser: val.idUser, mapel: body.mapel } })
					}))
					fs.unlinkSync(dir.path);
					return OK(res, jsonData)
				})	
			}else if(body.kategori === 'datajadwalexam'){
				let jsonData = [];
				readXlsxFile(dir.path).then(async(rows) => {
					rows.shift();
					rows.map(async (row) => {
						jsonData.push({
							mapel: row[0],
							kelas: row[1],
							startDate: row[2],
							endDate: row[3],
						});
					});

					await Promise.all(jsonData.map(async val => {
						const cek = await models.JadwalExam.count({ where: { kelas: val.kelas, mapel: val.mapel } });
						if(!cek){
							const dateStart = dayjs.utc(val.startDate).utcOffset(+7, true).format()
							const dateEnd = dayjs.utc(val.endDate).utcOffset(+7, true).format()
							let kirimdata = {
								idJadwalExam: makeRandom(10),
								mapel: val.mapel,
								kelas: val.kelas,
								startDate: convertDateTime2(dateStart),
								endDate: convertDateTime2(dateEnd),
								limitSoal: JSON.stringify({pilihanganda:0, essay:0, menjodohkan:0, benarsalah:0}),
								kumpulanKodeSoal: JSON.stringify({pilihanganda:[], essay:[], menjodohkan:[], benarsalah:[]}),
								status: 1
							}
							await models.JadwalExam.create(kirimdata)
						}
					}))
					fs.unlinkSync(dir.path);
					return OK(res, jsonData)
				})	
			}
	  } catch (err) {
			  return NOT_FOUND(res, err.message)
	  }
	}  
}

function exportExcel (models) {
	return async (req, res, next) => {
		let { kelas, kategori } = req.query
	  try {
			let workbook = new excel.Workbook();
			let split = kelas.split(', ')
			for (let index = 0; index < split.length; index++) {
				let whereUserDetail = {}
				let whereUser = {}
				if(kelas){
					whereUserDetail.kelas = split[index]
					whereUser.mutasiAkun = false
					whereUser.statusAktif = true
				}
				const dataSiswaSiswi = await models.User.findAll({
					where: whereUser,
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
						['nama', 'ASC'],
					],
				});
	
				const result = await Promise.all(dataSiswaSiswi.map(async val => {
					const { UserDetail } = val
					let agama = await _allOptionCms(models, { where: { kode: 'agama' } }, { param: UserDetail?.agama })
					let hobi = await _allOptionCms(models, { where: { kode: 'hobi' } }, { param: UserDetail?.hobi })
					let cita_cita = await _allOptionCms(models, { where: { kode: 'citacita' } }, { param: UserDetail?.citaCita })
					let jenjang = await _allOptionCms(models, { where: { kode: 'jenjangsekolah' } }, { param: UserDetail?.jenjang })
					let status_sekolah = await _allOptionCms(models, { where: { kode: 'status_sekolah' } }, { param: UserDetail?.statusSekolah })
					let kabkota_sekolah = await _wilayah2023Option({ models, kode: UserDetail?.kabkotSekolah, bagian: 'kabkota' })
					let status_ayah = await _allOptionCms(models, { where: { kode: 'statusorangtua' } }, { param: UserDetail?.statusAyah })
					let status_ibu = await _allOptionCms(models, { where: { kode: 'statusorangtua' } }, { param: UserDetail?.statusIbu })
					let pendidikan_ayah = await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail?.pendidikanAyah })
					let pendidikan_ibu = await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail?.pendidikanIbu })
					let pendidikan_wali = await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail?.pendidikanWali })
					let pekerjaan_ayah = await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail?.pekerjaanAyah })
					let pekerjaan_ibu = await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail?.pekerjaanIbu })
					let pekerjaan_wali = await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail?.pekerjaanWali })
					let penghasilan = await _allOptionCms(models, { where: { kode: 'penghasilan' } }, { param: UserDetail?.penghasilan })
					let provinsi = await _wilayah2023Option({ models, kode: UserDetail?.provinsi, bagian: 'provinsi' })
					let kabkota = await _wilayah2023Option({ models, kode: UserDetail?.kabKota, bagian: 'kabkota' })
					let kecamatan = await _wilayah2023Option({ models, kode: UserDetail?.kecamatan, bagian: 'kecamatan' })
					let kelurahan = await _wilayah2023Option({ models, kode: UserDetail?.kelurahan, bagian: 'keldes' })
					let status_tempat_tinggal = await _allOptionCms(models, { where: { kode: 'statustempattinggal' } }, { param: UserDetail?.statusTempatTinggal })
					let jarak_rumah = await _allOptionCms(models, { where: { kode: 'jarakrumah' } }, { param: UserDetail?.jarakRumah })
					let transportasi = await _allOptionCms(models, { where: { kode: 'transportasi' } }, { param: UserDetail?.transportasi })
					
					return {
						idUser: val?.idUser,
						consumerType: val?.consumerType,
						nikSiswa: UserDetail?.nikSiswa,
						nomorInduk: UserDetail?.nomorInduk,
						namaRole: val?.Role.namaRole,
						nama: val?.nama,
						username: val?.username,
						email: val?.email,
						password: val?.password,
						kataSandi: val?.kataSandi,
						tempat: UserDetail?.tempat,
						tanggalLahir: UserDetail?.tanggalLahir,
						jenisKelamin: UserDetail?.jenisKelamin,
						agama: UserDetail?.agama ? kategori === 'full' ? agama?.label : agama?.value : null,
						anakKe: UserDetail?.anakKe,
						jumlahSaudara: UserDetail?.jumlahSaudara,
						hobi: UserDetail?.hobi ? kategori === 'full' ? hobi?.label : hobi?.value : null,
						citaCita: UserDetail?.citaCita ? kategori === 'full' ? cita_cita?.label : cita_cita?.value : null,
						jenjang: UserDetail?.jenjang ? kategori === 'full' ? jenjang?.label : jenjang?.value : null,
						statusSekolah: UserDetail?.statusSekolah ? kategori === 'full' ? status_sekolah?.label : status_sekolah?.value : null,
						namaSekolah: UserDetail?.namaSekolah,
						npsn: UserDetail?.npsn,
						alamatSekolah: UserDetail?.alamatSekolah,
						kabkotSekolah: UserDetail?.kabkotSekolah ? kategori === 'full' ? `${kabkota_sekolah?.jenisKabKota} ${kabkota_sekolah?.nama}` : kabkota_sekolah?.kode : null,
						noPesertaUN: UserDetail?.noPesertaUN,
						noSKHUN: UserDetail?.noSKHUN,
						noIjazah: UserDetail?.noIjazah,
						nilaiUN: UserDetail?.nilaiUN,
						noKK: UserDetail?.noKK,
						namaKK: UserDetail?.namaKK,
						namaAyah: UserDetail?.namaAyah,
						tahunAyah: UserDetail?.tahunAyah,
						statusAyah: UserDetail?.statusAyah ? kategori === 'full' ? status_ayah?.label : status_ayah?.value : null,
						nikAyah: UserDetail?.nikAyah,
						pendidikanAyah: UserDetail?.pendidikanAyah ? kategori === 'full' ? pendidikan_ayah?.label : pendidikan_ayah?.value : null,
						pekerjaanAyah: UserDetail?.pekerjaanAyah ? kategori === 'full' ? pekerjaan_ayah?.label : pekerjaan_ayah?.value : null,
						telpAyah: UserDetail?.telpAyah,
						namaIbu: UserDetail?.namaIbu,
						tahunIbu: UserDetail?.tahunIbu,
						statusIbu: UserDetail?.statusIbu ? kategori === 'full' ? status_ibu?.label : status_ibu?.value : null,
						nikIbu: UserDetail?.nikIbu,
						pendidikanIbu: UserDetail?.pendidikanIbu ? kategori === 'full' ? pendidikan_ibu?.label : pendidikan_ibu?.value : null,
						pekerjaanIbu: UserDetail?.pekerjaanIbu ? kategori === 'full' ? pekerjaan_ibu?.label : pekerjaan_ibu?.value : null,
						telpIbu: UserDetail?.telpIbu,
						namaWali: UserDetail?.namaWali,
						tahunWali: UserDetail?.tahunWali,
						nikWali: UserDetail?.nikWali,
						pendidikanWali: UserDetail?.pendidikanWali ? kategori === 'full' ? pendidikan_wali?.label : pendidikan_wali?.value : null,
						pekerjaanWali: UserDetail?.pekerjaanWali ? kategori === 'full' ? pekerjaan_wali?.label : pekerjaan_wali?.value : null,
						telpWali: UserDetail?.telpWali,
						penghasilan: UserDetail?.penghasilan ? kategori === 'full' ? penghasilan?.label : penghasilan?.value : null,
						telp: UserDetail?.telp,
						alamat: UserDetail?.alamat,
						provinsi: UserDetail?.provinsi ? kategori === 'full' ? provinsi?.nama : provinsi?.kode : null,
						kabKota: UserDetail?.kabKota ? kategori === 'full' ? `${kabkota?.jenisKabKota} ${kabkota?.nama}` : kabkota?.kode : null,
						kecamatan: UserDetail?.kecamatan ? kategori === 'full' ? kecamatan?.nama : kecamatan?.kode : null,
						kelurahan: UserDetail?.kelurahan ? kategori === 'full' ? `${kelurahan?.jenisKelDes} ${kelurahan?.nama}` : kelurahan?.kode : null,
						kodePos: UserDetail?.kodePos,
						kelas: UserDetail?.kelas,
						statusTempatTinggal: UserDetail?.statusTempatTinggal ? kategori === 'full' ? status_tempat_tinggal?.label : status_tempat_tinggal?.value : null,
						jarakRumah: UserDetail?.jarakRumah ? kategori === 'full' ? jarak_rumah?.label : jarak_rumah?.value : null,
						transportasi: UserDetail?.transportasi ? kategori === 'full' ? transportasi?.label : transportasi?.value : null,
					}
				}))
	
				let worksheet = workbook.addWorksheet(`Kelas ${split[index]}`);
				if(kategori === 'emis'){
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

					//Pil Agama
					worksheetAgama.columns = [
						{ header: "KODE", key: "value", width: 15 },
						{ header: "LABEL", key: "label", width: 15 }
					];
					const figureColumnsAgama = [1, 2];
					figureColumnsAgama.forEach((i) => {
						worksheetAgama.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetAgama.addRows(await _allOptionCms(models, { where: { kode: 'agama' } }));

					//Pil Hobi
					worksheetHobi.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsHobi = [1, 2];
					figureColumnsHobi.forEach((i) => {
						worksheetHobi.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetHobi.addRows(await _allOptionCms(models, { where: { kode: 'hobi' } }));

					//Pil CitaCita
					worksheetCitaCita.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsCitaCita = [1, 2];
					figureColumnsCitaCita.forEach((i) => {
						worksheetCitaCita.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetCitaCita.addRows(await _allOptionCms(models, { where: { kode: 'citacita' } }));

					//Pil JenjangSekolah
					worksheetJenjangSekolah.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsJenjangSekolah = [1, 2];
					figureColumnsJenjangSekolah.forEach((i) => {
						worksheetJenjangSekolah.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetJenjangSekolah.addRows(await _allOptionCms(models, { where: { kode: 'jenjangsekolah' } }));

					//Pil StatusSekolah
					worksheetStatusSekolah.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsStatusSekolah = [1, 2];
					figureColumnsStatusSekolah.forEach((i) => {
						worksheetStatusSekolah.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetStatusSekolah.addRows(await _allOptionCms(models, { where: { kode: 'status_sekolah' } }));

					//Pil StatusOrangTua
					worksheetStatusOrangTua.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsStatusOrangTua = [1, 2];
					figureColumnsStatusOrangTua.forEach((i) => {
						worksheetStatusOrangTua.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetStatusOrangTua.addRows(await _allOptionCms(models, { where: { kode: 'statusorangtua' } }));

					//Pil Pendidikan
					worksheetPendidikan.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsPendidikan = [1, 2];
					figureColumnsPendidikan.forEach((i) => {
						worksheetPendidikan.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetPendidikan.addRows(await _allOptionCms(models, { where: { kode: 'pendidikan' } }));

					//Pil Pekerjaan
					worksheetPekerjaan.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsPekerjaan = [1, 2];
					figureColumnsPekerjaan.forEach((i) => {
						worksheetPekerjaan.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetPekerjaan.addRows(await _allOptionCms(models, { where: { kode: 'pekerjaan' } }));

					//Pil StatusTempatTinggal
					worksheetStatusTempatTinggal.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsStatusTempatTinggal = [1, 2];
					figureColumnsStatusTempatTinggal.forEach((i) => {
						worksheetStatusTempatTinggal.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetStatusTempatTinggal.addRows(await _allOptionCms(models, { where: { kode: 'statustempattinggal' } }));

					//Pil JarakRumah
					worksheetJarakRumah.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsJarakRumah = [1, 2];
					figureColumnsJarakRumah.forEach((i) => {
						worksheetJarakRumah.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetJarakRumah.addRows(await _allOptionCms(models, { where: { kode: 'jarakrumah' } }));

					//Pil AlatTransportasi
					worksheetAlatTransportasi.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsAlatTransportasi = [1, 2];
					figureColumnsAlatTransportasi.forEach((i) => {
						worksheetAlatTransportasi.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetAlatTransportasi.addRows(await _allOptionCms(models, { where: { kode: 'transportasi' } }));

					//Pil Penghasilan
					worksheetPenghasilan.columns = [
						{ header: "KODE", key: "value", width: 10 },
						{ header: "LABEL", key: "label", width: 50 }
					];
					const figureColumnsPenghasilan = [1, 2];
					figureColumnsPenghasilan.forEach((i) => {
						worksheetPenghasilan.getColumn(i).alignment = { horizontal: "left" };
					});
					worksheetPenghasilan.addRows(await _allOptionCms(models, { where: { kode: 'penghasilan' } }));
				}

				//Data Siswa
				worksheet.columns = [
					{ header: "NAMA", key: "nama", width: 20 },
					{ header: "EMAIL", key: "email", width: 20 },
					{ header: "NIK SISWA", key: "nikSiswa", width: 20 },
					{ header: "NISN", key: "nomorInduk", width: 20 },
					{ header: "TANGGAL LAHIR", key: "tanggalLahir", width: 20 },
					{ header: "TEMPAT", key: "tempat", width: 20 },
					{ header: "JENIS KELAMIN", key: "jenisKelamin", width: 20 },
					{ header: "AGAMA", key: "agama", width: 20 },
					{ header: "ANAK KE", key: "anakKe", width: 20 },
					{ header: "JUMLAH SAUDARA", key: "jumlahSaudara", width: 20 },
					{ header: "HOBI", key: "hobi", width: 20 },
					{ header: "CITA-CITA", key: "citaCita", width: 20 },
					{ header: "JENJANG SEKOLAH", key: "jenjang", width: 20 },
					{ header: "NAMA SEKOLAH", key: "namaSekolah", width: 20 },
					{ header: "STATUS SEKOLAH", key: "statusSekolah", width: 20 },
					{ header: "NPSN", key: "npsn", width: 20 },
					{ header: "ALAMAT SEKOLAH", key: "alamatSekolah", width: 40 },
					{ header: "KABUPATEN / KOTA SEKOLAH SEBELUMNYA", key: "kabkotSekolah", width: 20 },
					{ header: "NOMOR KK", key: "noKK", width: 20 },
					{ header: "NAMA KEPALA KELUARGA", key: "namaKK", width: 20 },
					{ header: "NIK AYAH", key: "nikAyah", width: 20 },
					{ header: "NAMA AYAH", key: "namaAyah", width: 20 },
					{ header: "TAHUN AYAH", key: "tahunAyah", width: 20 },
					{ header: "STATUS AYAH", key: "statusAyah", width: 20 },
					{ header: "PENDIDIKAN AYAH", key: "pendidikanAyah", width: 20 },
					{ header: "PEKERJAAN AYAH", key: "pekerjaanAyah", width: 20 },
					{ header: "NO HANDPHONE AYAH", key: "telpAyah", width: 20 },
					{ header: "NIK IBU", key: "nikIbu", width: 20 },
					{ header: "NAMA IBU", key: "namaIbu", width: 20 },
					{ header: "TAHUN IBU", key: "tahunIbu", width: 20 },
					{ header: "STATUS IBU", key: "statusIbu", width: 20 },
					{ header: "PENDIDIKAN IBU", key: "pendidikanIbu", width: 20 },
					{ header: "PEKERJAAN IBU", key: "pekerjaanIbu", width: 20 },
					{ header: "NO HANDPHONE IBU", key: "telpIbu", width: 20 },
					{ header: "NIK WALI", key: "nikWali", width: 20 },
					{ header: "NAMA WALI", key: "namaWali", width: 20 },
					{ header: "TAHUN WALI", key: "tahunWali", width: 20 },
					{ header: "PENDIDIKAN WALI", key: "pendidikanWali", width: 20 },
					{ header: "PEKERJAAN WALI", key: "pekerjaanWali", width: 20 },
					{ header: "NO HANDPHONE WALI", key: "telpWali", width: 20 },
					{ header: "TELEPON", key: "telp", width: 20 },
					{ header: "ALAMAT", key: "alamat", width: 40 },
					{ header: "PROVINSI", key: "provinsi", width: 20 },
					{ header: "KABUPATEN / KOTA", key: "kabKota", width: 20 },
					{ header: "KECAMATAN", key: "kecamatan", width: 20 },
					{ header: "KELURAHAN / DESA", key: "kelurahan", width: 20 },
					{ header: "KODE POS", key: "kodePos", width: 20 },
					{ header: "PENGHASILAN", key: "penghasilan", width: 20 },
					{ header: "STATUS TEMPAT TINGGAL", key: "statusTempatTinggal", width: 20 },
					{ header: "JARAK RUMAH", key: "jarakRumah", width: 20 },
					{ header: "TRANSPORTASI", key: "transportasi", width: 20 },
				];
				const figureColumns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 ,19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
				figureColumns.forEach((i) => {
					worksheet.getColumn(i).alignment = { horizontal: "left" };
				});
				worksheet.addRows(result);

				res.setHeader(
					"Content-Disposition",
					"attachment; filename=ExportSiswa.xlsx"
				);
			}
	
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

function pdfCreate (models) {
	return async (req, res, next) => {
		let { uid } = req.params
		try {
			const cms_setting = await dataCMSSettings({ models })
			
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

			const { UserDetail } = dataSiswaSiswi
			let agama = await _allOptionCms(models, { where: { kode: 'agama' } }, { param: UserDetail?.agama })
			let hobi = await _allOptionCms(models, { where: { kode: 'hobi' } }, { param: UserDetail?.hobi })
			let cita_cita = await _allOptionCms(models, { where: { kode: 'citacita' } }, { param: UserDetail?.citaCita })
			let jenjang = await _allOptionCms(models, { where: { kode: 'jenjangsekolah' } }, { param: UserDetail?.jenjang })
			let status_sekolah = await _allOptionCms(models, { where: { kode: 'status_sekolah' } }, { param: UserDetail?.statusSekolah })
			let kabkota_sekolah = await _wilayah2023Option({ models, kode: UserDetail?.kabkotSekolah, bagian: 'kabkota' })
			let status_ayah = await _allOptionCms(models, { where: { kode: 'statusorangtua' } }, { param: UserDetail?.statusAyah })
			let status_ibu = await _allOptionCms(models, { where: { kode: 'statusorangtua' } }, { param: UserDetail?.statusIbu })
			let pendidikan_ayah = await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail?.pendidikanAyah })
			let pendidikan_ibu = await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail?.pendidikanIbu })
			let pendidikan_wali = await _allOptionCms(models, { where: { kode: 'pendidikan' } }, { param: UserDetail?.pendidikanWali })
			let pekerjaan_ayah = await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail?.pekerjaanAyah })
			let pekerjaan_ibu = await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail?.pekerjaanIbu })
			let pekerjaan_wali = await _allOptionCms(models, { where: { kode: 'pekerjaan' } }, { param: UserDetail?.pekerjaanWali })
			let penghasilan = await _allOptionCms(models, { where: { kode: 'penghasilan' } }, { param: UserDetail?.penghasilan })
			let provinsi = await _wilayah2023Option({ models, kode: UserDetail?.provinsi, bagian: 'provinsi' })
			let kabkota = await _wilayah2023Option({ models, kode: UserDetail?.kabKota, bagian: 'kabkota' })
			let kecamatan = await _wilayah2023Option({ models, kode: UserDetail?.kecamatan, bagian: 'kecamatan' })
			let kelurahan = await _wilayah2023Option({ models, kode: UserDetail?.kelurahan, bagian: 'keldes' })
			let status_tempat_tinggal = await _allOptionCms(models, { where: { kode: 'statustempattinggal' } }, { param: UserDetail?.statusTempatTinggal })
			let jarak_rumah = await _allOptionCms(models, { where: { kode: 'jarakrumah' } }, { param: UserDetail?.jarakRumah })
			let transportasi = await _allOptionCms(models, { where: { kode: 'transportasi' } }, { param: UserDetail?.transportasi })
			const hasil = {
				url: BASE_URL,
				idUser: dataSiswaSiswi?.idUser,
				consumerType: dataSiswaSiswi?.consumerType,
				nikSiswa: UserDetail?.nikSiswa,
				nomorInduk: UserDetail?.nomorInduk,
				namaRole: dataSiswaSiswi?.Role.namaRole,
				nama: uppercaseLetterFirst2(dataSiswaSiswi?.nama),
				username: dataSiswaSiswi?.username,
				email: dataSiswaSiswi?.email,
				password: dataSiswaSiswi?.password,
				kataSandi: dataSiswaSiswi?.kataSandi,
				tempat: UserDetail?.tempat,
				tanggalLahir: dateconvert(UserDetail?.tanggalLahir),
				jenisKelamin: UserDetail?.jenisKelamin,
				agama: agama?.label,
				anakKe: UserDetail?.anakKe,
				jumlahSaudara: UserDetail?.jumlahSaudara,
				hobi: hobi?.label || null,
				citaCita: cita_cita?.label || null,
				// dataSekolahSebelumnya: {
					jenjang: jenjang?.label || null,
					statusSekolah: status_sekolah?.label || null,
					namaSekolah: UserDetail?.namaSekolah,
					npsn: UserDetail?.npsn,
					alamatSekolah: UserDetail?.alamatSekolah,
					kabkotSekolah: UserDetail?.kabkotSekolah ? `${kabkota_sekolah.jenisKabKota} ${kabkota_sekolah.nama}` : null,
					noPesertaUN: UserDetail?.noPesertaUN,
					noSKHUN: UserDetail?.noSKHUN,
					noIjazah: UserDetail?.noIjazah,
					nilaiUN: UserDetail?.nilaiUN,
				// },
				noKK: UserDetail?.noKK,
				namaKK: UserDetail?.namaKK,
				// dataOrangtua: {
				// 	dataAyah: {
						namaAyah: uppercaseLetterFirst2(UserDetail?.namaAyah || '-'),
						tahunAyah: UserDetail?.tahunAyah,
						statusAyah: status_ayah?.label || null,
						nikAyah: UserDetail?.nikAyah,
						pendidikanAyah: pendidikan_ayah?.label || null,
						pekerjaanAyah: pekerjaan_ayah?.label || null,
						telpAyah: UserDetail?.telpAyah,
					// },
					// dataIbu: {
						namaIbu: uppercaseLetterFirst2(UserDetail?.namaIbu || '-'),
						tahunIbu: UserDetail?.tahunIbu,
						statusIbu: status_ibu?.label || null,
						nikIbu: UserDetail?.nikIbu,
						pendidikanIbu: pendidikan_ibu?.label || null,
						pekerjaanIbu: pekerjaan_ibu?.label || null,
						telpIbu: UserDetail?.telpIbu,
					// },
					// dataWali: {
						namaWali: uppercaseLetterFirst2(UserDetail?.namaWali || '-'),
						tahunWali: UserDetail?.tahunWali,
						nikWali: UserDetail?.nikWali,
						pendidikanWali: pendidikan_wali?.label || null,
						pekerjaanWali: pekerjaan_wali?.label || null,
						telpWali: UserDetail?.telpWali,
				// 	}
				// },
				penghasilan: penghasilan?.label || null,
				// dataAlamatOrangtua: {
					telp: UserDetail?.telp,
					alamat: UserDetail?.alamat,
					provinsi: UserDetail?.provinsi ? `Provinsi ${provinsi.nama}` : null,
					kabKota: UserDetail?.kabKota ? `${kabkota.jenisKabKota} ${kabkota.nama}` : null,
					kecamatan: UserDetail?.kecamatan ? `Kecamatan ${kecamatan.nama}` : null,
					kelurahan: UserDetail?.kelurahan ? `${kelurahan.jenisKelDes} ${kelurahan.nama}` : null,
					kodePos: UserDetail?.kodePos,
				// },
				kelas: UserDetail?.kelas,
				// dataLainnya: {
					statusTempatTinggal: status_tempat_tinggal?.label || null,
					jarakRumah: jarak_rumah?.label || null,
					transportasi: transportasi?.label || null,
				// },
				fotoProfil: UserDetail?.fotoProfil,
				// berkas: {
					fcIjazah: UserDetail?.fcIjazah,
					fcSKHUN: UserDetail?.fcSKHUN,
					fcKK: UserDetail?.fcKK,
					fcKTPOrtu: UserDetail?.fcKTPOrtu,
					fcAktaLahir: UserDetail?.fcAktaLahir,
					fcSKL: UserDetail?.fcSKL,
				// },
				validasiAkun: dataSiswaSiswi?.validasiAkun,
				statusAktif: dataSiswaSiswi?.statusAktif,
			}
			// return OK(res, hasil)
			ejs.renderFile(path.join(__dirname, "../../src/views/viewSiswa.ejs"), { dataSiswa: hasil, cmsSetup: cms_setting }, (err, data) => {
				if (err) {
					console.log(err);
				} else {
					// console.log(data)
					let options = {
						format: "A4",
						orientation: "portrait",
						quality: "10000",
						border: {
							top: "1cm",
							right: "1cm",
							bottom: "1cm",
							left: "1cm"
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
						return stream.pipe(res);
					});
				}
			});
		} catch (err) {
			return NOT_FOUND(res, err.message)
		}
	}
}

function pdfCreateRaport (models) {
	return async (req, res, next) => {
		let { uid } = req.params
		try {
			const cms_setting = await dataCMSSettings({ models })
			
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

			const jumlahSiswa = await models.User.count({
				where: { mutasiAkun: false },
				include: [
					{ 
						model: models.UserDetail,
						where: { kelas: dataSiswaSiswi.UserDetail.kelas },
					},
				],
			});

			const wali_kelas = await models.User.findOne({
				include: [
					{ 
						model: models.UserDetail,
						where: { waliKelas: dataSiswaSiswi.UserDetail.kelas }
					},
				],
			});

			const datauser = await models.User.findAll({
				attributes: ['idUser', 'nama'],
				include: [
					{ 
						attributes: ['nomorInduk', 'jabatanGuru', 'signature'],
						model: models.UserDetail,
					},
				],
			});

			const kepala_sekolah = []
			await Promise.all(datauser.filter(x => x.UserDetail.jabatanGuru !== null).map(x => {
				let splitJabatan = x.UserDetail.jabatanGuru.split(', ')
				if(splitJabatan.includes('1')){
					kepala_sekolah.push(x)
				}
			}))
			
			const dataNilai = await models.Nilai.findAll({
				where: { idUser: uid },
				attributes: ['mapel', 'dataNilai', 'dataKehadiran']
			})
			let hasilBayangan = 0
			let kehadiranBayangan = {
				sakit: 0,
				alfa: 0,
				ijin: 0,
			}
			let semester = cms_setting.semester.label.toLowerCase()
			let resultNilai = await Promise.all(dataNilai.map(async str => {
				const dataJadwal = await models.JadwalMengajar.findOne({ where: { kelas: dataSiswaSiswi.UserDetail.kelas, mapel: str.mapel, status: true } });
				const mengajar = await models.Mengajar.findOne({ where: { kode: str.mapel } })
				const { label } = mengajar.dataValues
				let jumlahTugas = dataJadwal?.jumlahTugas || 0
				let kkm = dataJadwal?.kkm || cms_setting?.kkm
				let dataStruktural = null
				if(dataJadwal) {
					dataStruktural = await models.User.findOne({ where: { idUser: dataJadwal.idUser } });
				}
				let hasil = JSON.parse(str.dataNilai)
				let hasil2 = JSON.parse(str.dataKehadiran)
				let nilaiData = hasil.filter(str => str.semester === semester)[0].nilai
				let kehadiranData = hasil2.filter(str => str.semester === semester)[0].kehadiran
				let totalNilaiTugas = Number(nilaiData.tugas1) + Number(nilaiData.tugas2) + Number(nilaiData.tugas3) + Number(nilaiData.tugas4) + Number(nilaiData.tugas5) + Number(nilaiData.tugas6) + Number(nilaiData.tugas7) + Number(nilaiData.tugas8) + Number(nilaiData.tugas9) + Number(nilaiData.tugas10)
				let rataRataTugas = totalNilaiTugas === 0 ? 0 : totalNilaiTugas / Number(jumlahTugas)
				let rataRataNilai = (Number(rataRataTugas) + Number(nilaiData.uts) + Number(nilaiData.uas)) / 3
				let hurufNilai = rataRataNilai <= 50 ? 'E' : rataRataNilai <= 65 ? 'D' : rataRataNilai <= 75 ? 'C' : rataRataNilai <= 85 ? 'B' : 'A'
				let hasilakhir = rataRataNilai != 0 ? Math.ceil(rataRataNilai) : 0
				hasilBayangan += hasilakhir
				kehadiranBayangan.sakit += kehadiranData.sakit
				kehadiranBayangan.alfa += kehadiranData.alfa
				kehadiranBayangan.ijin += kehadiranData.ijin
				return {
					mapel: label,
					nilai: hasilakhir,
					kehadiran: kehadiranData,
					namaGuru: dataStruktural ? dataStruktural.nama : '-',
					kkm,
					hurufNilai,
					pembilang: hasilakhir === 0 ? 'Nol' : pembilang(hasilakhir)
				}
			}))
			
			let hasilAkhir = Math.ceil(hasilBayangan / dataNilai.length)
			let hurufNilai = hasilAkhir <= 50 ? 'E' : hasilAkhir <= 65 ? 'D' : hasilAkhir <= 75 ? 'C' : hasilAkhir <= 85 ? 'B' : 'A'
			const hasil = {
				url: BASE_URL,
				idUser: dataSiswaSiswi.idUser,
				nomorInduk: dataSiswaSiswi.UserDetail.nomorInduk,
				nama: uppercaseLetterFirst2(dataSiswaSiswi.nama),
				kelas: dataSiswaSiswi.UserDetail.kelas,
				peringkat: dataSiswaSiswi.UserDetail.peringkat,
				jumlahSiswa,
				hasilAkhir,
				hurufNilai,
				waliKelas: {
					idUser: wali_kelas.idUser,
					nama: wali_kelas.nama,
					nomorInduk: wali_kelas.UserDetail.nomorInduk,
					signature: wali_kelas.UserDetail.signature,
				},
				kepalaSekolah: {
					idUser: kepala_sekolah.length ? kepala_sekolah[0].idUser : '',
					nama: kepala_sekolah.length ? kepala_sekolah[0].nama : '',
					nomorInduk: kepala_sekolah.length ? kepala_sekolah[0].UserDetail.nomorInduk : '',
					signature: kepala_sekolah.length ? kepala_sekolah[0].UserDetail.signature : '',
				},
				ttd: {
					tempat: cms_setting.kelurahan.label.split('. ')[1],
					tanggal: dateconvert(new Date())
				},
				pembilang: hasilAkhir === 0 ? 'Nol' : pembilang(hasilAkhir),
				dataNilai: resultNilai,
				kehadiran: kehadiranBayangan,
			}
			// return OK(res, hasil)
			ejs.renderFile(path.join(__dirname, "../../src/views/viewRaportSiswa.ejs"), { dataSiswa: hasil, cmsSetup: cms_setting }, (err, data) => {
				if (err) {
					console.log(err);
				} else {
					// console.log(data)
					let options = {
						format: "A4",
						orientation: "portrait",
						quality: "10000",
						border: {
							top: "1cm",
							right: "1cm",
							bottom: "1cm",
							left: "1cm"
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
						return stream.pipe(res);
					});
				}
			});
		} catch (err) {
			return NOT_FOUND(res, err.message)
		}
	}
}

function listSiswaSiswi (models) {
	return async (req, res, next) => {
		let { kelas, keyword } = req.query
		try {
			const whereKey = keyword ? {
				[Op.or]: [
					{ nama : { [Op.like]: `%${keyword}%` }},
					{ '$UserDetail.nomor_induk$' : { [Op.like]: `%${keyword}%` }},
				]
			} : {}

			where = { ...whereKey, isActive: true, mutasiAkun: false, consumerType: 4 }

			const dataSiswaSiswi = await models.User.findAll({
				where,
				attributes: ['idUser', 'nama', 'isActive'],
				include: [
					{ 
						model: models.UserDetail,
						attributes: ['nomorInduk', 'kelas', 'fotoProfil'],
						where: {
							kelas: kelas.split(', '),
						},
					},
				],
				order: [
					['nama', 'ASC'],
				],
			});

			const dataSiswa = await Promise.all(dataSiswaSiswi.map(async val => {
				return {
					idUser: val.idUser,
					nomorInduk: val.UserDetail.nomorInduk,
					nama: val.nama,
					kelas: val.UserDetail.kelas,
					fotoProfil: val.UserDetail.fotoProfil ? `${BASE_URL}image/${val.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
					isActive: val.isActive,
					statusAktif: val.statusAktif,
				}
			}))

			return OK(res, dataSiswa);
	  } catch (err) {
			return NOT_FOUND(res, err.message)
	  }
	}  
}

function unlinkFile (models) {
	return async (req, res, next) => {
		let { file, table, folder } = req.body
		try {
			if(folder === 'berkas'){
				let path_file = path.join(__dirname, `../public/${folder}/${file}`);
				fs.unlinkSync(path_file);
			}
			return OK(res)
		} catch (err) {
			return NOT_FOUND(res, err.message)
		}
	}
}

function testing (models) {
	return async (req, res, next) => {
		// let { untuk } = req.query
		// let where = {}
    try {
			// const { userID } = req.JWTDecoded
			// let hariArray = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
			// const dataKelas = await models.Kelas.findAll({ where: { status: true } })
			// let tambahJadwal = []
			// let result = await Promise.all(hariArray.map(async str => {
			// 	// if(untuk === 'admin'){
			// 	// 	where = { hari: str, status: true }
			// 	// }else{
			// 	// 	where = { idUser: userID, hari: str, status: true }
			// 	// }

			// 	const dataJadwal = await models.JadwalMengajar.findAll({ 
			// 		where: { hari: str, status: true },
			// 		attributes: ['idJadwalMengajar', 'idUser', 'mapel', 'kelas', 'hari', 'startTime', 'endTime'],
			// 		include: [
			// 			{ model: models.User, attributes: ['nama'] },
			// 			{ model: models.Mengajar, attributes: ['label', 'alias', 'color'] },
			// 		],
			// 	});
			// 	tambahJadwal = str !== 'Sabtu' ? [ ...dataJadwal, {
			// 		idJadwalMengajar: null,
			// 		idUser: null,
			// 		kelas: null,
			// 		hari: str,
			// 		startTime: '07:00:00',
			// 		endTime: '08:00:00',
			// 		User: { nama: 'ALL' },
			// 		Mengajar: { 
			// 			label: str === 'Senin' ? 'Upacara Bendera' : 'Bimbingan Konseling / Tadarus',
			// 			alias: str === 'Senin' ? 'Upacara Bendera' : 'Bimbingan Konseling / Tadarus',
			// 			color: '#e1e1f0'
			// 		}
			// 	},
			// 	{
			// 		idJadwalMengajar: null,
			// 		idUser: null,
			// 		kelas: null,
			// 		hari: str,
			// 		startTime: '09:30:00',
			// 		endTime: '10:00:00',
			// 		User: { nama: 'ALL' },
			// 		Mengajar: {
			// 			label: 'Istirahat',
			// 			alias: 'Istirahat',
			// 			color: '#e1e1f0'
			// 		}
			// 	},
			// 	{
			// 		idJadwalMengajar: null,
			// 		idUser: null,
			// 		kelas: null,
			// 		hari: str,
			// 		startTime: '11:30:00',
			// 		endTime: '12:30:00',
			// 		User: { nama: 'ALL' },
			// 		Mengajar: {
			// 			label: str === 'Jumat' ? 'Istirahat / Shalat Jumat' : 'Istirahat / Shalat Zuhur',
			// 			alias: str === 'Jumat' ? 'Istirahat / Shalat Jumat' : 'Istirahat / Shalat Zuhur',
			// 			color: '#e1e1f0'
			// 		}
			// 	}] : [ ...dataJadwal, {
			// 		idJadwalMengajar: null,
			// 		idUser: null,
			// 		kelas: null,
			// 		hari: str,
			// 		startTime: '08:00:00',
			// 		endTime: '15:00:00',
			// 		User: { nama: 'ALL' },
			// 		Mengajar: {
			// 			label: 'Ekstrakulikuler',
			// 			alias: 'Ekstrakulikuler',
			// 			color: '#e1e1f0'
			// 		}
			// 	}]
			// 	let record = _.groupBy(_.orderBy(tambahJadwal, ['startTime', 'kelas'], ['asc', 'asc']), 'startTime')
			// 	let kumpul = await Promise.all(Object.entries(record).map(val => {
			// 		let key = val[0]
			// 		let data = val[1]
			// 		let resdata = []
			// 		let waktu = ''
			// 		data.map(x => {
			// 			const { idJadwalMengajar, idUser, kelas, hari, startTime, endTime } = x
			// 			resdata.push({
			// 				idJadwalMengajar,
			// 				idUser,
			// 				namaGuru: x.User.nama,
			// 				mapel: x.Mengajar.label,
			// 				alias: x.Mengajar.alias,
			// 				color: x.Mengajar.color,
			// 				kelas,
			// 				// hari,
			// 				// startTime,
			// 				// endTime,
			// 			})
			// 			waktu = `${startTime} - ${endTime}`
			// 		})
			// 		return { waktu, jadwal: resdata }
			// 	}))
			// 	return { hari: str, dataJadwal: kumpul }
			// }))

			// const dataStruktural = await models.User.findAll({
			// 	where: {
			// 		consumerType: 3,
			// 		statusAktif: true
			// 	},
			// 	attributes: ['idUser', 'nama'],
			// 	include: [
			// 		{ 
			// 			model: models.UserDetail,
			// 			attributes: ['jabatanGuru', 'mengajarBidang', 'mengajarKelas', 'waliKelas'],
			// 		},
			// 	],
			// 	order: [['createdAt', 'ASC']],
			// });

			// const getResult = await Promise.all(dataStruktural.map(async val => {
			// 	const { UserDetail } = val
			// 	return {
			// 		idUser: val.idUser,
			// 		nama: val.nama,
			// 		jabatanGuru: UserDetail.jabatanGuru ? await _jabatanOption({ models, kode: UserDetail.jabatanGuru }) : [],
			// 		mengajarBidang: UserDetail.mengajarBidang ? await _mengajarOption({ models, kode: UserDetail.mengajarBidang }) : [],
			// 		mengajarKelas: UserDetail.mengajarKelas,
			// 		waliKelas: UserDetail.waliKelas,
			// 	}
			// }))

			// return OK(res, { result, dataKelas, dataGuru: getResult });
			return OK(res, makeRandom(10))
		} catch (err) {
			return NOT_FOUND(res, err.message)
		}
	}
}

module.exports = {
  getDashboard,
  getAdmin,
  getAdminbyUid,
  postAdmin,
  getStruktural,
  getStrukturalbyUid,
  postStruktural,
  getSiswaSiswi,
  getSiswaSiswibyUid,
  postSiswaSiswi,
  getWaliKelas,
  updatePeringkat,
  getJadwalMengajar,
  getJadwalPelajaran,
  getModulPelajaran,
  postJadwalMengajar,
  getKelasSiswa,
  getPenilaian,
  postPenilaian,
  downloadTemplate,
  downloadTemplateNilai,
  downloadTemplateJadwalExam,
  importExcel,
  exportExcel,
  pdfCreate,
  pdfCreateRaport,
  listSiswaSiswi,
  getQuestionExam,
  postQuestionExam,
  getListPickExam,
  postListPickExam,
  getJadwalExam,
  getJadwalExamID,
  getRandomQuestion,
	postJadwalExam,
	postJawabanExam,
	postKoreksiExam,
  unlinkFile,
  testing,
}