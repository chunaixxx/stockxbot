import getUserName from '../utils/getUserName.js'
import User from '../models/User.js'

export default async (ctx, next) => {
	try {
		const foundUser = await User.findOne({ userId: ctx.senderId }).exec()

		if (foundUser) {
			ctx.state.user = foundUser
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
