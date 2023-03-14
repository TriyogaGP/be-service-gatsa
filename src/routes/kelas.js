const { Router } = require('express');
const { verifyToken } = require('../middleware/VerifyToken');
const {
  getKelas,
  postKelas,
  getKelasSiswa,
} = require('../controllers/kelas.controller')

module.exports = models => {
  const route = Router();

  route.route('/kelas')
    .get(getKelas(models))
    .post(postKelas(models))
  route.route('/kelassiswa')
    .get(getKelasSiswa(models))
    
  return route;
}