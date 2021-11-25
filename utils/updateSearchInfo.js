import User from '../models/User.js'

export const incrementSearch = async userId => {
	let result = null

	try {
		result = await User.updateOne(
			{ userId },
			{
				$inc: { 'searchInfo.count': 1 },
				$set: { 'searchInfo.lastSearch': Date.now() },
			}
		)
	} catch (e) {
		console.log(e)
		result = null
	}

	return result
}

export const resetSearchInfo = async userId => {
	let result = null

	try {
		result = await User.updateOne(
			{ userId },
			{
				$set: {
					'searchInfo.lastSearch': null,
					'searchInfo.count': 0,
				},
			}
		)
	} catch (e) {
		console.log(e)
		result = null
	}

	return result
}
