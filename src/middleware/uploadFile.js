const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
	destination: (req, file, callBack) => {
		const { body } = req;
		const { jenis, bagian, nama, nama_file, nama_folder } = body
		if(jenis == 'image' || jenis == 'pdf'){
			const path_dir = 
				bagian == 'berkas' && jenis == 'image' ? path.join(__dirname, '../public/image/' + nama_folder) :
				bagian == 'berkas' && jenis == 'pdf' ? path.join(__dirname, '../public/pdf/' + nama_folder) : '' ;
			// console.log(path_dir);
			// process.exit()
			if (!fs.existsSync(path_dir)) {
				fs.mkdirSync(path_dir);
			}else{
				fs.readdirSync(path_dir, { withFileTypes: true });
			};
			callBack(null, path_dir)
		}else if(jenis == 'logo'){
			const path_dir = path.join(__dirname, '../public/bahan/')
			callBack(null, path_dir)
		}else{
			const location = './src/public/excel/'
			callBack(null, location)
		}
	},
	filename: (req, file, callBack) => {
			const { body } = req;
			const { jenis, bagian, nama, nama_file, nama_folder } = body
			if(jenis == 'image' || jenis == 'logo'){
				let extension = file.mimetype.split('/')
				callBack(null, nama_file + '.' + extension[1])
			}else if(jenis == 'pdf'){
				callBack(null, nama_file + path.extname(file.originalname))
			}else{
				callBack(null, file.originalname)
			}
	}
})

const uploadFile = multer({
	storage: storage
}).any();

module.exports = {
	uploadFile
}