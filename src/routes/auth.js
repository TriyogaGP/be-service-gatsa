const { Router } = require('express');
const { verifyToken } = require('../middleware/VerifyToken');
const {
  login,
  forgotPass,
  ubahKataSandi,
  profile,
} = require('../controllers/auth.controller')

module.exports = models => {
  const route = Router();

  route.route('/login').post(login(models))
  route.route('/forgotPass').post(forgotPass(models))
  route.route('/ubahKataSandi').post(ubahKataSandi(models))
  route.route('/profile/:idUser').put(profile(models))
  
  return route;
}