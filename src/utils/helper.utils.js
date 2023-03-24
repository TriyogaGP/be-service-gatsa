const KSUID = require('ksuid');
const crypto = require('crypto');
const { functions } = require('lodash');
const key = '3d11@0s5'

//Encrypting text
function encrypt(text) {
	var randomm = Math.floor((Math.random() * (32000 - 0 + 1)) + 0)
	var r = crypto.createHash('md5').update(randomm.toString()).digest("hex")
	var c = 0
	var v = ""
	for (let i = 0; i < text.length; i++) {
			if (c == r.length) {
					c = 0
			}
			v += r.substr(c, 1) + (String.fromCharCode(text.substr(i, 1).charCodeAt(0) ^ r.substr(c, 1).charCodeAt(0)))
			c++
	}
	var ret = Buffer.from(ed(v)).toString('base64').replace(/\//g, 'garing')
	return ret
}

// Decrypting text
function decrypt(text) {
	var a = text.replace(/garing/g, '/')
	var c = Buffer.from(a, 'base64').toString('ascii')
	var b = ed(c)
	var v = ""
	for (let i = 0; i < text.length; i++) {
			var md5 = b.substr(i, 1)
			i++
			v += String.fromCharCode(b.substr(i, 1).charCodeAt(0) ^ md5.charCodeAt(0))
	}
	return v.replace(/[^a-zA-Z0-9!@#$%^&*():\|{};+-_=?/",.~ ]/g, "")
}

function ed(t) {
	var r = crypto.createHash('md5').update(key).digest("hex")
	var c = 0
	var v = ""
	for (let i = 0; i < t.length; i++) {
			if (c == r.length) {
					c = 0
			}
			var aa = t.substr(i, 1)
			var bb = r.substr(c, 1)
			v += String.fromCharCode(aa.charCodeAt(0) ^ bb.charCodeAt(0))
			c++
	}
	return v
}

function makeRandom(n) {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	for ( let i = 0; i < n; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function makeRandomAngka(n) {
	let result = '';
	const characters = '0123456789';
	const charactersLength = characters.length;
	for ( let i = 0; i < n; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

async function createKSUID() {
	const id = await KSUID.random()
	return id.string
}

function UpperFirstLetter(str) {
	return str.split(' ').map(i => i[0].toUpperCase() + i.substring(1).toLowerCase()).join(' ')
}

function dateconvert(str) {
	const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
	const date = new Date(str);
	const mnth = bulan[date.getMonth()];
	const day = ("0" + date.getDate()).slice(-2);
	const valueConvert = [day, mnth, date.getFullYear()].join(" ")
	return valueConvert
}

function convertDate(str) {
	let date = new Date(str),
	mnth = ("0" + (date.getMonth() + 1)).slice(-2),
	day = ("0" + date.getDate()).slice(-2);
	const valueConvert = [date.getFullYear(), mnth, day].join("-");
	return valueConvert
}

function convertDate2(str) {
	let date = new Date(str),
	mnth = ("0" + (date.getMonth() + 1)).slice(-2),
	day = ("0" + date.getDate()).slice(-2);
	const valueConvert = [day, mnth, date.getFullYear()].join("-");
	return valueConvert
}

function convertDate3(str) {
	let date = new Date(str),
	mnth = ("0" + (date.getMonth() + 1)).slice(-2),
	day = ("0" + date.getDate()).slice(-2);
	const valueConvert = [date.getFullYear(), mnth, day].join("");
	return valueConvert
}

function convertDateTime(str) {
	const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
	let date = new Date(str),
	mnth = bulan[date.getMonth()],
	day = ("0" + date.getDate()).slice(-2);
	const valueConvertDate = [day, mnth, date.getFullYear()].join(" ");

	let time = new Date(str),
	jam = ("0" + time.getHours()).slice(-2),
	menit = ("0" + time.getMinutes()).slice(-2),
	detik = ("0" + time.getSeconds()).slice(-2);
	const valueConvertTime = [jam, menit, detik].join(":");

	const datetime = [valueConvertDate, valueConvertTime].join(" ");

	return datetime
}

function convertDateTime2(str) {
	let date = new Date(str),
	mnth = ("0" + (date.getMonth() + 1)).slice(-2),
	day = ("0" + date.getDate()).slice(-2);
	const valueConvertDate = [date.getFullYear(), mnth, day].join("-");

	let time = new Date(str),
	jam = ("0" + time.getHours()).slice(-2),
	menit = ("0" + time.getMinutes()).slice(-2),
	detik = ("0" + time.getSeconds()).slice(-2);
	const valueConvertTime = [jam, menit, detik].join(":");

	const datetime = [valueConvertDate, valueConvertTime].join(" ");

	return datetime
}

function convertDateGabung(str) {
	let date = new Date(str),
	mnth = ("0" + (date.getMonth() + 1)).slice(-2),
	day = ("0" + date.getDate()).slice(-2);
	
	const valueConvert = [date.getFullYear(), mnth, day].join("");
	
	return valueConvert
}

function bulanValues(str) {
	const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
	const date = new Date(str);
	const mnth = bulan[date.getMonth()];
	return mnth
}

function uppercaseLetterFirst(textInput) {
	textInput = textInput.toLowerCase();
	var stringArray = textInput.split(/\b(\s)/);
	for (var i = 0; i < stringArray.length; i++) {
		stringArray[i] =
			stringArray[i].charAt(0).toUpperCase() +
			stringArray[i].substring(1);
	}
	var finalText = stringArray.join("");
	return finalText;
}

function buildMysqlResponseWithPagination(records, params) {
	const { limit = 25, page = 1, total } = params;
	const totalPages = Math.ceil(total / limit);
	return {
		records,
		pageSummary: {
		page: Number(page),
		limit: Number(limit),
		total,
		totalPages,
		},
	};
}

function paginate(array, page_size, page_number) {
	return array.slice((page_number - 1) * page_size, page_number * page_size)
}

module.exports = {
  encrypt,
	decrypt,
	makeRandom,
	makeRandomAngka,
	createKSUID,
	UpperFirstLetter,
	dateconvert,
	convertDate,
	convertDate2,
	convertDate3,
	convertDateTime,
	convertDateTime2,
	convertDateGabung,
	bulanValues,
	uppercaseLetterFirst,
	buildMysqlResponseWithPagination,
	paginate,
}