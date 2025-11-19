const {
	response,
	OK,
	NOT_FOUND,
	NO_CONTENT,
	UNPROCESSABLE
} = require('@triyogagp/backend-common/utils/response.utils');
const { 
	_buildResponseUser,
	_buildResponseAdmin,
	_buildResponseStruktural,
	_buildResponseSiswaSiswi
} = require('../utils/build-response');
const { encrypt, decrypt } = require('@triyogagp/backend-common/utils/helper.utils');
const { Op } = require('sequelize')
const sequelize = require('sequelize')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const _ = require('lodash');
const { logger } = require('../configs/db.winston')
const nodeGeocoder = require('node-geocoder');
const { sequelizeInstance } = require('../configs/db.config');
const dotenv = require('dotenv');
dotenv.config();
const BASE_URL = process.env.BASE_URL

function login (models) {
  return async (req, res, next) => {
		let { username, password } = req.body		
		let where = {}	
    try {
			if(!username){ return UNPROCESSABLE(res, 'Username atau Email tidak boleh kosong !') }
			if(!password){ return UNPROCESSABLE(res, 'Kata Sandi tidak boleh kosong !') }

			where = {
				[Op.and]: [
					{ statusAktif: true },
					{
						[Op.or]: [
							{ email: username },
							{ username: username }
						]
					}
				]
			}

      const data = await models.User.findOne({
				where,
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
				include: [
					{
						model: models.Role,
						attributes: ['namaRole']
					},
					{ 
						model: models.UserDetail,
					},
				],
				nest: true
			});
			
			if(!data){ return UNPROCESSABLE(res, 'data tidak di temukan !') }
			const { Role, UserDetail } = data
			const match = await bcrypt.compare(password, data.password);
			if(!match) return UNPROCESSABLE(res, 'Kata Sandi tidak sesuai !');
			const dataJWT = {
				userID: data.idUser,
				consumerType: data.consumerType,
				namaRole: Role.namaRole,
				username: data.username,
				nama: data.nama,
				email: data.email,
			}
			const accessToken = jwt.sign(dataJWT, process.env.ACCESS_TOKEN_SECRET, {
					expiresIn: '12h'
			});
			const refreshToken = jwt.sign(dataJWT, process.env.REFRESH_TOKEN_SECRET, {
					expiresIn: '1d'
			});
			
			if(data.consumerType == 3 && (UserDetail.mengajarBidang === null || UserDetail.mengajarKelas === null)){
				data.isActive = 0
			}else{
				data.isActive = 1
			}
			
			data.updateBy = dataJWT.userID
			data.save()
			
			let result = await _buildResponseUser(data, refreshToken, accessToken, models)

			return OK(res, result, `Selamat Datang ${result.nama} sebagai ${result.namaRole}`)
    } catch (err) {
			console.log(err);
			
			return NOT_FOUND(res, err.message)
    }
  }  
}

