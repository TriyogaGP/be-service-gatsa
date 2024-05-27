const { Router } = require('express');
const {
  getDashboard,
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
  updatePeringkat,
  getJadwalMengajar,
  getJadwalPelajaran,
  postJadwalMengajar,
  getPenilaian,
  postPenilaian,
  downloadTemplate,
  downloadTemplateNilai,
  downloadTemplateJadwalExam,
  importExcel,
  exportExcel,
  pdfCreate,
  pdfCreateRaport,
  listSiswaSiswi,
  getQuestionExam,
  postQuestionExam,
  getListPickExam,
  postListPickExam,
  getJadwalExam,
  getJadwalExamID,
  getRandomQuestion,
  postJadwalExam,
  postJawabanExam,
  postKoreksiExam,
  unlinkFile,
  testing,
} = require('../controllers/user.controller')
const { uploadFile } = require('../middleware/uploadFile')
const { verifyToken } = require('../middleware/VerifyToken');


module.exports = models => {
  const route = Router();

  route.route('/admin')
    .get(verifyToken, getAdmin(models))
    .post(verifyToken, postAdmin(models))
  route.route('/admin/:uid')
    .get(verifyToken, getAdminbyUid(models))
  
  route.route('/struktural')
    .get(verifyToken, getStruktural(models))
    .post(verifyToken, postStruktural(models))
  route.route('/struktural/:uid')
    .get(verifyToken, getStrukturalbyUid(models))
  
  route.route('/siswasiswi')
    .get(verifyToken, getSiswaSiswi(models))
    .post(verifyToken, postSiswaSiswi(models))
  route.route('/siswasiswi/:uid')
    .get(verifyToken, getSiswaSiswibyUid(models))
  
  route.route('/question-exam')
    .get(verifyToken, getQuestionExam(models))
    .post(verifyToken, postQuestionExam(models))
    
  route.route('/jadwal-exam')
    .get(getJadwalExam(models))  
    .post(verifyToken, postJadwalExam(models))
    
  route.route('/list-pick')
    .get(verifyToken, getListPickExam(models))
    .post(verifyToken, postListPickExam(models))

  route.route('/koreksi-exam')
    .post(verifyToken, postKoreksiExam(models))
  route.route('/simpan-jwaban-exam')
    .post(verifyToken, postJawabanExam(models))
  route.route('/jadwal-exam-id/:idJadwalExam')
    .get(verifyToken, getJadwalExamID(models))
  route.route('/kode-soal-random')
    .get(verifyToken, getRandomQuestion(models))
  route.route('/walikelas')
    .get(verifyToken, getWaliKelas(models))
  route.route('/update-peringkat')
    .get(verifyToken, updatePeringkat(models))
  route.route('/jadwalpelajaran')
    .get(verifyToken, getJadwalPelajaran(models))
  route.route('/jadwal')
    .get(verifyToken, getJadwalMengajar(models))
    .post(verifyToken, postJadwalMengajar(models))
  route.route('/nilai')
    .get(verifyToken, getPenilaian(models))
    .post(verifyToken, postPenilaian(models))
  route.route('/template/:roleID')
    .get(downloadTemplate(models))
  route.route('/templateNilai/:kelas/:mapel')
    .get(downloadTemplateNilai(models))
  route.route('/templateJadwalExam')
    .get(downloadTemplateJadwalExam(models))
  route.route('/importexcel')
    .post(uploadFile, importExcel(models))
  route.route('/exportexcel')
    .get(verifyToken, exportExcel(models))
  route.route('/pdfcreate/:uid')
    .get(verifyToken, pdfCreate(models))
  route.route('/pdfcreate-raport/:uid')
    .get(verifyToken, pdfCreateRaport(models))
  route.route('/list-siswasiswi')
    .get(listSiswaSiswi(models))
  route.route('/dashboard')
    .get(verifyToken, getDashboard(models))

  route.route('/ulinkfile')
    .post(unlinkFile(models))
  
  route.route('/testing')
    .get(testing(models))
  
  return route;
}