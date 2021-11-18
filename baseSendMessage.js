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
				message: 'Еще раз привет, я чат-бот который позволяет людям продавать или обмениваться различными товарами. Можешь опробовать мой функционал, потыкав кнопки под сообщением',
				keyboard: keyboard(baseMarkupNotFaq)
			})
			break;
		case 'Меню':
			ctx.send({
				message: `Привет. Это чат-бот торговой площадки, где люди продают и покупают различные вещи с stockx.com.`,
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