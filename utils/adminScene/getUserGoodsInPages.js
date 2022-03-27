export default goods => {
	let sendString = ''
	let counter = 0

	const pages = []

	goods.forEach((item, index) => {
		const {
			sellerName,
			sellerId,
			city,
			goodName,
			size,
			price,
			hasDelivery,
			hasFitting,
		} = item

		if (size)
			sendString += `📌 @id${sellerId} (${sellerName}), ${city}\n${goodName}\nРазмер: ${size} | Цена: ${price}руб. | Доставка: ${hasDelivery} | Примерка: ${hasFitting}\n\n`
		else
			sendString += `📌 @id${sellerId} (${sellerName}), ${city}\n${goodName}\nЦена: ${price}руб. | Доставка: ${hasDelivery}\n\n`

		counter += 1

		if (counter >= 20 || goods.length - 1 == index) {
			pages.push(sendString)
			sendString = ''
			counter = 0
		}
	})

	return pages
}