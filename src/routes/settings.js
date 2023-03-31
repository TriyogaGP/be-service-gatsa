const { Router } = require('express');
const {
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
} = require('../controllers/settings.controler')
const { uploadFile } = require('../middleware/uploadFile')
const { uploadBerkas } = require('../middleware/uploadBerkas')
const { verifyToken } = require('../middleware/VerifyToken');

module.exports = models => {
  const route = Router();
  route.route('/getUID').get(getUID())
  route.route('/encryptPass').get(verifyToken, getEncrypt())
  route.route('/decryptPass').get(verifyToken, getDecrypt())
  route.route('/optionsMenu').get(verifyToken, optionsMenu(models))
  route.route('/optionsAgama').get(optionsAgama(models))
  route.route('/optionsHobi').get(optionsHobi(models))
  route.route('/optionsCitaCita').get(optionsCitaCita(models))
  route.route('/optionsJenjangSekolah').get(optionsJenjangSekolah(models))
  route.route('/optionsPendidikan').get(optionsPendidikan(models))
  route.route('/optionsPekerjaan').get(optionsPekerjaan(models))
  route.route('/optionsPenghasilan').get(optionsPenghasilan(models))
  route.route('/optionsJabatan').get(optionsJabatan(models))
  route.route('/optionsMengajar').get(optionsMengajar(models))
  route.route('/optionsKelas').get(optionsKelas(models))
  route.route('/optionsStatusOrangtua').get(optionsStatusOrangtua(models))
  route.route('/optionsStatusTempatTinggal').get(optionsStatusTempatTinggal(models))
  route.route('/optionsJarakRumah').get(optionsJarakRumah(models))
  route.route('/optionsTransportasi').get(optionsTransportasi(models))
  route.route('/optionsWilayah').get(optionsWilayah(models))
  
  route.route('/updateFile').post(uploadFile, updateFile(models))

  route.route('/Menu')
    .get(verifyToken, getMenu(models))
    .post(crudMenu(models))
  route.route('/SequenceMenu')
    .get(verifyToken, getSequenceMenu(models))
    .post(crudSequenceMenu(models))
  route.route('/Role')
    .get(verifyToken, getRole(models))
    .post(crudRole(models))
  route.route('/RoleMenu')
    .get(verifyToken, getRoleMenu(models))
    .post(crudRoleMenu(models))
  route.route('/cmssetting')
    .get(getCMSSetting(models))
    .put(crudCMSSetting(models))
  
  return route;
}