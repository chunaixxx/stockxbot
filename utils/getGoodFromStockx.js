import config from 'config'
import fetchProductDetails from './fetchProductDetails.js'
import getRandomProxy from './getRandomProxy.js';

const getGoodFromStockx = async url => {
	try {
        const proxyList = config.get('proxyList')

        const randomProxy = proxyList ? getRandomProxy(proxyList) : null
        const response = await fetchProductDetails(url, { proxy: randomProxy })

        console.log(randomProxy)

		const sizes = [...response.variants].map(item => item.size)

		let name = response.urlKey.split('-').join(' ').toUpperCase()

        let rightUrl = response.image.slice(0, response.image.indexOf('?')); 

		return {
			url,
			name,
			imgUrl: rightUrl,
			filename: response.urlKey,
			allSizes: sizes[0] ? sizes : null
		}
	} catch(e) {
        console.log(e);
		return null
	}
}

export default getGoodFromStockx