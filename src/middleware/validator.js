const { sequelizeInstance, Sequelize } = require('../configs/db.config');
const { importModels } = require('@triyogagp/backend-common/models/gatsa')
const models = importModels(sequelizeInstance, Sequelize);
const { Op } = require('sequelize')
const { check, body, validationResult } = require('express-validator')

module.exports = {
  administratorValidation: [
    body('user.nama').notEmpty().withMessage('Nama Lengkap wajib diisi'),
    body('user.username').notEmpty().withMessage('Username tidak boleh kosong'),
    body('user.email').notEmpty().withMessage('Email tidak boleh kosong'),
    body('user.password').notEmpty().withMessage('Kata Sandi tidak boleh kosong'),
    body('userdetail.tempat').notEmpty().withMessage('Tempat Lahir tidak boleh kosong'),
    body('userdetail.tanggalLahir').notEmpty().withMessage('Tanggal Lahir tidak boleh kosong'),
    body('userdetail.jenisKelamin').notEmpty().withMessage('Jenis Kelamin tidak boleh kosong'),
    body('userdetail.agama').notEmpty().withMessage('Agama tidak boleh kosong'),
    body('userdetail.telp').notEmpty().withMessage('No. Telp tidak boleh kosong'),
    body('userdetail.alamat').notEmpty().withMessage('Alamat tidak boleh kosong'),
    body('userdetail.provinsi').notEmpty().withMessage('Provinsi tidak boleh kosong'),
    body('userdetail.kabKota').notEmpty().withMessage('Kabupaten / Kota tidak boleh kosong'),
    body('userdetail.kecamatan').notEmpty().withMessage('Kecamatan tidak boleh kosong'),
    body('userdetail.kelurahan').notEmpty().withMessage('Kelurahan tidak boleh kosong'),
    body().custom(async (value) => {
      const { user } = value
      if(user.jenis == 'ADD'){
        let where = { 
          statusAktif: true,
          [Op.or]: [
            { email: user.email },
            { username: user.username }
          ] 
        }
        if(await models.User.count({where})) throw new Error('data sudah di gunakan !<br>Harap periksa username atau email yang anda input.');
      }else if(user.jenis == 'EDIT'){
        if(await models.User.count({where: {email: user.email, [Op.not]: [{idUser: user.idUser}]}})) throw new Error('Email sudah terdaftar');
        if(await models.User.count({where: {username: user.username, [Op.not]: [{idUser: user.idUser}]}})) throw new Error('Username sudah terdaftar');
      }
      return true;
    })
  ],
  strukturalValidation: [
    body('user.nama').notEmpty().withMessage('Nama Lengkap wajib diisi'),
    body('user.username').notEmpty().withMessage('Username tidak boleh kosong'),
    body('user.email').notEmpty().withMessage('Email tidak boleh kosong'),
    body('user.password').notEmpty().withMessage('Kata Sandi tidak boleh kosong'),
    body('userdetail.tempat').notEmpty().withMessage('Tempat Lahir tidak boleh kosong'),
    body('userdetail.tanggalLahir').notEmpty().withMessage('Tanggal Lahir tidak boleh kosong'),
    body('userdetail.jenisKelamin').notEmpty().withMessage('Jenis Kelamin tidak boleh kosong'),
    body('userdetail.agama').notEmpty().withMessage('Agama tidak boleh kosong'),
    body('userdetail.telp').notEmpty().withMessage('No. Telp tidak boleh kosong'),
    body('userdetail.alamat').notEmpty().withMessage('Alamat tidak boleh kosong'),
    body('userdetail.provinsi').notEmpty().withMessage('Provinsi tidak boleh kosong'),
    body('userdetail.kabKota').notEmpty().withMessage('Kabupaten / Kota tidak boleh kosong'),
    body('userdetail.kecamatan').notEmpty().withMessage('Kecamatan tidak boleh kosong'),
    body('userdetail.kelurahan').notEmpty().withMessage('Kelurahan tidak boleh kosong'),
    body('userdetail.nomorInduk').notEmpty().withMessage('Nomor Induk tidak boleh kosong'),
    body('userdetail.pendidikanGuru').notEmpty().withMessage('Pendidikan Guru tidak boleh kosong'),
    body().custom(async (value) => {
      const { user, userdetail } = value
      if(user.jenis == 'ADD'){
        let where = { 
          statusAktif: true,
					[Op.or]: [
						{ email: user.email },
						{ username: user.username },
						{ '$UserDetail.nomor_induk$': userdetail.nomorInduk },
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
        if(count) throw new Error('data sudah di gunakan !<br>Harap periksa username, email atau nomor induk yang anda input.');
      }else if(user.jenis == 'EDIT'){
        if(await models.User.count({where: {email: user.email, [Op.not]: [{idUser: user.idUser}]}})) throw new Error('Email sudah terdaftar');
        if(await models.User.count({where: {username: user.username, [Op.not]: [{idUser: user.idUser}]}})) throw new Error('Username sudah terdaftar');
        if(await models.UserDetail.count({where: {nomorInduk: userdetail.nomorInduk, [Op.not]: [{idUser: user.idUser}]}})) throw new Error('Nomor Induk sudah terdaftar');
      }
      return true;
    })
  ],
  siswasiswiValidation: [
    body('user.nama').notEmpty().withMessage('Nama Lengkap wajib diisi'),
    body('user.username').notEmpty().withMessage('Username tidak boleh kosong'),
    body('user.email').notEmpty().withMessage('Email tidak boleh kosong'),
    body('user.password').notEmpty().withMessage('Kata Sandi tidak boleh kosong'),
    body('userdetail.nikSiswa').notEmpty().withMessage('NIK Siswa tidak boleh kosong'),
    body('userdetail.nomorInduk').notEmpty().withMessage('Nomor Induk tidak boleh kosong'),
    body('userdetail.tempat').notEmpty().withMessage('Tempat Lahir tidak boleh kosong'),
    body('userdetail.tanggalLahir').notEmpty().withMessage('Tanggal Lahir tidak boleh kosong'),
    body('userdetail.jenisKelamin').notEmpty().withMessage('Jenis Kelamin tidak boleh kosong'),
    body('userdetail.agama').notEmpty().withMessage('Agama tidak boleh kosong'),
    body('userdetail.kelas').notEmpty().withMessage('Kelas tidak boleh kosong'),
    body('userdetail.dataSekolahSebelumnya.jenjang').notEmpty().withMessage('Jenjang Sekolah tidak boleh kosong'),
    body('userdetail.dataSekolahSebelumnya.statusSekolah').notEmpty().withMessage('Status Sekolah tidak boleh kosong'),
    body('userdetail.dataSekolahSebelumnya.namaSekolah').notEmpty().withMessage('Nama Sekolah tidak boleh kosong'),
    body('userdetail.dataSekolahSebelumnya.alamatSekolah').notEmpty().withMessage('Alamat Sekolah tidak boleh kosong'),
    body('userdetail.dataSekolahSebelumnya.kabkotSekolah').notEmpty().withMessage('Kabupaten / Kota Sekolah tidak boleh kosong'),
    body('userdetail.noKK').notEmpty().withMessage('No Kartu Keluarga tidak boleh kosong'),
    body('userdetail.namaKK').notEmpty().withMessage('Nama Kepala Keluarga tidak boleh kosong'),
    body('userdetail.dataAlamatOrangtua.telp').notEmpty().withMessage('No. Telp tidak boleh kosong'),
    body('userdetail.dataAlamatOrangtua.alamat').notEmpty().withMessage('Alamat tidak boleh kosong'),
    body('userdetail.dataAlamatOrangtua.provinsi').notEmpty().withMessage('Provinsi tidak boleh kosong'),
    body('userdetail.dataAlamatOrangtua.kabKota').notEmpty().withMessage('Kabupaten / Kota tidak boleh kosong'),
    body('userdetail.dataAlamatOrangtua.kecamatan').notEmpty().withMessage('Kecamatan tidak boleh kosong'),
    body('userdetail.dataAlamatOrangtua.kelurahan').notEmpty().withMessage('Kelurahan tidak boleh kosong'),
    body('userdetail.penghasilan').notEmpty().withMessage('Penghasilan tidak boleh kosong'),
    body('userdetail.dataOrangtua.dataAyah.nikAyah').notEmpty().withMessage('NIK Ayah tidak boleh kosong'),
    body('userdetail.dataOrangtua.dataAyah.namaAyah').notEmpty().withMessage('Nama Ayah tidak boleh kosong'),
    body('userdetail.dataOrangtua.dataAyah.statusAyah').notEmpty().withMessage('Status Ayah tidak boleh kosong'),
    body('userdetail.dataOrangtua.dataAyah.pendidikanAyah').notEmpty().withMessage('Pendidikan Ayah tidak boleh kosong'),
    body('userdetail.dataOrangtua.dataAyah.pekerjaanAyah').notEmpty().withMessage('Pekerjaan Ayah tidak boleh kosong'),
    body('userdetail.dataOrangtua.dataIbu.nikIbu').notEmpty().withMessage('NIK Ibu tidak boleh kosong'),
    body('userdetail.dataOrangtua.dataIbu.namaIbu').notEmpty().withMessage('Nama Ibu tidak boleh kosong'),
    body('userdetail.dataOrangtua.dataIbu.statusIbu').notEmpty().withMessage('Status Ibu tidak boleh kosong'),
    body('userdetail.dataOrangtua.dataIbu.pendidikanIbu').notEmpty().withMessage('Pendidikan Ibu tidak boleh kosong'),
    body('userdetail.dataOrangtua.dataIbu.pekerjaanIbu').notEmpty().withMessage('Pekerjaan Ibu tidak boleh kosong'),
    body().custom(async (value) => {
      const { user, userdetail } = value
      if(user.jenis == 'ADD'){
        let where = { 
          statusAktif: true,
					[Op.or]: [
						{ email: user.email },
						{ username: user.username },
						{ '$UserDetail.nomor_induk$': userdetail.nomorInduk },
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
        if(count) throw new Error('data sudah di gunakan !<br>Harap periksa username, email atau nomor induk yang anda input.');
      }else if(user.jenis == 'EDIT'){
        if(await models.User.count({where: {email: user.email, [Op.not]: [{idUser: user.idUser}]}})) throw new Error('Email sudah terdaftar');
        if(await models.User.count({where: {username: user.username, [Op.not]: [{idUser: user.idUser}]}})) throw new Error('Username sudah terdaftar');
        if(await models.UserDetail.count({where: {nomorInduk: userdetail.nomorInduk, [Op.not]: [{idUser: user.idUser}]}})) throw new Error('Nomor Induk sudah terdaftar');
      }
      return true;
    })
  ],

  validateRequestBodyPayload: req => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const [error] = errors.array({ onlyFirstError: false });
      return `${error.msg}`;
    }
    return null;
  },
}