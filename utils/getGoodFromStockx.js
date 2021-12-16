import fetchProductDetails from './fetchProductDetails.js'
import getRandomProxy from './getRandomProxy.js';

const getGoodFromStockx = async url => {
	try {
        let response = null;
        
        // if (Math.random() > 0.25) {
        //     const randomProxy = process.env.PROXY_LIST ? getRandomProxy(process.env.PROXY_LIST.split(' ')) : null
        //     console.log(randomProxy);
        //     response = await fetchProductDetails(url, { proxy: randomProxy })
        // } else {
        //     response = await fetchProductDetails(url)
        // }

        const randomProxy = process.env.PROXY_LIST ? getRandomProxy(process.env.PROXY_LIST.split(' ')) : null
        response = await fetchProductDetails(url, { proxy: randomProxy })

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