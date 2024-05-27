const {
	response,
	OK,
	NOT_FOUND,
	NO_CONTENT
} = require('@triyogagp/backend-common/utils/response.utils');
const {
	encrypt,
	decrypt,
	convertDateTime,
	createKSUID,
	makeRandom,
	UpperFirstLetter,
	inisialuppercaseLetterFirst,
	buildMysqlResponseWithPagination
} = require('@triyogagp/backend-common/utils/helper.utils')
const {
	_wilayahOption,
	_wilayahCount,
} = require('../controllers/helper.service')
const { Op, fn } = require('sequelize')
const sequelize = require('sequelize')
const { sequelizeInstance } = require('../configs/db.config');
const { logger } = require('../configs/db.winston')
const fs = require('fs');
const path = require('path');
const _ = require('lodash')
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const dotenv = require('dotenv');
dotenv.config();
dayjs.extend(utc);
dayjs.extend(timezone);
const BASE_URL = process.env.BASE_URL

function formatInterval(minutes) {
  let interval = [
    Math.floor(minutes / 60).toString(),  //hours ("1" - "12")
    (minutes % 60).toString()             //minutes ("1" - "59")
  ];
  // return interval[0].padStart(2, '0') + ' Jam ' + interval[1].padStart(2, '0') + ' Menit'
  return interval[0] + ' Jam ' + interval[1] + ' Menit'
}

