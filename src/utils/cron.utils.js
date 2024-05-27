const { request } = require('@triyogagp/backend-common/utils/request.utils')
const { bulanValues } = require('@triyogagp/backend-common/utils/helper.utils')
const _ = require("lodash");
const dayjs = require('dayjs');
const path = require("path");
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const TOKEN = process.env.TOKEN
const XINTERSERVICECALL = process.env.XINTERSERVICECALL

async function cronTemporaryFile (models) {
	const data = await models.TemporaryFile.findAll({ where: { use: 0 } });
	data.map(async x => {
		fs.unlinkSync(path.join(__dirname, `../public/berkas/${x.file}`)); 
		await models.TemporaryFile.destroy({ where: { kode: x.kode } })
	})
	return 'success'
}

module.exports = {
	cronTemporaryFile,
}