const multer = require('multer')
const path = require('path')
const fs = require('fs');

const storage = multer.diskStorage({
	destination: (req, file, callBack) => {
		const { body } = req;
		const { nama_file } = body
		const path_dir = path.join(__dirname, '../public/berkas/');
		callBack(null, path_dir)
	},
	filename: (req, file, callBack) => {
		const { body } = req;
		const { jenis, nama_file } = body
		// if(jenis == 'image'){
		let extension = file.mimetype.split('/')
		callBack(null, nama_file + '.' + extension[1])
		// }else {
		// 	callBack(null, nama_file + path.extname(file.originalname))
		// }
	}
})

const uploadBerkas = multer({
	storage: storage
}).any();

module.exports = {
	uploadBerkas
}