import Good from '../models/Good'
import sortGoodsByPrice from './sortGoodsByPrice'

export default async ({ userQuery, sizeRange, priceRange, isHide }) => {
	const query = {
		price: { $gte: priceRange[0], $lte: priceRange[1] },
        isHide
	}

	if (sizeRange.length) query.size = { $in: sizeRange }

	if (userQuery.type === 'word') {
		const splittedUserQuery = userQuery.value.split(' ')

		const queryWordsFilters = splittedUserQuery.map(word => {
			return { goodName: { $in: new RegExp(word, 'i') } }
		})

		query.$and = queryWordsFilters
	} else if (userQuery.type == 'link') {
		query.link = userQuery.value
	}

	try {
		const foundGoods = await Good.find(query)
		const sortedGoods = foundGoods.sort(sortGoodsByPrice())

		return sortedGoods
	} catch (e) {
		console.log(e)
	}
}
