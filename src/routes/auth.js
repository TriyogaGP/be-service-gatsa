const { Router } = require('express');
const { verifyToken } = require('../middleware/VerifyToken');
const {
  login,
  forgotPass,
  ubahKataSandi,
  ubahProfile,
  profile,
} = require('../controllers/auth.controller')

module.exports = models => {
  const route = Router();

  route.route('/login').post(login(models))
  route.route('/forgotpass').post(forgotPass(models))
  route.route('/ubah-katasandi').post(ubahKataSandi(models))
  route.route('/ubah-profile').post(ubahProfile(models))
  route.route('/profile/:idUser').put(profile(models))
  
  return route;
}