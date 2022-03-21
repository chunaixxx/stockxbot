import getUserName from '../utils/getUserName.js'
import User from '../models/User.js'
import BannedUser from '../models/BannedUser.js'

import moment from 'moment'

export default async (ctx, next) => {
	try {
        const bannedUser = await BannedUser.findOne({ userId: ctx.senderId }).exec()

        if (bannedUser) {
            moment.locale('ru');
            const formattedExpiresIn = moment(bannedUser.expiresIn).format('MMMM DD YYYY')

            return ctx.send(`🚫 Тебе закрыт доступ к нашей площадке. Все твои товары пропали из поиска.\n\nПричина: ${ bannedUser.reason }\nИстекает: никогда\n\nПо вопросам разблокировки писать @impossiblelevell`)
        }

		const user = await User.findOne({ userId: ctx.senderId }).exec()

		if (user) {
			ctx.state.user = user
		} else {
			const { firstname, lastname } = await getUserName(ctx.senderId)

			const user = new User({
				userId: ctx.senderId,
				username: `${firstname} ${lastname}`,
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
