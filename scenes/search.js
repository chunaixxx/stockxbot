import '../mongodb.js'
import Good from '../models/Good.js'

import vk from '../commonVK.js'
import { StepScene } from '@vk-io/scenes'

import baseSendMessage from '../baseSendMessage.js'

import keyboard from '../markup/keyboard.js'

import answerMarkup from '../markup/answerMarkup.js'
import { baseMarkup } from '../markup/baseMarkup.js'
import menuMarkup from '../markup/menuMarkup.js'
import methodSearch from '../markup/methodSearch.js'
import cityMarkup from '../markup/cityMarkup.js'
import previousMarkup from '../markup/previousMarkup.js'

import getUserName from '../utils/getUserName.js'
import getGoodFromStockx from '../utils/getGoodFromStockx.js'
import generateImage from '../utils/generateImage.js'
import convertURL from '../utils/convertURL.js'

const searchScene = [
	new StepScene('search', [
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message:
						'❗ Для того чтобы найти необходимый предмет для покупки — выберите с помощью какого метода собиратесь искать товар',
					keyboard: keyboard([...methodSearch, ...menuMarkup]),
				})
			
			ctx.scene.state.isSearchName = false
			ctx.scene.state.isSearchLink = false

			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}

			if (ctx.text == 'Название') {
				ctx.scene.state.isSearchName = true
				ctx.scene.step.go(1)
			}

			if (ctx.text == 'Ссылка') {
				ctx.scene.state.isSearchLink = true
				ctx.scene.step.go(2)
			}
		},
		// Нахождение товаров по имени
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message:
						'❗ Введите частичное название товара и мы найдем подходящие товары по вашему запросу',
					keyboard: keyboard(previousMarkup),
				})

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(0)

			if (ctx.text.length < 3)
				return ctx.send({
					message:
						'❗ Минимальная длина запроса — 3 символа. Введите другой запрос',
					keyboard: keyboard(previousMarkup),
				})

			ctx.scene.state.query = ctx.text
			ctx.scene.state.searchedGoods = await Good.find({'goodName': {'$regex': '.*' + ctx.text +'.*', $options: 'i'}}).exec()

			ctx.scene.step.go(3)
		},
		// Нахождение товаров по ссылке
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
			return ctx.send({
				message: '❗ Укажите ссылку на товар с сайта stockx.com, чтобы показать все объявления конкретного товара\n\nШаблон: stockx.com/*',
				keyboard: keyboard(previousMarkup),
			})

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(0)

			const link = convertURL(ctx.text)
			const goodFromStockx = await getGoodFromStockx(link)
			if (!goodFromStockx)
				return ctx.send({
					message: `❗ Ссылка не ведет на товар с stockx.com, попробуйте еще раз.\n\nШаблон: stockx.com/*`,
					keyboard: keyboard(menuMarkup)
				})
	
			ctx.scene.state.goodName = goodFromStockx.name
			ctx.scene.state.searchedGoods = await Good.find({ link }).exec()

			ctx.scene.step.go(3)
		},
		// Вывод пользователю найденных товаров
		async ctx => {
			if (ctx.text == 'Назад')
				return ctx.scene.step.go(0)

			const searchedGoods = ctx.scene.state.searchedGoods

			if (ctx.scene.state.isSearchLink) {
				const goodName = ctx.scene.state.goodName
				if (searchedGoods.length) {
					let sendString = `❗ По твоему запросу "${goodName}" найдены такие объявления:\n\n`
					searchedGoods.forEach((item, index) => {
						const { sellerName, sellerId, city, size, price} = item
		
						if (size)
							sendString += `📌 ${ sellerName }, ${city} (vk.com/id${sellerId})\nРазмер: ${size}, Цена: ${price}руб.\n\n`
						else
							sendString += `📌 ${ sellerName }, ${city} (vk.com/id${sellerId})\nЦена: ${price}руб.\n\n`
					})
	
					ctx.send({
						message: sendString,
						keyboard: keyboard(previousMarkup)
					})
				} else {
					ctx.send({
						message: `❗ Товар "${goodName}" никто не продает на нашей площадке, попробуй воспользоваться поиском по названию:`,
					})
					return ctx.scene.step.go(0)
				}
			}

			if (ctx.scene.state.isSearchName) {
				if (searchedGoods.length) {
					let sendString = `❗ По твоему запросу "${ctx.text}" найдены такие объявления:\n\n`
		
					searchedGoods.forEach((item, index) => {
						const { sellerName, sellerId, city, goodName, size, price} = item
		
						if (size)
							sendString += `📌 ${ sellerName }, ${city} (vk.com/id${sellerId})\n${goodName} | \nРазмер: ${size}, Цена: ${price}руб.\n\n`
						else
							sendString += `📌 ${ sellerName }, ${city} (vk.com/id${sellerId})\nЦена: ${price}руб.\n\n`
					})
	
					ctx.send({
						message: sendString,
						keyboard: keyboard(previousMarkup)
					})
				} else {
					ctx.send({
						message: `❗ К сожалению, по вашему запросу ${ctx.scene.state.query} ничего не найдено на нашей площадке.`, 
					})
					return ctx.scene.step.go(0)
				}
			}
		},
		async ctx => {
			ctx.send('Good')
		}
	])	
]

export default searchScene
