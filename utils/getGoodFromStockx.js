import StockXAPI from 'stockx-api'
const stockX = new StockXAPI()

const getGoodFromStockx = async url => {
	try {
		const response = await stockX.fetchProductDetails(url)

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
		return null
	}
}

export default getGoodFromStockx