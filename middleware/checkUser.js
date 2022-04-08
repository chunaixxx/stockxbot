import getUserName from '../utils/getUserName.js'
import User from '../models/User.js'
import ExtendedUser from '../models/ExtendedUser.js'
import BannedUser from '../models/BannedUser.js'
import BotConfig from '../models/BotConfig.js'

import moment from 'moment'

export default async (ctx, next) => {
	try {
        const bannedUser = await BannedUser.findOne({ userId: ctx.senderId }).exec()

        if (bannedUser) {
            moment.locale('ru');
            const formattedExpiresIn = moment(bannedUser.expiresIn).format('MMMM DD YYYY')

            return ctx.send(`🚫 Тебе закрыт доступ к нашей площадке. Все твои товары пропали из поиска.\n\nПричина: ${ bannedUser.reason }\nИстекает: никогда\n\nПо вопросам разблокировки писать @impossiblelevell`)
        }

		const user = await User.findOne({ userId: ctx.senderId }).lean().exec()
		const extendedUser = await ExtendedUser.findOne({ userId: ctx.senderId }).lean().exec()

		if (user) {
			ctx.state.user = {
                ...user,
                extendedAccess: extendedUser
            }
		} else {
			const { firstname, lastname } = await getUserName(ctx.senderId)

            const botConfig = await BotConfig.findOne()

			const user = new User({
				userId: ctx.senderId,
				username: `${firstname} ${lastname}`,
                freeSearch : botConfig.maxSearch,
                freeSell: botConfig.maxGoods
			})

			ctx.state.user = user

			await user.save()
		}

		next()
	} catch (e) {
		console.log(e)
		return ctx.send( '❗ Произошла какая-то ошибка, обратитесь к администратору')
	}
}
