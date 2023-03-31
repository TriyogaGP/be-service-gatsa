const { response, OK, NOT_FOUND, NO_CONTENT } = require('../utils/response.utils');
const { encrypt, decrypt, createKSUID, buildMysqlResponseWithPagination } = require('../utils/helper.utils')
const { Op } = require('sequelize')
const sequelize = require('sequelize')
const { logger } = require('../configs/db.winston')
const _ = require('lodash')
const dotenv = require('dotenv');
dotenv.config();
const BASE_URL = process.env.BASE_URL

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
				{ fotoProfil: body.nama_folder+'/'+body.namaFile }
				await models.UserDetail.update(kirimdata, { where: { idUser: body.idUser } })
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
						{ menuRoute: body.menu_route },
						{ menuText: body.menu_text }
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
				if(await models.Menu.findOne({where: {[Op.or]: [{menuRoute: body.menu_route},{menuText: body.menu_text}], [Op.not]: [{idMenu: body.id_menu}]}})) return NOT_FOUND(res, 'Menu Route atau Menu Text sudah di gunakan !')
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
						menuSequence: dataMenu.menuSequence,
						statusAktif: dataMenu.statusAktif,
						kondisi: val.kondisi, 
						subMenu: dataSubMenuOrderBy.filter(value => value.statusAktif)
					};
					return objectBaru
				}))
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
		let { kondisi } = req.query
    try {
			if(kondisi === 'Use'){
				const dataKelas = await models.Kelas.findAll({where: {status: true}});
				let result = []
				await Promise.all(dataKelas.map(async str => {
					const user = await models.UserDetail.findOne({where: {waliKelas: str.dataValues.kelas}});
					if(user){
						result.push({ ...str.dataValues, kelas: `${str.dataValues.kelas} (sudah di gunakan)`, disabled: true })
					}else{
						result.push(str.dataValues)
					}
				}))
				return OK(res, _.orderBy(result, 'idKelas', 'ASC'));
			}

      const dataKelas = await models.Kelas.findAll({where: {status: true}});
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
		let jmlString = bagian == 'provinsi' ? 2 : bagian == 'kabkotaOnly' ? 5 : KodeWilayah.length
		let whereChar = (jmlString==2?5:(jmlString==5?8:13))
    let where = {}
		try {
			if(bagian == 'provinsi' || bagian == 'kabkotaOnly') {
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
				attributes: [['kode', 'value'], ['nama', 'text'], 'kodePos']
			});

			return OK(res, dataWilayah);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

module.exports = {
  updateFile,
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
  getCMSSetting,
  crudCMSSetting,
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
}