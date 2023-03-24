const { response, OK, NOT_FOUND, NO_CONTENT } = require('../utils/response.utils');
const { 
	_buildResponseUser,
	_buildResponseAdmin,
	_buildResponseStruktural,
	_buildResponseSiswaSiswi
} = require('../utils/build-response');
const { encrypt, decrypt } = require('../utils/helper.utils');
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

function login (models) {
  return async (req, res, next) => {
		let { username, password } = req.body		
		let where = {}	
    try {
			if(!username){ return NOT_FOUND(res, 'Username atau Email tidak boleh kosong !') }
			if(!password){ return NOT_FOUND(res, 'Kata Sandi tidak boleh kosong !') }

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
				]
			});

			if(!data){ return NOT_FOUND(res, 'data tidak di temukan !') }

			const match = await bcrypt.compare(password, data.password);
			if(!match) return NOT_FOUND(res, 'Kata Sandi tidak sesuai !');
			const userID = data.idUser;
			const nama = data.nama;
			const email = data.email;
			const accessToken = jwt.sign({userID, nama, email}, process.env.ACCESS_TOKEN_SECRET, {
					expiresIn: '12h'
			});
			const refreshToken = jwt.sign({userID, nama, email}, process.env.REFRESH_TOKEN_SECRET, {
					expiresIn: '1d'
			});

			let result = await _buildResponseUser(data, refreshToken, accessToken)

			return OK(res, result, `Selamat Datang ${result.nama} sebagai ${result.namaRole}`)
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function forgotPass (models) {
  return async (req, res, next) => {
		let { email } = req.body
    try {
			const data = await models.Admin.findOne({
				where: {
					statusAktif: true,
					email: email
				},
				attributes: { exclude: ['createBy', 'updateBy', 'deleteBy', 'createdAt', 'updatedAt', 'deletedAt'] },
			});

			if(!data){ return NOT_FOUND(res, 'data tidak di temukan !') }

			let transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'triyoga.ginanjar.p@gmail.com',
					pass: 'edyqlenfqxgtmeat' //26122020CBN
				}
			});

			let html = `<h1>Data Informasi Akun</h1>
			<ul>`;
			html += `<li>Nama Lengkap : ${data.nama}</li>
				<li>Alamat Email : ${data.email}</li>
				<li>Username : ${content == 'Admin' ? data.username : 'tidak ada username'}</li>
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
				if (err) return NOT_FOUND(res, 'Gagal mengirim data ke alamat email anda, cek lagi email yang di daftarkan!.')
			});

			return OK(res, data, 'Kata Sandi sudah di kirimkan ke email anda, silahkan periksa email anda ..')
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function ubahKataSandi (models) {
  return async (req, res, next) => {
		let body = { ...req.body }
    try {
			let user = await models.User.findOne({where: {idUser: body.idUser}})
			if(body.passwordLama != decrypt(user.kataSandi)) return NOT_FOUND(res, 'Kata Sandi Lama tidak cocok !')
			if(body.passwordBaru != body.passwordConfBaru) return NOT_FOUND(res, 'Kata Sandi Baru tidak cocok dengan Konfirmasi Kata Sandi Baru !')
			let salt = await bcrypt.genSalt();
			let hashPassword = await bcrypt.hash(body.passwordBaru, salt);
			let kirimdata = {
				password: hashPassword,
				kataSandi: encrypt(body.passwordBaru),
				updateBy: body.idUser,
			}
			await models.User.update(kirimdata, { where: { idUser: body.idUser } })
			return OK(res, user);
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

function profile (models) {
  return async (req, res, next) => {
		let { idUser } = req.params
    try {
			let dataProfile = await models.User.findOne({
				where: { idUser },
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

			if(dataProfile.consumerType === 1 || dataProfile.consumerType === 2){
				return OK(res, await _buildResponseAdmin(models, dataProfile));
			}else if(dataProfile.consumerType === 3){
				return OK(res, await _buildResponseStruktural(models, dataProfile));
			}else if(dataProfile.consumerType === 4){
				return OK(res, await _buildResponseSiswaSiswi(models, dataProfile));
			}
    } catch (err) {
			return NOT_FOUND(res, err.message)
    }
  }  
}

module.exports = {
  login,
	forgotPass,
  ubahKataSandi,
  profile,
}