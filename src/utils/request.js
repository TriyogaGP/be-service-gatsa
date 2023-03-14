const axios = require('axios')

async function request({ url, method, data = null, params = null, headers = null}) {
	const results = await axios({ method, url, data, params, headers })
	return results
}

module.exports = {
	request
}