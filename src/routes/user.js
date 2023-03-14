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
  downloadTemplate,
  importExcel,
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
  route.route('/template/:roleID')
    .get(downloadTemplate(models))
  route.route('/importexcel')
    .post(uploadFile, importExcel(models))
  route.route('/pdfcreate/:uid')
    .get(pdfCreate(models))

  route.route('/testing/:uid')
    .get(testing(models))
  
  return route;
}