import StockXAPI from 'stockx-api'

const stockX = new StockXAPI({
    currency: 'USD',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1'
})

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
        console.log(e);
		return null
	}
}

export default getGoodFromStockx