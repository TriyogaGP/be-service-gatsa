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
  getModulPelajaran,
  postJadwalMengajar,
  getKelasSiswa,
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
const { 
  administratorValidation,
  strukturalValidation,
  siswasiswiValidation
 } = require('../middleware/validator');


module.exports = models => {
  const route = Router();

  route.route('/dashboard')
    .get(verifyToken, getDashboard(models))
  route.route('/admin')
    .get(verifyToken, getAdmin(models))
    .post(verifyToken, administratorValidation, postAdmin(models))
  route.route('/admin/:uid')
    .get(verifyToken, getAdminbyUid(models))
  route.route('/struktural')
    .get(verifyToken, getStruktural(models))
    .post(verifyToken, strukturalValidation, postStruktural(models))
  route.route('/struktural/:uid')
    .get(verifyToken, getStrukturalbyUid(models))
  route.route('/siswa-siswi')
    .get(verifyToken, getSiswaSiswi(models))
    .post(verifyToken, siswasiswiValidation, postSiswaSiswi(models))
  route.route('/siswa-siswi/:uid')
    .get(verifyToken, getSiswaSiswibyUid(models))
  route.route('/wali-kelas')
    .get(verifyToken, getWaliKelas(models))
  route.route('/update-peringkat')
    .get(verifyToken, updatePeringkat(models))
  route.route('/jadwal-pelajaran')
    .get(verifyToken, getJadwalPelajaran(models))
  route.route('/modul')
    .get(verifyToken, getModulPelajaran(models))
  route.route('/jadwal')
    .get(verifyToken, getJadwalMengajar(models))
    .post(verifyToken, postJadwalMengajar(models))
  route.route('/kelas-siswa')
    .get(getKelasSiswa(models))
  route.route('/question-exam')
    .get(verifyToken, getQuestionExam(models))
    .post(verifyToken, postQuestionExam(models))
  route.route('/jadwal-exam')
    .get(getJadwalExam(models))  
    .post(verifyToken, postJadwalExam(models))
  route.route('/kode-soal-random')
    .post(verifyToken, getRandomQuestion(models))
  route.route('/list-pick')
    .get(verifyToken, getListPickExam(models))
    .post(verifyToken, postListPickExam(models))
  route.route('/nilai')
    .get(verifyToken, getPenilaian(models))
    .post(verifyToken, postPenilaian(models))
  route.route('/koreksi-exam')
    .post(verifyToken, postKoreksiExam(models))
  route.route('/simpan-jawaban-exam')
    .post(verifyToken, postJawabanExam(models))
  route.route('/jadwal-exam-id/:idJadwalExam')
    .get(verifyToken, getJadwalExamID(models))
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

  route.route('/ulinkfile')
    .post(unlinkFile(models))
  
  route.route('/testing')
    .get(testing(models))
  
  return route;
}