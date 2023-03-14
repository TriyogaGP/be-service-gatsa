const multer = require('multer')
const path = require('path')
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        const { body } = req;
        const { bagian } = body
        const path_dir = path.join(__dirname, '../public/excel/');
        if (!fs.existsSync(path_dir)) {
            fs.mkdirSync(path_dir, 0777);
        }else{
            fs.readdirSync(path_dir, { withFileTypes: true });
        }
        callBack(null, path_dir)
    },
    filename: (req, file, callBack) => {
        const { body } = req;
        const { bagian } = body
        let nama_file = bagian == 'install' ? 'user_install' : 'user_acquisition'
        callBack(null, nama_file + path.extname(file.originalname))
    }
})

const uploadBerkas = multer({
    storage: storage
}).any();

module.exports = {
    uploadBerkas
}