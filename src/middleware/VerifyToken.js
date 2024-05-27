const { UNAUTHORIZED, UNPROCESSABLE } = require('@triyogagp/backend-common/utils/response.utils');
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv');
dotenv.config();

const verifyToken = (req, res, next) => {
  if(typeof req.headers['x-inter-service-call'] !== 'undefined'){
    const token = process.env.XINTERSERVICECALL
    if(req.headers['x-inter-service-call'] === token){
      return next()
    }
  }else{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token) return UNPROCESSABLE(res, 'Tidak bisa akses halaman ini !');
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if(err) return UNAUTHORIZED(res, 'Sesi anda telah berakhir, Tidak bisa akses halaman ini !');
      req.JWTDecoded = decoded;
      return next();
    });
  }
}

module.exports = {
  verifyToken
}