function forgotPass (models) {
  return async (req, res, next) => {
		let { email } = req.body
    try {
			const data = await models.User.findOne({
				where: {
					statusAktif: true,
					email: email
				},
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
			});

			if(!data){ return UNPROCESSABLE(res, 'data tidak di temukan !') }

			let transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: process.env.EMAIL,
					pass: process.env.SANDIAPPS
				}
			});

			let html = `<h1>Data Informasi Akun</h1>
			<ul>`;
			html += `<li>Nama Lengkap : ${data.nama}</li>
				<li>Alamat Email : ${data.email}</li>
				<li>Username : ${data.username}</li>
				<li>Kata Sandi : ${decrypt(data.kataSandi)}</li>
			</ul>
			Harap informasi ini jangan di hapus karena informasi ini penting adanya. Terimakasih. <br>Jika Anda memiliki pertanyaan, silakan balas email ini`;
			
			let mailOptions = {
				from: process.env.EMAIL,
				to: email,
				subject: 'Konfirmasi Lupa Kata Sandi',
				// text: `Silahkan masukan kode verifikasi akun tersebut`
				html: html,
			};

			transporter.sendMail(mailOptions, (err, info) => {
				if (err) return UNPROCESSABLE(res, 'Gagal mengirim data ke alamat email anda, cek lagi email yang di daftarkan!.')
			});

			return OK(res, data, 'Kata Sandi sudah di kirimkan ke email anda, silahkan periksa email anda ..')
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function ubahKataSandi (models) {
  return async (req, res, next) => {
		let body = req.body
    try {
			const { userID } = req.JWTDecoded
			let user = await models.User.findOne({where: {idUser: userID}})
			if(body.passwordLama != decrypt(user.kataSandi)) return UNPROCESSABLE(res, 'Kata Sandi Lama tidak cocok !')
			if(body.passwordBaru != body.passwordConfBaru) return UNPROCESSABLE(res, 'Kata Sandi Baru tidak cocok dengan Konfirmasi Kata Sandi Baru !')
			let salt = await bcrypt.genSalt();
			let hashPassword = await bcrypt.hash(body.passwordBaru, salt);
			let kirimdata = {
				password: hashPassword,
				kataSandi: encrypt(body.passwordBaru),
				updateBy: userID,
			}
			user.update(kirimdata)
			return OK(res, user);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function ubahProfile (models) {
  return async (req, res, next) => {
		let body = req.body
    try {
			const { userID, consumerType } = req.JWTDecoded
			let kirimdataUser, kirimdataUserDetail
			if(consumerType === 3){
				kirimdataUser = {
					nama: body.nama,
					email: body.email,
					username: body.username,
					updateBy: userID,
				}
				kirimdataUserDetail = {
					nomorInduk: body.nomorInduk,
					tempat: body.tempat,
					tanggalLahir: body.tanggalLahir,
					jenisKelamin: body.jenisKelamin,
					agama: body.agama,
					telp: body.telp,
					alamat: body.alamat,
					provinsi: body.provinsi,
					kabKota: body.kabKota,
					kecamatan: body.kecamatan,
					kelurahan: body.kelurahan,
					kodePos: body.kodePos,
					pendidikanGuru: body.pendidikanGuru,
				}
			}
			if(consumerType === '1' || consumerType === '2'){
				kirimdataUser = {
					nama: body.nama,
					email: body.email,
					username: body.username,
					updateBy: userID,
				}
				kirimdataUserDetail = {
					tempat: body.tempat,
					tanggalLahir: body.tanggalLahir,
					jenisKelamin: body.jenisKelamin,
					agama: body.agama,
					telp: body.telp,
					alamat: body.alamat,
					provinsi: body.provinsi,
					kabKota: body.kabKota,
					kecamatan: body.kecamatan,
					kelurahan: body.kelurahan,
					kodePos: body.kodePos,
				}
			}
			await sequelizeInstance.transaction(async trx => {
				await models.User.update(kirimdataUser, { where: { idUser: userID } }, { transaction: trx })
				await models.UserDetail.update(kirimdataUserDetail, { where: { idUser: userID } }, { transaction: trx })
			})
			return OK(res, body);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function profile (models) {
  return async (req, res, next) => {
    try {
			const { userID, consumerType } = req.JWTDecoded
			let dataProfile = await models.User.findOne({
				where: { idUser: userID },
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
			});

			if(consumerType === 1 || consumerType === 2){
				return OK(res, await _buildResponseAdmin(models, dataProfile));
			}else if(consumerType === 3){
				return OK(res, await _buildResponseStruktural(models, dataProfile));
			}else if(consumerType === 4){
				return OK(res, await _buildResponseSiswaSiswi(models, dataProfile));
			}
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function logout (models) {
  return async (req, res, next) => {
		try {
			const { userID } = req.JWTDecoded
			await models.User.update({ isActive: 0, updateBy: userID }, { where: { idUser: userID } })
			return OK(res)
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function authToken () {
  return async (req, res, next) => {
    try {
			return OK(res, req.JWTDecoded);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

module.exports = {
  login,
	forgotPass,
  ubahKataSandi,
  ubahProfile,
  profile,
  logout,
  authToken,
}