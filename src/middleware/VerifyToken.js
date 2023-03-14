const { response } = require('../utils/response.utils');
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv');
dotenv.config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(!token) return response(res, { kode: 404, message: 'Tidak bisa akses halaman ini !' }, 404);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err) return response(res, { kode: 404, message: 'Sesi anda telah berakhir, Tidak bisa akses halaman ini !' }, 404);
    req.email = decoded.email;
    next();
  });
}

module.exports = {
  verifyToken
}