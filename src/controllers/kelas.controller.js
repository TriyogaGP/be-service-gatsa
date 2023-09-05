const {
	response,
	OK,
	NOT_FOUND,
	NO_CONTENT
} = require('@triyogagp/backend-common/utils/response.utils');
const {
	encrypt,
	decrypt,
	buildMysqlResponseWithPagination
} = require('@triyogagp/backend-common/utils/helper.utils');
const { Op } = require('sequelize')
const sequelize = require('sequelize')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const _ = require('lodash');
const { logger } = require('../configs/db.winston')
const nodeGeocoder = require('node-geocoder');
const dotenv = require('dotenv');
dotenv.config();
const BASE_URL = process.env.BASE_URL

function getKelas (models) {
  return async (req, res, next) => {
		let { page = 1, limit = 20, keyword } = req.query
    let where = {}
    try {
			const OFFSET = page > 0 ? (page - 1) * parseInt(limit) : undefined

			const whereKey = keyword ? {
				[Op.or]: [
					{ kelas : { [Op.like]: `%${keyword}%` }},
				]
			} : {}

			where = whereKey

      const { count, rows: dataKelas } = await models.Kelas.findAndCountAll({
				where,
				order: [
					['idKelas', 'ASC'],
				],
				limit: parseInt(limit),
				offset: OFFSET,
			});

			// return OK(res, dataAdmin)
			const responseData = buildMysqlResponseWithPagination(
				dataKelas,
				{ limit, page, total: count }
			)

			return OK(res, responseData);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function postKelas (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
		let where = {}
    try {
			let kirimdata;
			if(body.jenis == 'ADD'){
				where = { 
					[Op.or]: [
						{ kelas: body.kelas },
					]
				}
				const count = await models.Kelas.count({where});
				if(count) return NOT_FOUND(res, 'data sudah di gunakan !')
				kirimdata = {
					kelas: body.kelas,
					status: 1,
				}
				await models.Kelas.create(kirimdata)
			}else if(body.jenis == 'EDIT'){
				if(await models.Kelas.findOne({where: {kelas: body.kelas, [Op.not]: [{idKelas: body.id_kelas}]}})) return NOT_FOUND(res, 'Kelas sudah di gunakan !')
				kirimdata = {
					kelas: body.kelas,
					status: 1,
				}
				await models.Kelas.update(kirimdata, { where: { idKelas: body.id_kelas } })
			}else if(body.jenis == 'DELETE'){
				kirimdata = {
					status: 0
				}
				await models.Kelas.update(kirimdata, { where: { idKelas: body.id_kelas } })	
			}else if(body.jenis == 'STATUSRECORD'){
				kirimdata = { 
					status: body.status 
				}
				await models.Kelas.update(kirimdata, { where: { idKelas: body.id_kelas } })
			}else{
				return NOT_FOUND(res, 'terjadi kesalahan pada sistem !')
			}

			return OK(res);
    } catch (err) {
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
			});

			let result = await Promise.all(dataKelas.map(async val => {
				let jumlah = await models.User.count({
					where: { mutasiAkun: false },
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
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

module.exports = {
	getKelas, 
	postKelas, 
	getKelasSiswa, 
}