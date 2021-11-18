import fs from 'fs'
import axios from 'axios'

import fileIsExist from './fileIsExist.js'

const generateImage = async (url, filename) => {
	const imgPath = `./images/${filename}.jpg`
	const imageIsExist = await fileIsExist(imgPath)
	
	if (!imageIsExist) {
		const writer = fs.createWriteStream(imgPath)

		const response = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
		})
	
		await response.data.pipe(writer)
	
		return new Promise((resolve, reject) => {
			writer.on('finish', resolve)
			writer.on('error', reject)
		})
	}
}

export default generateImage