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
		const { nama_file } = body
		callBack(null, nama_file + path.extname(file.originalname))
	}
})

const uploadBerkas = multer({
	storage: storage
}).any();

module.exports = {
	uploadBerkas
}