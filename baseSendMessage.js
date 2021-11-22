import keyboard from './markup/keyboard.js'

import { baseMarkup, baseMarkupNotFaq } from './markup/baseMarkup.js'
import menuMarkup from './markup/menuMarkup.js'

export default ctx => {
    switch (ctx.text) {
		case 'Купить':
			ctx.scene.enter('search')
			break;
		case 'Продать':
			ctx.scene.enter('sell')
			break;
		case 'Мои объявления':
			ctx.scene.enter('myAds')
			break;
		case 'FAQ':
			ctx.send({
				message: `Привет, это SEARCH_V1 — чат-бот, помогающий людям найти или продать лимитированную одежду/кроссовки/аксессуары. \n• Если у тебя возникли какие-то проблемы, ты нашёл недочёт или у тебя есть какое-то предложение, напиши https://vk.com/impossiblelevel (https://vk.com/impossiblelevell)\n• Если у тебя не получается разобраться в работе с ботом, глянь этот пост (вставим ссылку)`,
				keyboard: keyboard(baseMarkupNotFaq)
			})
			break;
		case 'Меню':
			ctx.send({
				message: `Привет. Это SEARCH_V1 — Чат-бот, помогающий людям найти или продать лимитированную одежду/кроссовки/аксессуары. Что хочешь сделать?`,
				keyboard: keyboard(baseMarkup)
			})
			break;
		default:
			ctx.send({
				message: `❗ Неизвестная команда. Выберите команду, нажав на кнопку`,
				keyboard: keyboard(baseMarkup)
			})
	}	
}