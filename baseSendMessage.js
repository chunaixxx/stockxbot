import keyboard from './markup/keyboard.js'

import { baseMarkup, baseMarkupNotFaq } from './markup/baseMarkup.js'
import { adminMarkup, settingsMarkup } from './markup/adminMarkup.js'

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

	const settingsAccess = ctx.state?.user?.settingsAccess
	const adminAccess = ctx.state?.user?.adminAccess

	const markup = []

	switch (true) {
		case settingsAccess:
			markup.push(...settingsMarkup)
		case adminAccess:
			markup.push(...adminMarkup)
		default:
			markup.push(...baseMarkup)
	}

	
	if (ctx.text == 'Cупер-админ' && settingsAccess)
		return ctx.scene.enter('superadmin')

	if (ctx.text == 'Управление')
		if (adminAccess || settingsAccess)
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
				keyboard: keyboard(markup)
			})
			break;
		case 'Меню':
			ctx.send({
				message: `Привет. Это SEARCH_V1 — Чат-бот, помогающий людям найти или продать лимитированную одежду/кроссовки/аксессуары. Что хочешь сделать?`,
				keyboard: keyboard(markup)
			})
			break;
		case 'Начать':
			ctx.send({
				message: `Привет. Это SEARCH_V1 — Чат-бот, помогающий людям найти или продать лимитированную одежду/кроссовки/аксессуары. Что хочешь сделать?`,
				keyboard: keyboard(markup)
			})
			break;
		default:
			ctx.send({
				message: `❗ Неизвестная команда. Выберите команду, нажав на кнопку`,
				keyboard: keyboard(markup)
			})
	}	
}