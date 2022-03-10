export default subsribes => {
	let sendString = ''
	let counter = 0

	const pages = []

	subsribes.forEach((subsribe, index) => {
		const { userQuery, sizeRange, priceRange } = subsribe.data

        const sizeRangeStr = sizeRange.length ? 'Размеры: ' + sizeRange.join(', ') : 'Размер: любой'

        let priceRangeStr = ''

        if (priceRange.min !== 0)
            priceRangeStr += `от ${ priceRange.min } руб. `

        if (priceRange.max !== Infinity)
            priceRangeStr += `до ${ priceRange.max } руб.`

        if (priceRange.min == 0 && priceRange.max == Infinity)
            priceRangeStr += `Цена: любая`

        priceRangeStr = priceRangeStr[0].toUpperCase() + priceRangeStr.slice(1);

		sendString += `[${index + 1}] ${ userQuery.goodName }.\n${ sizeRangeStr } | ${ priceRangeStr }\n\n`

		counter += 1

		if (counter >= 20 || subsribes.length - 1 == index) {
			pages.push(sendString)
			sendString = ''
			counter = 0
		}
	})

	return pages
}
