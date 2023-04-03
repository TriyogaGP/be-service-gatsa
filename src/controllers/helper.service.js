const {
	response,
	OK,
	NOT_FOUND,
	NO_CONTENT
} = require('../utils/response.utils');
const {
	encrypt,
	decrypt,
	createKSUID,
	buildMysqlResponseWithPagination
} = require('../utils/helper.utils');
const { Op } = require('sequelize')
const sequelize = require('sequelize')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { logger } = require('../configs/db.winston')
const nodeGeocoder = require('node-geocoder');
const { sequelizeInstance } = require('../configs/db.config');
const dotenv = require('dotenv');
dotenv.config();
const BASE_URL = process.env.BASE_URL

async function _allOption(params) {
	const { table } = params
	const data = await table.findAll()
	return data
}

async function _agamaOption(params) {
	const { models, kode } = params
	const agama = await models.Agama.findOne({ where: { kode } })
	return agama
}

async function _citacitaOption(params) {
	const { models, kode } = params
	const citacita = await models.CitaCita.findOne({ where: { kode } })
	return citacita
}

async function _hobiOption(params) {
	const { models, kode } = params
	const hobi = await models.Hobi.findOne({ where: { kode } })
	return hobi
}

async function _jenjangsekolahOption(params) {
	const { models, kode } = params
	const jenjangsekolah = await models.JenjangSekolah.findOne({ where: { kode } })
	return jenjangsekolah
}

async function _statussekolahOption(params) {
	const { models, kode } = params
	const statussekolah = await models.StatusSekolah.findOne({ where: { kode } })
	return statussekolah
}

async function _statusortuOption(params) {
	const { models, kode } = params
	const statusortu = await models.StatusOrangtua.findOne({ where: { kode } })
	return statusortu
}

async function _pendidikanOption(params) {
	const { models, kode } = params
	const pendidikan = await models.Pendidikan.findOne({ where: { kode } })
	return pendidikan
}

async function _pekerjaanOption(params) {
	const { models, kode } = params
	const pekerjaan = await models.Pekerjaan.findOne({ where: { kode } })
	return pekerjaan
}

async function _jabatanOption(params) {
	const { models, kode } = params
	const jabatan = await models.Jabatan.findAll({ where: { kode: kode.split(',') }, order: [['kode','ASC']] })
	return jabatan
}

async function _mengajarOption(params) {
	const { models, kode } = params
	const mengajar = await models.Mengajar.findAll({ where: { kode: kode.split(',') }, order: [['kode','ASC']] })
	return mengajar
}

async function _penghasilanOption(params) {
	const { models, kode } = params
	const penghasilan = await models.Penghasilan.findOne({ where: { kode } })
	return penghasilan
}

async function _statustempattinggalOption(params) {
	const { models, kode } = params
	const statustempattinggal = await models.StatusTempatTinggal.findOne({ where: { kode } })
	return statustempattinggal
}

async function _jarakrumahOption(params) {
	const { models, kode } = params
	const jarakrumah = await models.JarakRumah.findOne({ where: { kode } })
	return jarakrumah
}

async function _transportasiOption(params) {
	const { models, kode } = params
	const transportasi = await models.Transportasi.findOne({ where: { kode } })
	return transportasi
}

async function _wilayahOption(params) {
	const { models, kode } = params
	const wilayah = await models.Wilayah.findOne({ where: { kode }, attributes: ['kode', 'nama', 'kodePos'] })
	return wilayah
}

// async function _provinsiOption(params) {
// 	const { models, provID } = params
// 	const provinsi = await models.Provinsi.findOne({ where: { provID } })
// 	return provinsi
// }

// async function _kabkotaOption(params) {
// 	const { models, cityID } = params
// 	const kabkota = await models.KabKota.findOne({ where: { cityID } })
// 	return kabkota
// }

// async function _kecamatanOption(params) {
// 	const { models, disID } = params
// 	const kecamatan = await models.Kecamatan.findOne({ where: { disID } })
// 	return kecamatan
// }

// async function _kelurahanOption(params) {
// 	const { models, subdisID } = params
// 	const kelurahan = await models.Kelurahan.findOne({ where: { subdisID } })
// 	return kelurahan
// }

// async function _kelasOption(params) {
// 	const { models, kelas } = params
// 	const kelasOpt = await models.Kelas.findAll({ where: { kelas: kelas.split(', '), status: true }, order: [['idKelas','ASC']] })
// 	return kelasOpt
// }

module.exports = {
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
}