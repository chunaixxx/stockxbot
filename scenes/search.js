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
import skipMarkup from '../markup/skipMarkup.js'
import previousMarkup from '../markup/previousMarkup.js'

import getUserName from '../utils/getUserName.js'
import getGoodFromStockx from '../utils/getGoodFromStockx.js'
import generateImage from '../utils/generateImage.js'
import convertURL from '../utils/convertURL.js'
import sortGoodsByPrice from '../utils/sortGoodsByPrice.js'

const searchScene = [
	new StepScene('search', [
		async ctx => {
			ctx.scene.state.query = null
			ctx.scene.state.link = null
			ctx.scene.state.range = [0, Infinity]
			ctx.scene.state.sizeRange = []

			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message:
						'❗ Для того чтобы найти необходимый предмет для покупки — выберите с помощью какого метода собиратесь искать товар',
					keyboard: keyboard([...methodSearch, ...menuMarkup]),
				})

			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}

			if (ctx.text == 'Название') {
				ctx.scene.step.go(1)
			}

			if (ctx.text == 'Ссылка') {
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
			ctx.scene.state.link = link

			ctx.scene.step.go(3)
		},
		// Фильтрация по размеру
			async ctx => {
				if (ctx.scene.step.firstTime || !ctx.text)
					return ctx.send({
						message:
							'❗ Использовать фильтрацию по размеру? Если да, то перечислите через пробел нужные размеры.\n\nПримеры: 8 8,5 5W 4K M 7Y XXL',
						keyboard: keyboard(skipMarkup),
					})
	
				if (ctx.text == 'Пропустить')
					return ctx.scene.step.next()
	
				const range = ctx.text.split(' ')
				ctx.scene.state.sizeRange = range
	
				return ctx.scene.step.next()
			},
	// Фильтрация по цене
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message:
						'❗ Использовать фильтрацию по цене? Если да, то укажите диапозон.\n\nПример: 10000-200000',
					keyboard: keyboard(skipMarkup),
				})

			if (ctx.text == 'Пропустить')
				return ctx.scene.step.next()

			const patternNumber = /^\d+$/
			const rangeArr = ctx.text.split('-')

			if (rangeArr.length == 2 && patternNumber.test(rangeArr[0]) && patternNumber.test(rangeArr[1])) {
				ctx.scene.state.range = [+rangeArr[0], +rangeArr[1]]
				return ctx.scene.step.next()
			} else {
				return ctx.send('Укажите диапозон в правильном формате \n\n❌ 10.000руб.-200.000руб.\n✔️ 10000-200000')
			}
		},

		// Вывод пользователю найденных товаров
		async ctx => {
			if (ctx.text == 'Назад')
				return ctx.scene.step.go(0)

			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}

			if (ctx.scene.state.link) {
				const link = ctx.scene.state.link

				const minPrice = ctx.scene.state.range[0]
				const maxPrice = ctx.scene.state.range[1]

				const sizeRange = ctx.scene.state.sizeRange

				if (sizeRange.length) {
					ctx.scene.state.searchedGoods = await Good.find({ 
						link,
						'price': { $gte : minPrice, $lte : maxPrice},
						'size': { $in: sizeRange }
					}).exec()
				} else {
					ctx.scene.state.searchedGoods = await Good.find({ 
						link,
						'price': { $gte : minPrice, $lte : maxPrice},
					}).exec()
				}

				ctx.scene.state.searchedGoods.sort(sortGoodsByPrice());
				
				const searchedGoods = ctx.scene.state.searchedGoods
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
						keyboard: keyboard([...previousMarkup, ...menuMarkup])
					})
				} else {
					ctx.send({
						message: `❗ Товар "${goodName}" никто не продает на нашей площадке. Попробуй воспользоваться поиском по названию или укажите другой размер.`,
					})
					return ctx.scene.step.go(0)
				}
			}






			if (ctx.scene.state.query) {
				const minPrice = ctx.scene.state.range[0]
				const maxPrice = ctx.scene.state.range[1]

				const sizeRange = ctx.scene.state.sizeRange

				if (sizeRange.length) {
					ctx.scene.state.searchedGoods = await Good.find({
						'goodName': {'$regex': '.*' + ctx.scene.state.query +'.*', $options: 'i'},
						'price': { $gte :  minPrice, $lte :  maxPrice},
						'size': { $in: sizeRange }
					}).exec()
				} else {
					ctx.scene.state.searchedGoods = await Good.find({
						'goodName': {'$regex': '.*' + ctx.scene.state.query +'.*', $options: 'i'},
						'price': { $gte :  minPrice, $lte :  maxPrice},
					}).exec()					
				}

				ctx.scene.state.searchedGoods.sort(sortGoodsByPrice());
				
				const searchedGoods = ctx.scene.state.searchedGoods
				
				if (searchedGoods.length) {
					let sendString = `❗ По твоему запросу "${ ctx.scene.state.query }" найдены такие объявления:\n\n`
		
					searchedGoods.forEach((item, index) => {
						console.log(item)
						const { sellerName, sellerId, city, goodName, size, price} = item
		
						if (size)
							sendString += `📌 ${ sellerName }, ${ city } (vk.com/id${ sellerId })\n${ goodName } | \nРазмер: ${ size }, Цена: ${ price }руб.\n\n`
						else
							sendString += `📌 ${ sellerName }, ${ city } (vk.com/id${ sellerId })\n${ goodName } | Цена: ${ price }руб.\n\n`
					})
	
					ctx.send({
						message: sendString,
						keyboard: keyboard([...previousMarkup, ...menuMarkup])
					})
				} else {
					ctx.send({
						message: `❗ К сожалению, по вашему запросу ${ctx.scene.state.query} ничего не найдено на нашей площадке. Попробуй воспользоваться поиском по названию или укажите другой размер.`, 
					})
					return ctx.scene.step.go(0)
				}
			}
		},
	])	
]

export default searchScene