function updateFile (models) {
  return async (req, res, next) => {
		let namaFile = req.files[0].filename;
		let body = { ...req.body, namaFile };
    try {
			let kirimdata
			if(body.table == 'UserDetail'){
				kirimdata = 
				body.field == 'ijazah' ? { fcIjazah: body.nama_folder+'/'+body.namaFile } : 
				body.field == 'skhun' ? { fcSKHUN: body.nama_folder+'/'+body.namaFile } : 
				body.field == 'kk' ? { fcKK: body.nama_folder+'/'+body.namaFile } : 
				body.field == 'ktp' ? { fcKTPOrtu: body.nama_folder+'/'+body.namaFile } : 
				body.field == 'aktalahir' ? { fcAktaLahir: body.nama_folder+'/'+body.namaFile } : 
				body.field == 'skl' ? { fcSKL: body.nama_folder+'/'+body.namaFile } : 
				body.field == 'signature' ? { signature: body.nama_folder+'/'+body.namaFile } : 
				{ fotoProfil: body.nama_folder+'/'+body.namaFile }
				await models.UserDetail.update(kirimdata, { where: { idUser: body.idUser } })
			}else if(body.table == 'CMSSetting'){
				kirimdata = { 
					setting: JSON.stringify({
						value: body.namaFile,
					}),
				}
				await models.CMSSetting.update(kirimdata, { where: { kode: body.kode } })
			}
			return OK(res, body);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function updateBerkas (models) {
  return async (req, res, next) => {
		let namaFile = req.files[0].filename;
		let body = { ...req.body, namaFile };
    try {
			let kirimdata
			if(body.table == 'Berkas'){
				kirimdata = { 
					idBerkas: await createKSUID(),
					type: body.type,
					title: body.title,
					ext: body.ext,
					statusAktif: 1,
					file: body.namaFile,
				}
				await models.Berkas.create(kirimdata)
			}else if(body.table == 'QuestionExam'){
				await models.TemporaryFile.create({ 
					kode: makeRandom(10),
					folder: body.folder,
					file: body.namaFile,
					use: 0,
				})
			}
			return OK(res, body);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getUID () {
  return async (req, res, next) => {
    try {
			const ksuid = await createKSUID()
			return OK(res, ksuid);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getEncrypt () {
  return async (req, res, next) => {
		let { kata } = req.query;
    try {
      let dataEncrypt = {
				asli: kata,
				hasil: encrypt(kata)
			}

			// logger.info(JSON.stringify({ message: dataEncrypt, level: 'info', timestamp: new Date() }), {route: '/settings/encryptPass'});
			return OK(res, dataEncrypt);
    } catch (err) {
			// logger.error(JSON.stringify({ message: err.message, level: 'error', timestamp: new Date() }), {route: '/settings/encryptPass'});
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getDecrypt () {
  return async (req, res, next) => {
		let { kata } = req.query;
    try {
      let dataDecrypt = {
				asli: kata,
				hasil: decrypt(kata)
			}
			return OK(res, dataDecrypt);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getMenu (models) {
  return async (req, res, next) => {
		let { pilihan, kategori, page = 1, limit = 10, keyword } = req.query
		let where = {}
		let order = []
    try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined
			order = [
				['kategori', 'DESC'],
				['menuSequence', 'ASC']
			]

			if(pilihan == 'ALL') {
				if(kategori) {
					where.kategori = kategori
				}	

				const dataMenu = await models.Menu.findAll({
					where,
					order,
				});

				return OK(res, dataMenu);
			}

			const whereKey = keyword ? {
				[Op.or]: [
					{ menuText : { [Op.like]: `%${keyword}%` }},
					{ menuRoute : { [Op.like]: `%${keyword}%` }},
					{ kategori : { [Op.like]: `%${keyword}%` }},
				]
			} : kategori ? { kategori: kategori } : {}

			where = whereKey

      const { count, rows: dataMenu } = await models.Menu.findAndCountAll({
				where,
				order,
				limit: parseInt(limit),
				offset: OFFSET,
			});

			const responseData = buildMysqlResponseWithPagination(
				dataMenu,
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function crudMenu (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
		let where = {}
    try {
			if(body.jenis == 'ADD'){
				where = { 
					statusAktif: true,
					[Op.or]: [
						// { 
						// 	[Op.and]: [
						// 		{ kategori: body.kategori },
						// 		{ menuRoute: body.menu_route },
						// 	]
						// },
						{ 
							[Op.and]: [
								{ menuRoute: body.menu_route },
								{ menuText: body.menu_text }
							]
						},
					]
				}
				const {count, rows} = await models.Menu.findAndCountAll({where});
				if(count) return NOT_FOUND(res, 'data sudah di gunakan !')
				let dataCek = await models.Menu.findOne({where: {kategori: body.kategori}, limit: 1, order: [['idMenu', 'DESC']]})
				let urutan = dataCek.menuSequence + 1
				kirimdata = {
					kategori: body.kategori,
					menuRoute: body.menu_route,
					menuText: body.menu_text,
					menuIcon: body.menu_icon,
					menuSequence: urutan,
					statusAktif: 1,
				}
				await models.Menu.create(kirimdata)
			}else if(body.jenis == 'EDIT'){
				if(await models.Menu.findOne({
					where: {
						[Op.and]: [
							{ menuRoute: body.menu_route },
							{ menuText: body.menu_text }
						],
						[Op.not]: [
							{idMenu: body.id_menu}
						]
					}
				})) return NOT_FOUND(res, 'Menu Route atau Menu Text sudah di gunakan !')
				kirimdata = {
					kategori: body.kategori,
					menuRoute: body.menu_route,
					menuText: body.menu_text,
					menuIcon: body.menu_icon,
					statusAktif: 1,
				}
				await models.Menu.update(kirimdata, { where: { idMenu: body.id_menu } })
			}else if(body.jenis == 'DELETE'){
				kirimdata = {
					statusAktif: 0
				}
				await models.Menu.update(kirimdata, { where: { idMenu: body.id_menu } })	
			}else if(body.jenis == 'STATUSRECORD'){
				kirimdata = { 
					statusAktif: body.status_aktif 
				}
				await models.Menu.update(kirimdata, { where: { idMenu: body.id_menu } })
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getRole (models) {
  return async (req, res, next) => {
		let { pilihan, sort, page = 1, limit = 10, keyword } = req.query
    let where = {}
		let order = []
    try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined
			order = [
				['createdAt', sort ? sort : 'ASC'],
			]

			if(pilihan == 'ALL') {
				const dataRole = await models.Role.findAll({
					order,
				});

				return OK(res, dataRole);
			}

			const whereKey = keyword ? {
				[Op.or]: [
					{ namaRole : { [Op.like]: `%${keyword}%` }},
				]
			} : {}

			where = whereKey

			const { count, rows: dataRole } = await models.Role.findAndCountAll({
				where,
				order,
				limit: parseInt(limit),
				offset: OFFSET,
			});

			const responseData = buildMysqlResponseWithPagination(
				dataRole,
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function crudRole (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
		let where = {}
    try {
			if(body.jenis == 'ADD'){
				where = { 
					status: true,
					namaRole: body.nama_role
				}
				const {count, rows} = await models.Role.findAndCountAll({where});
				if(count) return NOT_FOUND(res, 'data sudah di gunakan !')
				kirimdata = {
					namaRole: body.nama_role,
					status: 1,
				}
				let kirim = await models.Role.create(kirimdata)
				if(kirim){
					let data = await models.Role.findOne({where: {namaRole: body.nama_role}})
					let sendData = {
						idRole: data.idRole,
						menu: '',
					}
					await models.RoleMenu.create(sendData)
				}
			}else if(body.jenis == 'EDIT'){
				if(await models.Role.findOne({where: {namaRole: body.nama_role, [Op.not]: [{idRole: body.id_role}]}})) return NOT_FOUND(res, 'Nama Role sudah di gunakan !')
				kirimdata = {
					namaRole: body.nama_role,
					status: 1,
				}
				await models.Role.update(kirimdata, { where: { idRole: body.id_role } })
			}else if(body.jenis == 'DELETE'){
				kirimdata = {
					status: 0
				}
				await models.Role.update(kirimdata, { where: { idRole: body.id_role } })	
			}else if(body.jenis == 'STATUSRECORD'){
				kirimdata = { 
					status: body.status 
				}
				await models.Role.update(kirimdata, { where: { idRole: body.id_role } })
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getSequenceMenu (models) {
  return async (req, res, next) => {
    try {
      const dataMenu = await models.Menu.findAll({
				order: [
					['kategori', 'DESC'],
					['menuSequence', 'ASC']
				],
			});

			return OK(res, {
				Menu: dataMenu.filter(str => { return str.kategori === 'menu' }),
				SubMenu: dataMenu.filter(str => { return str.kategori === 'submenu' })
			});
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function crudSequenceMenu (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
    try {
			const { Menu } = body
			await Menu.map(async (val, i) => {
				await models.Menu.update({ menuSequence: i + 1 }, { where: { idMenu: val.idMenu } })
			})
			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getRoleMenu (models) {
  return async (req, res, next) => {
    let { id_role, page = 1, limit = 10, keyword } = req.query
		let where = {}
    try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined

			const whereKey = keyword ? {
				[Op.or]: [
					{ '$Role.nama_role$' : { [Op.like]: `%${keyword}%` }},
				]
			} : id_role ? { idRole: id_role } : {}

			where = whereKey

      const { count, rows: dataRoleMenu } = await models.RoleMenu.findAndCountAll({
				where,
				include: [
					{ 
						model: models.Role,
						attributes: ['namaRole'],
						where: { status: true }
					}
				],
				limit: parseInt(limit),
				offset: OFFSET,
			});
			let dataKumpul = []
			await dataRoleMenu.map(val => {
				let obj = {
					idRoleMenu: val.dataValues.idRoleMenu,
					idRole: val.dataValues.idRole,
					namaRole: val.dataValues.Role.namaRole
				}
				let objectBaru = Object.assign(obj, {
					menu: val.dataValues.menu ? JSON.parse([val.dataValues.menu]) : []
				});
				return dataKumpul.push(objectBaru)
			})
			
			let result = await Promise.all(dataKumpul.map(async value => {
				let kumpul = await Promise.all(value.menu.map(async val => {
					let kumpulsub = await Promise.all(val.subMenu.map(async val2 => {
						const dataMenu = await models.Menu.findOne({
							where: { idMenu: val2.idMenu }
						});
						return dataMenu
					}))
					const dataMenu = await models.Menu.findOne({
						where: { idMenu: val.idMenu }
					});
					let objectBaru = Object.assign(val, {
						menuRoute: dataMenu.menuRoute,
						menuText: dataMenu.menuText,
						menuIcon: dataMenu.menuIcon,
						menuSequence: dataMenu.menuSequence,
						statusAktif: dataMenu.statusAktif,
						kondisi: val.kondisi, 
						subMenu: kumpulsub
					});
					return objectBaru
				}))
				let objectBaru = Object.assign(value, { menu: kumpul.filter(value => value.statusAktif) });
				return objectBaru
			}))

			const responseData = buildMysqlResponseWithPagination(
				result,
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function crudRoleMenu (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
    try {
			kirimdata = {
				idRole: body.id_role,
				menu: JSON.stringify(body.menu),
			}
			await models.RoleMenu.update(kirimdata, { where: { idRoleMenu: body.id_role_menu } })
			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getKategoriNotifikasi (models) {
	return async (req, res, next) => {
    try {
			const { userID } = req.JWTDecoded
			const datakategori = await models.Notifikasi.findAll({
				where: { idUser: userID, isRead: false },
				order: [['createdAt','DESC']],
			});

			const result = datakategori.reduce((memo, notifikasi) => {
				const tmp = memo
				const { type } = notifikasi
				if(type === 'Record') tmp.record += 1
				if(type === 'Report') tmp.report += 1
				// if(type === 'Broadcast') tmp.broadcast += 1
				tmp.all += 1
				return tmp
			}, {
				all: 0,
				record: 0,
				report: 0,
				// broadcast: 0,
			})

			const response = [
				{
					kode: '1',
					text: 'All Notification',
					count: result.all,
				},
				{
					kode: '2',
					text: 'Record',
					count: result.record,
				},
				{
					kode: '3',
					text: 'Report',
					count: result.report,
				},
				// {
				// 	kode: '4',
				// 	text: 'Broadcast',
				// 	count: result.broadcast,
				// },
			]

			return OK(res, response);
	  } catch (err) {
			return NOT_FOUND(res, err.message)
	  }
	}  
}

function getNotifikasi (models) {
	return async (req, res, next) => {
	  let { page = 1, limit = 5, kategori, untuk } = req.query
		let whereUntuk = {}
    try {
			const { userID } = req.JWTDecoded
			if(untuk === 'pengirim'){
				whereUntuk.createBy = userID
			}else{
				whereUntuk.idUser = userID
			}
			const type = kategori === '1' ? ['Record', 'Report', 'Broadcast'] : kategori === '2' ? ['Record'] : kategori === '4' ? ['Broadcast'] : ['Report']
			const offset = limit * (page - 1)
			const { count, rows: datanotifikasi } = await models.Notifikasi.findAndCountAll({
				where: { ...whereUntuk, type: type },
				order: [['createdAt','DESC']],
				limit: parseInt(limit, 10),
				offset,
			});

			const records = await Promise.all(datanotifikasi.map(async val => {
				const dataBerkas = await models.Berkas.findAll({ where: { idBerkas: JSON.parse(val.dataValues.tautan), statusAktif: true } })
				const dataUser = await models.User.findOne({ where: { idUser: val.dataValues.idUser } })
				let pesan = JSON.parse(val.dataValues.pesan)
				return {
					...val.dataValues,
					pesan: {
						message: pesan.message,
						payload: JSON.stringify(pesan.payload),
					},
					params: JSON.parse(val.dataValues.params),
					tautan: await dataBerkas.map(k => {
						return {
							...k.dataValues,
							file: `${BASE_URL}berkas/${k.dataValues.file}`
						}
					}),
					tujuan: dataUser.nama,
					createdAt: convertDateTime(val.dataValues.createdAt),
				}
			}))

			const arrangeResponse = () => {
				const totalPage = Math.ceil(count / limit)
				const hasNext = totalPage > parseInt(page, 10)
				const pageSummary = { limit: Number(limit), page: Number(page), hasNext, lastID: '', total: count, totalPage }

				if(count > 0){
					pageSummary.lastID = datanotifikasi[datanotifikasi.length - 1].idNotifikasi
					return { records, pageSummary }
				}
				return { records: [], pageSummary }
			}

			return OK(res, arrangeResponse());
	  } catch (err) {
			return NOT_FOUND(res, err.message)
	  }
	}  
}

function getCountNotifikasi (models) {
	return async (req, res, next) => {
    try {
			const { userID } = req.JWTDecoded
			const datakategori = await models.Notifikasi.findAll({
				where: { idUser: userID, isRead: false },
				order: [['createdAt','DESC']],
			});

			const result = datakategori.reduce((memo, notifikasi) => {
				const tmp = memo
				const { type } = notifikasi
				if(type === 'Record') tmp.record += 1
				if(type === 'Report') tmp.report += 1
				if(type === 'Broadcast') tmp.broadcast += 1
				tmp.all += 1
				return tmp
			}, {
				all: 0,
				record: 0,
				report: 0,
				broadcast: 0,
			})

			const response = [
				{
					kode: '1',
					text: 'All Notification',
					count: result.all,
				},
				{
					kode: '2',
					text: 'Record',
					count: result.record,
				},
				{
					kode: '3',
					text: 'Report',
					count: result.report,
				},
				{
					kode: '4',
					text: 'Broadcast',
					count: result.broadcast,
				},
			]

			return OK(res, response);
	  } catch (err) {
			return NOT_FOUND(res, err.message)
	  }
	}  
}

function crudNotifikasi (models) {
	return async (req, res, next) => {
	  let body = { ...req.body }
    try {
			const { userID } = req.JWTDecoded
			if(body.jenis === 'ISREAD'){
				let payload = {
					isRead: 1,
				}
				await models.Notifikasi.update(payload, { where: { idNotifikasi: body.idNotifikasi } })
			}else if(body.jenis === 'ISREADALL'){
				const type = body.kategori === '1' ? ['Record', 'Report'] : body.kategori === '2' ? ['Record'] : body.kategori === '4' ? ['Broadcast'] : ['Report']
				const datanotifikasi = await models.Notifikasi.findAll({
					where: { idUser: userID, type: type, isRead: 0 },
					attributes: ["idNotifikasi", "type"],
				});
				await Promise.all(datanotifikasi.map(async val => {
					await models.Notifikasi.update({ isRead: 1 }, { where: { idNotifikasi: val.dataValues.idNotifikasi } })
				}))
			}else if(body.jenis === 'CREATE'){
				let payload = {
					idNotifikasi: await createKSUID(),
					idUser: body.idUser,
					type: body.type,
					judul: body.judul,
					pesan: JSON.stringify(body.pesan),
					params: body.params !== null ? JSON.stringify(body.params) : null,
					dikirim: body.dikirim,
					createBy: body.createBy,
				}
				await models.Notifikasi.create(payload)
			}else if(body.jenis === 'BROADCAST'){
				let payload = []
				await Promise.all(body.idUser.map(async idUser => {
					payload.push({
						idNotifikasi: await createKSUID(),
						idUser: idUser,
						type: body.type,
						judul: body.judul,
						pesan: JSON.stringify(body.pesan),
						params: body.params !== null ? JSON.stringify(body.params) : null,
						dikirim: body.dikirim,
						tautan: JSON.stringify(body.tautan),
						createBy: body.createBy,
				})
				}))
				// console.log(payload);
				await models.Notifikasi.bulkCreate(payload)
			}else if(body.jenis === 'DELETEBROADCAST'){
				await models.Notifikasi.destroy({ where: { idNotifikasi: body.idNotifikasi } })
			}
			return OK(res)
	  } catch (err) {
			return NOT_FOUND(res, err.message)
	  }
	}  
}

function getCMSSetting (models) {
  return async (req, res, next) => {
    try {
			const dataCMS = await models.CMSSetting.findAll();

			const data = {}
			dataCMS.forEach(str => {
				let eva = JSON.parse(str.setting)
				if(eva.label){
					data[str.kode] = eva
				}else{
					// if(str.kode === 'logo') return data[str.kode] = `${BASE_URL}bahan/${eva.value}`
					data[str.kode] = eva.value
				}
			})
			return OK(res, data);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function crudCMSSetting (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
    try {
			const mappingData = []
			Object.entries(body).forEach(str => {
				if(str[1].label){
					mappingData.push({
						kode: str[0],
						setting: str[1],
					})
				}else{
					mappingData.push({
						kode: str[0],
						setting: { value: str[1] },
					})
				}
			})

			await [null, ...mappingData].reduce(async (memo, data) => {
				await memo;
				await models.CMSSetting.upsert(
					{ setting : JSON.stringify(data.setting), kode: data.kode },
					{ where: { kode: data.kode } }
				)
			})
			return OK(res, mappingData);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getBerkas (models) {
  return async (req, res, next) => {
		let { page = 1, limit = 10, keyword } = req.query
    let where = {}
		let order = []
    try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined
			order = [
				['createdAt', 'DESC'],
			]

			const whereKey = keyword ? {
				[Op.or]: [
					{ title : { [Op.like]: `%${keyword}%` }},
				]
			} : {}

			where = whereKey

			const { count, rows: dataBerkas } = await models.Berkas.findAndCountAll({
				where,
				order,
				limit: parseInt(limit),
				offset: OFFSET,
			});

			const responseData = buildMysqlResponseWithPagination(
				await dataBerkas.map(val => {
					return {
						...val.dataValues,
						file: `${BASE_URL}berkas/${val.dataValues.file}`
					}
				}),
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function crudBerkas (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
		let where = {}
    try {
			if(body.jenis == 'STATUSRECORD'){
				kirimdata = { 
					statusAktif: body.statusAktif 
				}
				await models.Berkas.update(kirimdata, { where: { idBerkas: body.idBerkas } })
			}else if(body.jenis == 'DELETE'){
				await sequelizeInstance.transaction(async trx => {
					const dataBerkas = await models.Berkas.findOne({
						where: { idBerkas: body.idBerkas }
					});
					const { file } = dataBerkas.dataValues
					let path_file = path.join(__dirname, `../public/berkas/${file}`);
					fs.unlinkSync(path_file);
					await models.Berkas.destroy({ where: { idBerkas: body.idBerkas } }, { transaction: trx });
				})
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getCardRFID (models) {
  return async (req, res, next) => {
		let { sort, page = 1, limit = 10, keyword } = req.query
    let where = {}
		let order = []
    try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined
			order = [
				['createdAt', sort ? sort : 'ASC'],
			]

			const whereKey = keyword ? {
				[Op.or]: [
					{ rfid : { [Op.like]: `%${keyword}%` }},
					{ '$User.nama$' : { [Op.like]: `%${keyword}%` }},
				]
			} : {}

			where = whereKey

			const { count, rows: dataKartu } = await models.DataKartu.findAndCountAll({
				where,
				include: [
					{ 
						model: models.User,
						attributes: ['idUser', 'nama', 'email', 'consumerType'],
						include: [
							{ 
								model: models.UserDetail,
								attributes: ['nomorInduk'],
							},
						],
					},
				],
				order,
				limit: parseInt(limit),
				offset: OFFSET,
			});

			const responseData = buildMysqlResponseWithPagination(
				dataKartu.map(val => {
					return {
						idTabel: val.idTabel,
						idUser: val.idUser ? val.idUser : '-',
						consumerType: val.User ? val.User.consumerType : '-',
						// nama: val.User ? `${val.User.nama} (${val.User.consumerType === 3 ? 'Guru' : 'Siswa - Siswi'})` : '-',
						nama: val.User ? val.User.nama : '-',
						email: val.User ? val.User.email : '-',
						nomorInduk: val.User ? val.User.UserDetail.nomorInduk : '-',
						rfid: val.rfid,
						use: val.use,
						status: val.status,
					}
				}),
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function crudCardRFID (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
		let where = {}
    try {
			if(body.jenis == 'EDIT'){
				if(await models.DataKartu.findOne({where: {idUser: body.idUser, [Op.not]: [{rfid: body.rfid}]}})) return NOT_FOUND(res, 'User sudah di pilih !')
				kirimdata = {
					idUser: body.idUser,
					use: 1,
				}
				await models.DataKartu.update(kirimdata, { where: { rfid: body.rfid } })
			}else if(body.jenis == 'DELETE'){
				await models.DataKartu.destroy({ where: { rfid: body.rfid } })	
			}else if(body.jenis == 'STATUSRECORD'){
				kirimdata = { 
					idUser: null,
					status: body.status,
					use: 0,
				}
				await models.DataKartu.update(kirimdata, { where: { rfid: body.rfid } })
			}else if(body.jenis == 'USERECORD'){
				kirimdata = { 
					idUser: null,
					use: body.use,
				}
				await models.DataKartu.update(kirimdata, { where: { rfid: body.rfid } })
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsMenu (models) {
  return async (req, res, next) => {
    let { id_role } = req.query
    try {
      const dataRoleMenu = await models.RoleMenu.findAll({ where: { idRole: id_role }});

			let dataKumpul = []
			await dataRoleMenu.map(val => {
				let objectBaru = Object.assign(val.dataValues, {
					menu: val.dataValues.menu ? JSON.parse([val.dataValues.menu]) : []
				});
				return dataKumpul.push(objectBaru)
			})
			
			let result = await Promise.all(dataKumpul.map(async value => {
				let kumpul = await Promise.all(value.menu.map(async val => {
					let kumpulsub = await Promise.all(val.subMenu.map(async val2 => {
						const dataMenu = await models.Menu.findOne({
							where: { idMenu: val2.idMenu }
						});
						return dataMenu
					}))
					const dataMenu = await models.Menu.findOne({
						where: { idMenu: val.idMenu }
					});
					let dataSubMenuOrderBy = _.orderBy(kumpulsub, 'menuSequence', 'asc')
					let objectBaru = {
						menuRoute: dataMenu.menuRoute,
						menuText: dataMenu.menuText,
						menuIcon: dataMenu.menuIcon,
						menuSequence: id_role === '4' ? dataMenu.menuSequence : dataMenu.menuSequence + 1,
						statusAktif: dataMenu.statusAktif,
						kondisi: val.kondisi,
						subMenu: dataSubMenuOrderBy.filter(value => value.statusAktif)
					};
					return objectBaru
				}))
				if(id_role !== '4'){
					kumpul.push({
						menuRoute: '/dashboard',
						menuText: 'Dashboard',
						menuIcon: 'mdi mdi-view-dashboard',
						menuSequence: 1,
						statusAktif: true,
						kondisi: false, 
						subMenu: []
					})
				}
				let dataMenuOrderBy = _.orderBy(kumpul, 'menuSequence', 'asc')
				let objectBaru = Object.assign(value, { menu: dataMenuOrderBy.filter(value => value.statusAktif) });
				return objectBaru
			}))

			return OK(res, result);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsAgama (models) {
  return async (req, res, next) => {
    try {
      const dataAgama = await models.Agama.findAll();
			return OK(res, dataAgama);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsHobi (models) {
	return async (req, res, next) => {
	  try {
		const dataHobi = await models.Hobi.findAll();
			  return OK(res, dataHobi);
	  } catch (err) {
			  return NOT_FOUND(res, err.message)
	  }
	}  
}

function optionsCitaCita (models) {
	return async (req, res, next) => {
	  try {
		const dataCitaCita = await models.CitaCita.findAll();
			  return OK(res, dataCitaCita);
	  } catch (err) {
			  return NOT_FOUND(res, err.message)
	  }
	}  
}

function optionsJenjangSekolah (models) {
  return async (req, res, next) => {
    try {
      const dataJenjangSekolah = await models.JenjangSekolah.findAll();
			return OK(res, dataJenjangSekolah);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsPendidikan (models) {
  return async (req, res, next) => {
    try {
      const dataPendidikan = await models.Pendidikan.findAll();
			return OK(res, dataPendidikan);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsPekerjaan (models) {
  return async (req, res, next) => {
    try {
      const dataPekerjaan = await models.Pekerjaan.findAll();
			return OK(res, dataPekerjaan);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsPenghasilan (models) {
  return async (req, res, next) => {
    try {
      const dataPenghasilan = await models.Penghasilan.findAll();
			return OK(res, dataPenghasilan);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsJabatan (models) {
  return async (req, res, next) => {
    try {
      const dataJabatan = await models.Jabatan.findAll();
			return OK(res, dataJabatan);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsMengajar (models) {
  return async (req, res, next) => {
    try {
      const dataMengajar = await models.Mengajar.findAll();
			return OK(res, dataMengajar);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsKelas (models) {
  return async (req, res, next) => {
		let { kondisi, walikelas } = req.query
    try {
			const dataKelas = await models.Kelas.findAll({where: {status: true}});
			if(kondisi === 'Use'){
				let result = []
				await Promise.all(dataKelas.map(async str => {
					const user = await models.UserDetail.findOne({where: {waliKelas: str.dataValues.kelas}});
					if(user){
						if(walikelas !== user.dataValues.waliKelas){
							result.push({ ...str.dataValues, kelas: `${str.dataValues.kelas} (sudah di gunakan)`, disabled: true })
						}else{
							result.push(str.dataValues)
						}
					}else{
						result.push(str.dataValues)
					}
				}))
				return OK(res, _.orderBy(result, 'idKelas', 'ASC'));
			}

			return OK(res, dataKelas);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsStatusOrangtua (models) {
  return async (req, res, next) => {
    try {
      const dataStatusOrangtua = await models.StatusOrangtua.findAll();
			return OK(res, dataStatusOrangtua);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsStatusTempatTinggal (models) {
  return async (req, res, next) => {
    try {
      const dataStatusTempatTinggal = await models.StatusTempatTinggal.findAll();
			return OK(res, dataStatusTempatTinggal);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsJarakRumah (models) {
  return async (req, res, next) => {
    try {
      const dataJarakRumah = await models.JarakRumah.findAll();
			return OK(res, dataJarakRumah);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsTransportasi (models) {
  return async (req, res, next) => {
    try {
      const dataTransportasi = await models.Transportasi.findAll();
			return OK(res, dataTransportasi);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsWilayah (models) {
  return async (req, res, next) => {
		let { bagian, KodeWilayah } = req.query
		let jmlString = bagian == 'provinsi' ? 2 : bagian == 'kabkotaOnly' ? 5 : bagian == 'kecamatanOnly' ? 8 : bagian == 'kelurahanOnly' ? 13 : KodeWilayah.length
		let whereChar = (jmlString==2?5:(jmlString==5?8:13))
    let where = {}
		try {
			if(bagian == 'provinsi' || bagian == 'kabkotaOnly' || bagian == 'kecamatanOnly' || bagian == 'kelurahanOnly') {
				where = sequelize.where(sequelize.fn('char_length', sequelize.col('kode')), jmlString)
			}else{
				where = { 
					[Op.and]: [
						sequelize.where(sequelize.fn('char_length', sequelize.col('kode')), whereChar),
						{
							kode: {
								[Op.like]: `${KodeWilayah}%`
							}
						}
					]
				}
			}
			const dataWilayah = await models.Wilayah.findAll({
				where,
				// attributes: [['kode', 'value'], ['nama', 'text'], 'kodePos']
				attributes: ['kode', 'nama', 'kodePos'],
				order: [['kode', 'ASC']]
			});

			return OK(res, dataWilayah);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsWilayah2023 (models) {
  return async (req, res, next) => {
		let { bagian, KodeWilayah } = req.query
		let jmlString = bagian == 'provinsi' ? 2 : bagian == 'kabkotaOnly' ? 5 : bagian == 'kecamatanOnly' ? 8 : bagian == 'kelurahanOnly' ? 13 : KodeWilayah.length
		let whereChar = bagian === 'kabkota' || bagian === 'kecamatan' || bagian === 'kelurahan' ? (jmlString == 2 ? 5 : (jmlString == 5 ? 8 : 13)) : jmlString
    let where = {}
    let attributes = ['idLocation', [sequelize.fn('LEFT', sequelize.col('kode'), whereChar), 'kode']]
		try {
			if(bagian === 'kabkota' || bagian === 'kecamatan' || bagian === 'kelurahan')
			where = { 
				kode: { [Op.like]: `${KodeWilayah}%` },
				statusAktif: true,
			}
			if(bagian === 'provinsi') { attributes.push(['nama_prov', 'nama']) }
			if(bagian === 'kabkotaOnly' || bagian === 'kabkota') { attributes.push('jenisKabKota', ['nama_kabkota', 'nama']) }
			if(bagian === 'kecamatanOnly' || bagian === 'kecamatan') { attributes.push(['nama_kec', 'nama']) }
			if(bagian === 'kelurahanOnly' || bagian === 'kelurahan') { attributes.push('jenisKelDes', ['nama_keldes', 'nama'], 'kodePos') }
			const dataWilayah = await models.Wilayah2023.findAll({
				where,
				attributes,
				order: [['kode', 'ASC']],
				group: [sequelize.fn('LEFT', sequelize.col('kode'), whereChar)]
			});

			return OK(res, dataWilayah);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function optionsBerkas (models) {
  return async (req, res, next) => {
		const { kategori } = req.query
		let where = {}
    try {
			if(kategori === 'tautan') where = { statusAktif: true }
      const dataBerkas = await models.Berkas.findAll({ where });
			let extGBR = [], extFile = []
			await Promise.all(dataBerkas.map(val => {
				if(val.dataValues.type === 'Gambar'){
					extGBR.push({
						...val.dataValues,
						file: `${BASE_URL}berkas/${val.dataValues.file}`
					})
				}else if(val.dataValues.type === 'File'){
					extFile.push({
						...val.dataValues,
						file: `${BASE_URL}berkas/${val.dataValues.file}`
					})
				}
			}))

			if(extGBR.length && extFile.length){
				// return OK(res, [{header: 'Files'}, ...extFile, {divider: true}, {header: 'Images'}, ...extGBR]);
				return OK(res, [...extFile, ...extGBR]);
			}else if(extGBR.length && !extFile.length){
				// return OK(res, [{header: 'Images'}, ...extGBR]);
				return OK(res, [...extGBR]);
			}else if(!extGBR.length && extFile.length){
				// return OK(res, [{header: 'Files'}, ...extFile]);
				return OK(res, [...extFile]);
			}
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getUserBroadcast (models) {
	return async (req, res, next) => {
		const { kategori, kode } = req.query
    try {
			const { consumerType } = req.JWTDecoded
			const type = consumerType === 1 || consumerType === 2 || (consumerType === 3 && kode === '1') ? [3, 4] : consumerType === 3 ? 4 : 3
			if(kategori === 'USER'){
				const dataUser = await models.User.findAll({
					where: {
						consumerType: type,
						statusAktif: true,
					},
					include: [
						{ 
							model: models.UserDetail,
						},
					],
					order: [
						[models.UserDetail, 'kelas', 'ASC'],
						['nama', 'ASC'],
					],
				});
				let pushSiswa = [], pushGuru = []
				await Promise.all(dataUser.map(async val => {
					const group = val.consumerType === 3 ? 'Guru' : 'Siswa-Siswi'
					if(val.consumerType === 3){
						pushGuru.push({
							idUser: val.idUser,
							consumerType: val.consumerType,
							nama: val.nama,
							kelas: val.UserDetail.kelas,
							text: val.consumerType === 3 ? `${val.nama}` : `${val.nama} (${val.UserDetail.kelas})`,
							value: val.idUser,
							group,
							fotoProfil: val.UserDetail.fotoProfil ? `${BASE_URL}image/${val.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
						})
					}
					if(val.consumerType === 4){
						pushSiswa.push({
							idUser: val.idUser,
							consumerType: val.consumerType,
							nama: val.nama,
							kelas: val.UserDetail.kelas,
							text: val.consumerType === 3 ? `${val.nama}` : `${val.nama} (${val.UserDetail.kelas})`,
							value: val.idUser,
							group,
							fotoProfil: val.UserDetail.fotoProfil ? `${BASE_URL}image/${val.UserDetail.fotoProfil}` : `${BASE_URL}bahan/user.png`,
						})
					}
				}))
				if(pushSiswa.length && pushGuru.length){
					return OK(res, [{ type: 'subheader', title: 'Guru' }, {divider: true}, ...pushGuru, {divider: true}, {type: 'subheader', title: 'Siswa-Siswi'}, {divider: true}, ...pushSiswa]);
					// return OK(res, [...pushGuru, ...pushSiswa]);
				}else if(pushSiswa.length && !pushGuru.length){
					return OK(res, [{type: 'subheader', title: 'Siswa-Siswi'}, {divider: true}, ...pushSiswa]);
					// return OK(res, [...pushSiswa]);
				}else if(!pushSiswa.length && pushGuru.length){
					return OK(res, [{type: 'subheader', title: 'Guru'}, {divider: true}, ...pushGuru]);
					// return OK(res, [...pushGuru]);
				}
			}else if(kategori === 'KELAS'){
				const dataKelas = await models.Kelas.findAll({
					where: {
						status: true
					},
				});

				const dataUser = await Promise.all(dataKelas.map(async val => {
					const user = await models.User.findAll({
						where: {
							consumerType: 4,
							statusAktif: true,
						},
						include: [
							{ 
								where: {
									kelas: val.kelas,
								},
								model: models.UserDetail,
							},
						],
						order: [
							['nama', 'ASC'],
						],
					});
					const result = []
					await Promise.all(user.map(async val => {
						result.push(val.idUser)
						return result
					}))
					return {
						text: val.kelas,
						value: val.kelas,
						listUser: result,
					}
				}))
				return OK(res, dataUser);
			}
	  } catch (err) {
			return NOT_FOUND(res, err.message)
	  }
	}  
}

function getListExam (models) {
  return async (req, res, next) => {
		const { kelas } = req.query
    try {
			if(!kelas) return NOT_FOUND(res, 'param tidak ditemukan')
      const dataExam = await models.JadwalExam.findAll({ where: { kelas: kelas, status: true } });
			return OK(res, await Promise.all(dataExam.map(async val => {
				const dataMapel = await models.Mengajar.findOne({ where: { kode: val.dataValues.mapel } });
				const check = await models.AnswerExam.count({ where: { mapel: val.dataValues.mapel, kelas: kelas } });
				return {
					...val.dataValues,
					mapel: dataMapel.label,
					kondisi: check > 0,
				}
			})))
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function getRFID (models) {
	return async (req, res, next) => {
		let { kode, absen, rfid } = req.query
		try {
			let payload;
			if(kode === 'enroll'){
				if(rfid === '') return OK(res, { kode: 0, pesan: "Silahkan scan New RFID!" })
				const check = await models.DataKartu.count({ where: { rfid: rfid, status: true } })
				if(!check){
					payload = {
						rfid: rfid,
						use: 0,
						status: 1,
					}
					await models.DataKartu.create(payload)
					return OK(res, { kode: 1, pesan: "New RFID sudah diinputkan!" })
				}else{
					return OK(res, { kode: 2, pesan: "RFID sudah tersedia!" })
				}
			}else if(kode === 'access'){
				if(rfid === '') return OK(res, { kode: 0, pesan: "Silahkan scan RFID!" })
				const check = await models.DataKartu.findOne({ where: { rfid: rfid, use: true, status: true } })
				if(check){
					const dataSiswaSiswi = await models.User.findOne({
						where: { consumerType: [3, 4], idUser: check.idUser },
						attributes: ['idUser', 'nama', 'email'],
					});
					let nama = dataSiswaSiswi.nama.split(' ')
					let namaFirst = nama[0];
					let gabungNama = [];
					for(let i = 1; i < nama.length; i++){
						gabungNama.push(`${inisialuppercaseLetterFirst(nama[i])}${i !== nama.length - 1 ? '.' : ''}`)
					}

					let dateNow = dayjs().format("YYYY-MM-DD")
					let waktuNow = dayjs().format("HH:mm:ss")
					let pesan = ''
					let pesanAbsen = ''
					let totime = dayjs();
					let interval_masuk = totime.diff(dayjs().hour(8).minute(0), "minute");
					let interval_keluar = totime.diff(dayjs().hour(16).minute(0), "minute");
					if(absen === 'masuk'){
						if(waktuNow < "06:00:00") return OK(res, {
							kode: 2,
							pesan: 'Waktu Absen belum tersedia',
							pesanAbsen: '',
							data: ''
						})
						const count = await models.Absensi.count()
						if(count === 0){ 
							pesan = 'Berhasil Absen!'
							pesanAbsen = waktuNow >= "06:00:00" && waktuNow <= "08:00:00" ? 'absen tidak telat' : 'absen telat'
							payload = {
								idUser: dataSiswaSiswi.idUser,
								kategori: 'Masuk',
								absenTime: new Date(),
								absenTimeLate: waktuNow >= "06:00:00" && waktuNow <= "08:00:00" ? null : formatInterval(interval_masuk),
								pesanAbsen,
							}
							await models.Absensi.create(payload)
						}else{
							const dataAbsen = await models.Absensi.findOne({ where: { idUser: dataSiswaSiswi.idUser, kategori: 'Masuk' }, order: [ ['idAbsen', 'DESC'] ] })			
							let dateNow_masuk = dayjs(dataAbsen.absenTime).format("YYYY-MM-DD")
							if(dateNow !== dateNow_masuk){
								if(waktuNow >= "06:00:00" && waktuNow <= "08:00:00"){
									pesan = 'Berhasil Absen!'
									pesanAbsen = 'absen tidak telat'
									payload = {
										idUser: dataSiswaSiswi.idUser,
										kategori: 'Masuk',
										absenTime: new Date(),
										absenTimeLate: null,
										pesanAbsen,
									}
									await models.Absensi.create(payload)
								}else if(waktuNow > "08:00:00" && waktuNow < "16:00:00"){
									pesan = 'Berhasil Absen!'
									pesanAbsen = 'absen telat'
									payload = {
										idUser: dataSiswaSiswi.idUser,
										kategori: 'Masuk',
										absenTime: new Date(),
										absenTimeLate: formatInterval(interval_masuk),
										pesanAbsen,
									}
									await models.Absensi.create(payload)
								}
							}else{
								pesan = 'Sudah Absen!'
							}
						}
					}else if(absen === 'keluar'){
						if(waktuNow < "16:00:00") return OK(res, {
							kode: 2,
							pesan: 'Waktu Absen belum tersedia',
							pesanAbsen: '',
							data: ''
						})
						const count = await models.Absensi.count()
						if(count === 0){ 
							pesan = 'Berhasil Absen!'
							pesanAbsen = waktuNow >= "16:00:00" && waktuNow <= "19:00:00" ? 'absen tidak telat' : 'absen telat'
							payload = {
								idUser: dataSiswaSiswi.idUser,
								kategori: 'Keluar',
								absenTime: new Date(),
								absenTimeLate: waktuNow >= "16:00:00" && waktuNow <= "19:00:00" ? null : formatInterval(interval_keluar),
								pesanAbsen,
							}
							await models.Absensi.create(payload)
						}else{
							const dataAbsen = await models.Absensi.findOne({ where: { idUser: dataSiswaSiswi.idUser, kategori: 'Keluar' }, order: [ ['idAbsen', 'DESC'] ] })			
							let dateNow_keluar = dayjs(dataAbsen.absenTime).format("YYYY-MM-DD")
							if(dateNow !== dateNow_keluar){
								if(waktuNow >= "16:00:00" && waktuNow <= "19:00:00"){
									pesan = 'Berhasil Absen!'
									pesanAbsen = 'absen tidak lembur'
									payload = {
										idUser: dataSiswaSiswi.idUser,
										kategori: 'Keluar',
										absenTime: new Date(),
										absenTimeLate: null,
										pesanAbsen,
									}
									await models.Absensi.create(payload)
								}else if(waktuNow > "19:00:00" && waktuNow <= "23:59:00"){
									pesan = 'Berhasil Absen!'
									pesanAbsen = 'absen lembur'
									payload = {
										idUser: dataSiswaSiswi.idUser,
										kategori: 'Keluar',
										absenTime: new Date(),
										absenTimeLate: formatInterval(interval_keluar),
										pesanAbsen,
									}
									await models.Absensi.create(payload)
								}
							}else{
								pesan = 'Sudah Absen!'
							}
						}
					}

					return OK(res, {
						kode: 1,
						pesan,
						pesanAbsen,
						data: {
							idUser: dataSiswaSiswi.idUser,
							nama: `${UpperFirstLetter(namaFirst)}${gabungNama.length ? ` ${gabungNama.join('')}` : ''}`,
							email: dataSiswaSiswi.email,
							rfid: rfid,
						}
					})
				}else{
					return OK(res, { kode: 2, pesan: "Kartu belum digunakan!" })
				}
			}
		} catch (err) {
			return NOT_FOUND(res, err.message)
		}
	}
}

// tabel m_wilayah
function getWilayah (models) {
	return async (req, res, next) => {
		let { page = 1, limit = 20, keyword, bagian } = req.query
		let jmlString = bagian == 'provinsiOnly' ? 2 : bagian == 'kabkotaOnly' ? 5 : bagian == 'kecamatanOnly' ? 8 : 13
    let where = {}
		try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined
			let whereChar = sequelize.where(sequelize.fn('char_length', sequelize.col('kode')), jmlString)
			const whereKey = keyword ? {
				[Op.or]: [
					{ nama : { [Op.like]: `%${keyword}%` }},
					{ kode : { [Op.like]: `${keyword}%` }},
				]
			} : {}

			where = { ...whereKey, whereChar }

			const { count, rows: dataWilayah } = await models.Wilayah.findAndCountAll({
				where,
				order: [['kode', 'ASC']],
				limit: parseInt(limit),
				offset: OFFSET,
			});

			const getResult = await Promise.all(dataWilayah.map(async val => {
				const split = val.kode.split('.')
				if(bagian === 'provinsiOnly'){
					const countWilayah = await _wilayahCount({ models, kode: val.kode })
					return {
						idLocation: val.idLocation,
						kode: val.kode,
						provinsi: val.nama,
						countWilayah,
					}
				}else if(bagian === 'kabkotaOnly'){
					const provinsi = await _wilayahOption({ models, kode: split[0] })
					const countWilayah = await _wilayahCount({ models, kode: val.kode })
					return {
						idLocation: val.idLocation,
						kode: val.kode,
						provinsi: provinsi ? provinsi.nama : '',
						kabkota: val.nama,
						kategori: val.kategori,
						countWilayah,
					}
				}else if(bagian === 'kecamatanOnly'){
					const provinsi = await _wilayahOption({ models, kode: split[0] })
					const kabkota = await _wilayahOption({ models, kode: `${split[0]}.${split[1]}` })
					const countWilayah = await _wilayahCount({ models, kode: val.kode })
					return {
						idLocation: val.idLocation,
						kode: val.kode,
						provinsi: provinsi ? provinsi.nama : '',
						kabkota: kabkota ? kabkota.nama : '',
						kecamatan: val.nama,
						countWilayah,
					}
				}else if(bagian === 'kelurahanOnly'){
					const provinsi = await _wilayahOption({ models, kode: split[0] })
					const kabkota = await _wilayahOption({ models, kode: `${split[0]}.${split[1]}` })
					const kecamatan = await _wilayahOption({ models, kode: `${split[0]}.${split[1]}.${split[2]}` })
					return {
						idLocation: val.idLocation,
						kode: val.kode,
						provinsi: provinsi ? provinsi.nama : '',
						kabkota: kabkota ? kabkota.nama : '',
						kecamatan: kecamatan ? kecamatan.nama : '',
						kelurahan: val.nama,
						kategori: val.kategori,
						kodePos: val.kodePos,
					}
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

function getWilayah2023 (models) {
	return async (req, res, next) => {
		let { page = 1, limit = 20, keyword } = req.query
    let where = {}
		try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined
			const whereKey = keyword ? {
				[Op.or]: [
					{ kode : { [Op.like]: `${keyword}%` }},
					{ namaProv : { [Op.like]: `%${keyword}%` }},
					{ namaKabKota : { [Op.like]: `%${keyword}%` }},
					{ namaKec : { [Op.like]: `%${keyword}%` }},
					{ namaKelDes : { [Op.like]: `%${keyword}%` }},
					{ kodePos : { [Op.like]: `${keyword}%` }},
				]
			} : {}
			
			const { count, rows: dataWilayah } = await models.Wilayah2023.findAndCountAll({
				where: whereKey,
				order: [['kode', 'ASC']],
				limit: parseInt(limit),
				offset: OFFSET,
			});

			const getResult = await Promise.all(dataWilayah.map(async val => {
				const split = val.kode.split('.')
				return {
					idLocation: val.idLocation,
					kode: val.kode,
					kodeProv: `${split[0]} - ${val.namaProv}`,
					namaProv: `Provinsi ${val.namaProv}`,
					kodeKabKota: `${split[0]}.${split[1]} - ${val.namaKabKota}`,
					namaKabKota: `${val.jenisKabKota} ${val.namaKabKota}`,
					kodeKec: `${split[0]}.${split[1]}.${split[2]} - ${val.namaKec}`,
					namaKec: `Kecamatan ${val.namaKec}`,
					namaKelDes: val.namaKelDes,
					kodePos: val.kodePos,
					jenisKabKota: val.jenisKabKota,
					jenisKelDes: val.jenisKelDes,
					statusAktif: val.statusAktif,
				}
			}))

			let countProvinsi = await models.Wilayah2023.count({ where: { statusAktif: true }, group: ['namaProv'] })
			let countKota = await models.Wilayah2023.count({ where: { jenisKabKota: 'Kota', statusAktif: true }, group: [sequelize.fn('LEFT', sequelize.col('kode'), 5)] })
			let countKabupaten = await models.Wilayah2023.count({ where: { jenisKabKota: 'Kabupaten', statusAktif: true }, group: [sequelize.fn('LEFT', sequelize.col('kode'), 5)] })
			let countKecamatan = await models.Wilayah2023.count({ where: { statusAktif: true }, group: [sequelize.fn('LEFT', sequelize.col('kode'), 8)] })
			let countKelurahan = await models.Wilayah2023.count({ where: { jenisKelDes: 'Kelurahan', statusAktif: true } })
			let countDesa = await models.Wilayah2023.count({ where: { jenisKelDes: 'Desa', statusAktif: true } })

			const responseData = buildMysqlResponseWithPagination(
				getResult,
				{ limit, page, total: count }
			)

			return OK(res, { ...responseData, countWilayah: {
				provinsi: countProvinsi.length,
				kota: countKota.length,
				kabupaten: countKabupaten.length,
				kabkota: countKota.length + countKabupaten.length,
				kecamatan: countKecamatan.length,
				kelurahan: countKelurahan,
				desa: countDesa,
				keldes: countKelurahan + countDesa
			} });
		} catch (err) {
			console.log(err);
			return NOT_FOUND(res, err.message)
		}
	}
}

function crudWilayah (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
		let where = {}
    try {
			if(body.jenis == 'ADD'){
				kirimdata = {
					kode: body.kode,
					nama: body.nama,
					kategori: body.kategori,
					kodePos: body.kodePos,
				}
				await models.Wilayah.create(kirimdata)
			}else if(body.jenis == 'EDIT'){
				if(body.enabled){
					kirimdata = {
						kode: body.kode,
						nama: body.nama,
						kategori: body.kategori,
						kodePos: body.kodePos,
					}
					await models.Wilayah.update(kirimdata, { where: { idLocation: body.idLocation } })
				}else if(!body.enabled && body.bagian === 'kabkotaOnly'){
					await sequelizeInstance.transaction(async trx => {
						let whereCharKec = sequelize.where(sequelize.fn('char_length', sequelize.col('kode')), 8)
						let whereCharKel = sequelize.where(sequelize.fn('char_length', sequelize.col('kode')), 13)
						const dataWilayahKec = await models.Wilayah.findAll({
							where: { ...{ kode : { [Op.like]: `${body.kodeTemp}%` }}, whereCharKec },
							order: [['kode', 'ASC']],
						});
						await dataWilayahKec.map(async x => {
							let splitkode = x.kode.split('.')
							await models.Wilayah.update({kode: `${body.kode}.${splitkode[2]}`}, { where: { idLocation: x.idLocation } }, { transaction: trx })
						})
						const dataWilayahKel = await models.Wilayah.findAll({
							where: { ...{ kode : { [Op.like]: `${body.kodeTemp}%` }}, whereCharKel },
							order: [['kode', 'ASC']],
						});
						await dataWilayahKel.map(async x => {
							let splitkode = x.kode.split('.')
							await models.Wilayah.update({kode: `${body.kode}.${splitkode[2]}.${splitkode[3]}`}, { where: { idLocation: x.idLocation } }, { transaction: trx })
						})
						kirimdata = {
							kode: body.kode,
							nama: body.nama,
							kategori: body.kategori,
							kodePos: body.kodePos,
						}
						await models.Wilayah.update(kirimdata, { where: { idLocation: body.idLocation } }, { transaction: trx })
					})
				}else if(!body.enabled && body.bagian === 'kecamatanOnly'){
					await sequelizeInstance.transaction(async trx => {
						let whereCharKel = sequelize.where(sequelize.fn('char_length', sequelize.col('kode')), 13)
						const dataWilayahKel = await models.Wilayah.findAll({
							where: { ...{ kode : { [Op.like]: `${body.kodeTemp}%` }}, whereCharKel },
							order: [['kode', 'ASC']],
						});
						await dataWilayahKel.map(async x => {
							let splitkode = x.kode.split('.')
							await models.Wilayah.update({kode: `${body.kode}.${splitkode[3]}`}, { where: { idLocation: x.idLocation } }, { transaction: trx })
						})
						kirimdata = {
							kode: body.kode,
							nama: body.nama,
							kategori: body.kategori,
							kodePos: body.kodePos,
						}
						await models.Wilayah.update(kirimdata, { where: { idLocation: body.idLocation } }, { transaction: trx })
					})
				}else if(!body.enabled && body.bagian === 'kelurahanOnly'){
					kirimdata = {
						kode: body.kode,
						nama: body.nama,
						kategori: body.kategori,
						kodePos: body.kodePos,
					}
					await models.Wilayah.update(kirimdata, { where: { idLocation: body.idLocation } })
				}
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res);
    } catch (err) {
			console.log(err);
			return NOT_FOUND(res, err.message)
    }
  }  
}

function crudWilayah2023 (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
    try {
			if(body.jenis == 'ADD'){
				kirimdata = {
					kode: body.kode,
					namaProv: body.namaProv,
					namaKabKota: body.namaKabKota,
					namaKec: body.namaKec,
					namaKelDes: body.namaKelDes,
					kodePos: body.kodePos,
					jenisKabKota: body.jenisKabKota,
					jenisKelDes: body.jenisKelDes,
					statusAktif: 1,
				}
				await models.Wilayah2023.create(kirimdata)
			}else if(body.jenis == 'EDIT'){
				kirimdata = {
					kode: body.kode,
					namaProv: body.namaProv,
					namaKabKota: body.namaKabKota,
					namaKec: body.namaKec,
					namaKelDes: body.namaKelDes,
					kodePos: body.kodePos,
					jenisKabKota: body.jenisKabKota,
					jenisKelDes: body.jenisKelDes,
				}
				await models.Wilayah2023.update(kirimdata, { where: { idLocation: body.idLocation } })
			}else if(body.jenis == 'STATUSRECORD'){
				kirimdata = {
					statusAktif: body.statusAktif,
				}
				await models.Wilayah2023.update(kirimdata, { where: { idLocation: body.idLocation } })
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res, kirimdata);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function testing (models) {
	return async (req, res, next) => {
		try {
			let countProvinsi = await models.Wilayah2023.count({ group: ['namaProv'] })
			let countKota = await models.Wilayah2023.count({ where: { jenisKabKota: 'Kota' }, group: [sequelize.fn('LEFT', sequelize.col('kode'), 5)] })
			let countKabupaten = await models.Wilayah2023.count({ where: { jenisKabKota: 'Kabupaten' }, group: [sequelize.fn('LEFT', sequelize.col('kode'), 5)] })
			let countKecamatan = await models.Wilayah2023.count({ group: [sequelize.fn('LEFT', sequelize.col('kode'), 8)] })
			let countKelurahan = await models.Wilayah2023.count({ where: { jenisKelDes: 'Kelurahan' } })
			let countDesa = await models.Wilayah2023.count({ where: { jenisKelDes: 'Desa' } })
			return OK(res, {
				provinsi: countProvinsi.length,
				kota: countKota.length,
				kabupaten: countKabupaten.length,
				kabkota: countKota.length + countKabupaten.length,
				kecamatan: countKecamatan.length,
				kelurahan: countKelurahan,
				desa: countDesa,
				keldes: countKelurahan + countDesa
			})
		} catch (err) {
			return NOT_FOUND(res, err.message)
		}
	}
}

module.exports = {
  updateFile,
  updateBerkas,
  getUID,
  getEncrypt,
  getDecrypt,
  getMenu,
  crudMenu,
  getSequenceMenu,
  crudSequenceMenu,
  getRole,
  crudRole,
  getRoleMenu,
  crudRoleMenu,
  getKategoriNotifikasi,
  getNotifikasi,
  getCountNotifikasi,
  crudNotifikasi,
  getCMSSetting,
  crudCMSSetting,
  getBerkas,
  crudBerkas,
  getCardRFID,
  crudCardRFID,
  optionsMenu,
  optionsAgama,
  optionsHobi,
  optionsCitaCita,
  optionsJenjangSekolah,
  optionsPendidikan,
  optionsPekerjaan,
  optionsPenghasilan,
  optionsJabatan,
  optionsMengajar,
  optionsKelas,
  optionsStatusOrangtua,
  optionsStatusTempatTinggal,
  optionsJarakRumah,
  optionsTransportasi,
  optionsWilayah,
  optionsWilayah2023,
  optionsBerkas,
  getUserBroadcast,
  getListExam,
  getRFID,
  getWilayah,
  crudWilayah,
  getWilayah2023,
  crudWilayah2023,
  testing,
}