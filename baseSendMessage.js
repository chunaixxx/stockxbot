import keyboard from './markup/keyboard.js'

import { baseMarkup, baseMarkupNotFaq } from './markup/baseMarkup.js'
import { adminMarkup } from './markup/adminMarkup.js'

import getUserName from './utils/getUserName.js'
import User from './models/User.js'

export default async ctx => {
	if (ctx.senderId <= 0) return

	const foundUser = await User.findOne({ userId: ctx.senderId }).exec()

    if (!foundUser) {
        const { firstname, lastname } = await getUserName(ctx.senderId)

        const user = new User({
            userId: ctx.senderId,
            username: `${ firstname } ${ lastname }`,
        })

        ctx.state.user = user

        await user.save()
    } else {
        ctx.state.user = foundUser
    }

	const isAdmin = ctx.state?.user?.adminAccess

	const faqMarkup = isAdmin ? keyboard([...baseMarkupNotFaq, ...adminMarkup]) : keyboard(baseMarkupNotFaq)
	const menuMarkup = isAdmin ? keyboard([...baseMarkup, ...adminMarkup]) : keyboard(baseMarkup)

	if (ctx.text == 'Управление' && isAdmin)
		return ctx.scene.enter('admin')

    switch (ctx.text) {
		case 'Купить':
			ctx.scene.enter('search')
			break;
		case 'Продать':
			ctx.scene.enter('sell')
			break;
		case 'Профиль':
			ctx.scene.enter('profile')
			break;
		case 'FAQ':
			ctx.send({
				message: `Привет, это SEARCH_V1 — чат-бот, помогающий людям найти или продать лимитированную одежду/кроссовки/аксессуары. \n• Если у тебя возникли какие-то проблемы, ты нашёл недочёт или у тебя есть какое-то предложение, напиши https://vk.com/impossiblelevel (https://vk.com/impossiblelevell)\n• Если у тебя не получается разобраться в работе с ботом, глянь этот пост (вставим ссылку)`,
				keyboard: faqMarkup
			})
			break;
		case 'Меню':
			ctx.send({
				message: `Привет. Это SEARCH_V1 — Чат-бот, помогающий людям найти или продать лимитированную одежду/кроссовки/аксессуары. Что хочешь сделать?`,
				keyboard: menuMarkup
			})
			break;
		default:
			ctx.send({
				message: `❗ Неизвестная команда. Выберите команду, нажав на кнопку`,
				keyboard: menuMarkup
			})
	}	
}