import config from 'config'
import vk from '../commonVK.js'

export default async (ctx, next) => {
	const isOnlySub = config.get('onlySubscriber')

	if (isOnlySub == 'true') {
		const group_id = config.get('groupID')
		const user_id = ctx.senderId

		const isSub = await vk.api.groups.isMember({ group_id, user_id })

		if (!isSub)
			return ctx.send('❗ Пользоваться услугами чат-бота могут только подписчики нашей группы')
	}

	next()
}
