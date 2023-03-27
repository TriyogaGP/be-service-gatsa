const { Router } = require('express');
const {body, checkSchema, validationResult} = require('express-validator');
const {
  getAdmin,
  getAdminbyUid,
  postAdmin,
  getStruktural,
  getStrukturalbyUid,
  postStruktural,
  getSiswaSiswi,
  getSiswaSiswibyUid,
  postSiswaSiswi,
  getWaliKelas,
  getJadwalMengajar,
  postJadwalMengajar,
  getPenilaian,
  postPenilaian,
  downloadTemplate,
  importExcel,
  exportExcel,
  pdfCreate,
  testing,
} = require('../controllers/user.controller')
const { uploadFile } = require('../middleware/uploadFile')

module.exports = models => {
  const route = Router();

  route.route('/admin')
    .get(getAdmin(models))
    .post(postAdmin(models))
  route.route('/admin/:uid')
    .get(getAdminbyUid(models))
  
  route.route('/struktural')
    .get(getStruktural(models))
    .post(postStruktural(models))
  route.route('/struktural/:uid')
    .get(getStrukturalbyUid(models))
  
  route.route('/siswasiswi')
    .get(getSiswaSiswi(models))
    .post(postSiswaSiswi(models))
  route.route('/siswasiswi/:uid')
    .get(getSiswaSiswibyUid(models))
  route.route('/walikelas')
    .get(getWaliKelas(models))
  route.route('/jadwal')
    .get(getJadwalMengajar(models))
    .post(postJadwalMengajar(models))
  route.route('/nilai')
    .get(getPenilaian(models))
    .post(postPenilaian(models))
  route.route('/template/:roleID')
    .get(downloadTemplate(models))
  route.route('/importexcel')
    .post(uploadFile, importExcel(models))
  route.route('/exportexcel')
    .get(exportExcel(models))
  route.route('/pdfcreate/:uid')
    .get(pdfCreate(models))

  route.route('/testing')
    .post(testing(models))
  
  return route;
}