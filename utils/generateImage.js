import fs from 'fs'
import axios from 'axios'
import config from 'config'
import getRandomProxy from './getRandomProxy.js'
import * as tunnel from 'tunnel'
import sharp from 'sharp'

import fileIsExist from './fileIsExist.js'

const generateImage = async (url, filename) => {
	const imgPath = `./images/${filename}.jpg`
	const imageIsExist = await fileIsExist(imgPath)

	if (!imageIsExist) {
		const writer = fs.createWriteStream(imgPath)

		const proxyList = config.get('proxyList')
		const randomProxy = getRandomProxy(proxyList)

		const strAuthProxy = randomProxy.split('@')[0]
		const strDomainProxy = randomProxy.split('@')[1]

		const proxy = tunnel.httpsOverHttp({
			proxy: {
				host: strDomainProxy.split(':')[0],
				port: +strDomainProxy.split(':')[1],
				proxyAuth: strAuthProxy,
			},
		})

		const response = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
			httpsAgent: proxy,
			headers: {
				'user-agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36',
				accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
				'accept-language': 'en-US,en;q=0.9',
				'sec-ch-ua':
					'" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
				'sec-ch-ua-mobile': '?0',
				'sec-fetch-dest': 'document',
				'sec-fetch-mode': 'navigate',
				'sec-fetch-site': 'none',
				'sec-fetch-user': '?1',
				'upgrade-insecure-requests': '1',
			},
		})

		const transformer = sharp()
			// .composite([{ input: svg, gravity: 'southeast' }])
			.resize({
				width: 1500,
				fit: sharp.fit.cover,
				position: sharp.strategy.entropy,
			})

		await response.data.pipe(transformer).pipe(writer)

		return new Promise((resolve, reject) => {
			writer.on('finish', resolve)
			writer.on('error', reject)
		})
	}
}

export default generateImage
