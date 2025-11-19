const { Router } = require('express');
const { verifyToken } = require('../middleware/VerifyToken');
const {
  login,
  forgotPass,
  ubahKataSandi,
  ubahProfile,
  profile,
  logout,
  authToken,
} = require('../controllers/auth.controller')

module.exports = models => {
  const route = Router();

  route.route('/login').post(login(models))
  route.route('/forgot-pass').post(forgotPass(models))
  route.route('/ubah-katasandi').post(verifyToken, ubahKataSandi(models))
  route.route('/ubah-profile').post(verifyToken, ubahProfile(models))
  route.route('/profile').put(verifyToken, profile(models))
  route.route('/logout').get(verifyToken, logout(models))
  route.route('/auth-token').get(verifyToken, authToken())

  return route;
}