import vk from './commonVK.js'

import keyboard from './markup/keyboard.js'

import { baseMarkup, baseMarkupNotFaq } from './markup/baseMarkup.js'
import { adminMarkup, settingsMarkup } from './markup/adminMarkup.js'

import getUserName from './utils/getUserName.js'
import User from './models/User.js'

export default async ctx => {
	if (ctx.senderId <= 0) return

	if (process.env.ONLY_SUBSCRIBER == 'true') {
		const isSubscriber = await vk.api.groups.isMember({ 
			group_id: process.env.GROUP_ID, 
			user_id: ctx.senderId 
		})
	
		if (isSubscriber == false)
			return ctx.send('❗ Пользоваться услугами чат-бота могут только подписчики нашей закрытой группы')
	}

	try {
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
	} catch (e) {
		return ctx.send('❗ Произошла какая-то ошибка, обратитесь к администратору')
		console.log(e)
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
				message: `Привет. Это SEARCH_BOT — Чат-бот, помогающий людям найти или продать лимитированную одежду/кроссовки/аксессуары. Что хочешь сделать?`,
				keyboard: keyboard(markup)
			})
			break;
		case 'Начать':
			ctx.send({
				message: `Привет, это SEARCH_BOT — чат-бот, помогающий людям найти или продать лимитированную одежду/кроссовки/аксессуары. \n\n• Перед использованием софта ознакомься с правилами https://m.vk.com/topic-209170354_48135561\n• Если возникли трудности при взаимодействии с ботом https://m.vk.com/topic-209170354_48135560(https://m.vk.com/topic-209170354_48135560)\n• Все размерные сетки тут https://vk.com/wall-209170354_2\n• Остальные проблемы/недочёты/предложения https://vk.com/impossiblelevel`,
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