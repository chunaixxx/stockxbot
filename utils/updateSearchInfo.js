import User from '../models/User.js'
import BotConfig from '../models/BotConfig.js'

export const incrementSearch = async userId => {
	try {
		await User.updateOne(
			{ userId },
			{
				$inc: { 'searchInfo.count': 1 },
				$set: { 'searchInfo.lastSearch': Date.now() },
			}
		)

		await BotConfig.updateOne(
			{
				$inc: { 'stats.countFoundSearch': 1 }
			}
		)
	} catch (e) {
		console.log(e)
	}
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
