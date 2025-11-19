const { Router } = require('express');
const {
  updateFile,
  updateBerkas,
  getUID,
  getEncrypt,
  getDecrypt,
  optionsMenu,
  optionsDataMaster,
  optionsWilayah,
  optionsWilayah2023,
  optionsBerkas,
  optionsUserBroadcast,
  optionsKelas,
  getCMSSetting,
  crudCMSSetting,
  getBerkas,
  crudBerkas,
  getRole,
  crudRole,
  getMenu,
  crudMenu,
  getSequenceMenu,
  crudSequenceMenu,
  getRoleMenu,
  crudRoleMenu,
  getCardRFID,
  crudCardRFID,
  getListExam,
  getNotifikasi,
  crudNotifikasi,
  getKategoriNotifikasi,
  getCountNotifikasi,
  getRFID,
  getWilayah,
  crudWilayah,
  getWilayah2023,
  crudWilayah2023,
  testing,
} = require('../controllers/settings.controler')
const { uploadFile } = require('../middleware/uploadFile')
const { uploadBerkas } = require('../middleware/uploadBerkas')
const { verifyToken } = require('../middleware/VerifyToken');

module.exports = models => {
  const route = Router();
  route.route('/update-file').post(uploadFile, updateFile(models))
  route.route('/update-berkas').post(uploadBerkas, updateBerkas(models))
  route.route('/get-uid').get(getUID())
  route.route('/encrypt-pass').get(verifyToken, getEncrypt())
  route.route('/decrypt-pass').get(verifyToken, getDecrypt())
  route.route('/options-menu').get(verifyToken, optionsMenu(models))
  route.route('/options-data-master').get(verifyToken, optionsDataMaster(models))
  route.route('/options-wilayah').get(optionsWilayah(models))
  route.route('/options-wilayah2023').get(optionsWilayah2023(models))
  route.route('/options-berkas').get(optionsBerkas(models))
  route.route('/options-user-broadcast').get(verifyToken, optionsUserBroadcast(models))
  route.route('/options-kelas').get(optionsKelas(models))
  route.route('/cmssetting')
    .get(getCMSSetting(models))
    .put(crudCMSSetting(models))
  route.route('/berkas')
    .get(verifyToken, getBerkas(models))
    .post(crudBerkas(models))
  route.route('/role')
    .get(verifyToken, getRole(models))
    .post(crudRole(models))
  route.route('/menu')
    .get(verifyToken, getMenu(models))
    .post(crudMenu(models))
  route.route('/sequence-menu')
    .get(verifyToken, getSequenceMenu(models))
    .post(crudSequenceMenu(models))
  route.route('/role-menu')
    .get(verifyToken, getRoleMenu(models))
    .post(crudRoleMenu(models))
  route.route('/data-rfid')
    .get(verifyToken, getCardRFID(models))
    .post(crudCardRFID(models))
  route.route('/list-exam')
    .get(verifyToken, getListExam(models))
  route.route('/notifikasi')
    .get(verifyToken, getNotifikasi(models))
    .post(verifyToken, crudNotifikasi(models))
  route.route('/kategoriNotifikasi')
    .get(verifyToken, getKategoriNotifikasi(models))
  route.route('/countNotifikasi')
    .get(verifyToken, getCountNotifikasi(models))
  
  route.route('/rfid').get(getRFID(models))
  route.route('/wilayah')
    .get(getWilayah(models))
    .post(crudWilayah(models))
  route.route('/wilayah2023')
    .get(getWilayah2023(models))
    .post(crudWilayah2023(models))

  route.route('/testing').get(testing(models))
  
  return route;
}