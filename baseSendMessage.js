import config from 'config'
import keyboardBuilder from './markup/keyboard.js'
import { baseMarkup } from './markup/baseMarkup.js'
import { adminMarkup, settingsMarkup } from './markup/adminMarkup.js'

export default async ctx => {
    // Проверка на наличие админ. прав
	const settingsAccess = ctx.state?.user?.settingsAccess
	const adminAccess = ctx.state?.user?.adminAccess

    // Заполнение блока клавиатуры с учетом администраторов
	const markup = []
	switch (true) {
		case settingsAccess:
			markup.push(...settingsMarkup)
		case adminAccess:
			markup.push(...adminMarkup)
		default:
			markup.push(...baseMarkup)
	}

	if (ctx.text == 'Владелец' && settingsAccess)
		return ctx.scene.enter('superadmin')

	if (ctx.text == 'Управление' && (adminAccess || settingsAccess))
		return ctx.scene.enter('admin')

    const keyboard = keyboardBuilder(markup)

    // Cообщения из конфига
    const { base, faq, unknown } = config.get('messages.main')

	switch (ctx.text) {
		case 'Купить':
			return ctx.scene.enter('search')
		case 'Продать':
			return ctx.scene.enter('sell')
		case 'Профиль':
			return ctx.scene.enter('profile')
		case 'FAQ':
			return ctx.send({ message: faq, keyboard })
		case 'Меню':
			return ctx.send({ message: base, keyboard })
		case 'Начать':
			return ctx.send({ message: faq, keyboard })
		default:
			return ctx.send({ message: unknown, keyboard })
	}
}
