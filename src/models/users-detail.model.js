'use strict';

const UserDetailScheme = Sequelize => {
  const { DataTypes } = Sequelize;

  return {
    idUserDetail: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_users_detail'
    },
    idUser: {
			type: DataTypes.STRING(32),
			allowNull: false,
			field: 'id_user'
    },
    nikSiswa: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'nik_siswa',
    },
    nomorInduk: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'nomor_induk',
    },
    tanggalLahir: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'tgl_lahir',
    },
    tempat: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'tempat',
    },
		jenisKelamin: {
			type: DataTypes.STRING(15),
			allowNull: true,
			field: 'jeniskelamin',
		},
		agama: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: 'agama',
		},
		anakKe: {
			type: DataTypes.STRING(5),
			allowNull: true,
			field: 'anakke',
		},
		jumlahSaudara: {
			type: DataTypes.STRING(5),
			allowNull: true,
			field: 'jumlah_saudara',
		},
    hobi: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: 'hobi'
    },
    citaCita: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: 'cita_cita'
    },
    jenjang: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: 'jenjang'
    },
    statusSekolah: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: 'status_sekolah'
    },
    namaSekolah: {
			type: DataTypes.STRING(100),
			allowNull: true,
			field: 'nama_sekolah'
    },
    npsn: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'npsn'
    },
    alamatSekolah: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'alamat_sekolah'
    },
    kabkotSekolah: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'kabkot_sekolah'
    },
    kabkotSekolah: {
			type: DataTypes.STRING(100),
			allowNull: true,
			field: 'kabkot_sekolah'
    },
    noPesertaUN: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'no_peserta_un'
    },
    noSKHUN: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: 'no_skhun'
    },
    noIjazah: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: 'no_ijazah'
    },
    nilaiUN: {
			type: DataTypes.STRING(5),
			allowNull: true,
			field: 'nilai_un'
    },
    noKK: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: 'no_kk'
    },
    namaKK: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: 'nama_kk'
    },
    namaAyah: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: 'nama_ayah'
    },
    tahunAyah: {
			type: DataTypes.STRING(4),
			allowNull: true,
			field: 'tahun_ayah'
    },
    statusAyah: {
      type: DataTypes.INTEGER,
			allowNull: true,
			field: 'status_ayah'
    },
    nikAyah: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'nik_ayah'
    },
    pendidikanAyah: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pendidikan_ayah'
    },
    pekerjaanAyah: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pekerjaan_ayah'
    },
    telpAyah: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'telp_ayah'
    },
    namaIbu: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: 'nama_ibu'
    },
    tahunIbu: {
			type: DataTypes.STRING(4),
			allowNull: true,
			field: 'tahun_ibu'
    },
    statusIbu: {
      type: DataTypes.INTEGER,
			allowNull: true,
			field: 'status_ibu'
    },
    nikIbu: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'nik_ibu'
    },
    pendidikanIbu: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pendidikan_ibu'
    },
    pekerjaanIbu: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pekerjaan_ibu'
    },
    telpIbu: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'telp_ibu'
    },
    namaWali: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: 'nama_wali'
    },
    tahunWali: {
			type: DataTypes.STRING(4),
			allowNull: true,
			field: 'tahun_wali'
    },
    nikWali: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'nik_wali'
    },
    pendidikanWali: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pendidikan_wali'
    },
    pekerjaanWali: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pekerjaan_wali'
    },
    telpWali: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'telp_wali'
    },
    penghasilan: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'penghasilan'
    },
    telp: {
      type: DataTypes.STRING(15),
      allowNull: true,
      field: 'telp'
    },
    alamat: {
      type: DataTypes.TEXT,
			allowNull: true,
			field: 'alamat'
    },
    provinsi: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'provinsi'
    },
    kabKota: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'kabkota'
    },
    kecamatan: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'kecamatan'
    },
    kelurahan: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'kelurahan'
    },
    kodePos: {
      type: DataTypes.STRING(6),
      allowNull: true,
      field: 'kode_pos'
    },
    pendidikanGuru: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pendidikan_guru'
    },
    pendidikanGuru: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pendidikan_guru'
    },
    jabatanGuru: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'jabatan_guru'
    },
    mengajarBidang: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'mengajar_bidang'
    },
    mengajarKelas: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'mengajar_kelas'
    },
    waliKelas: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'walikelas'
    },
    kelas: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'kelas'
    },
    peringkat: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'peringkat'
    },
    statusTempatTinggal: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'status_tempat_tinggal'
    },
    jarakRumah: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'jarak_rumah'
    },
    transportasi: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'transportasi'
    },
    fotoProfil: {
			type: DataTypes.STRING(256),
      allowNull: true,
      field: 'foto_profil',
    },
    fcIjazah: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'fc_ijazah'
    },
    fcSKHUN: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'fc_skhun'
    },
    fcKK: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'fc_kk'
    },
    fcKTPOrtu: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'fc_ktp_ortu'
    },
    fcAktaLahir: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'fc_akta_lahir'
    },
    fcSKL: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'fc_skl'
    },
  };
};

module.exports = {
  UserDetailScheme,
  ModelFn: (sequelizeInstance, Sequelize) => {
    const UserDetail = sequelizeInstance
      .define(
        'UserDetail',
        UserDetailScheme(Sequelize),
        {
          sequelizeInstance,
          tableName: 'm_users_detail',
          modelName: 'UserDetail',
          underscored: true,
          timestamps: false,
          paranoid: true,
        },
      );
      
    return UserDetail;
  },
};
