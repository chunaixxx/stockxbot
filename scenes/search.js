import '../mongodb.js'
import Good from '../models/Good.js'
import User from '../models/User.js'
import BotConfig from '../models/BotConfig.js'

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

import getGoodFromStockx from '../utils/getGoodFromStockx.js'
import convertURL from '../utils/convertURL.js'
import sortGoodsByPrice from '../utils/sortGoodsByPrice.js'
import { incrementSearch, resetSearchInfo } from '../utils/updateSearchInfo.js'
import convertDate from '../utils/convertDate.js'

const searchScene = [
	new StepScene('search', [
		async ctx => {
			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}

            if (ctx.text == 'Поиск скидки') {
                return ctx.send({
                    message: `Очень рады что тебя заинтересовали наши скидки! Мы делаем скидку в таких магазинах как:\n\nLamoda -25%\nLeform 35-40%\nAsos до 40%\nFarfetch до 20%\nStreet Beat до 40%\nBrandshop 15%\n\nЧтобы узнать подробности и заказать пиши https://vk.com/eileonov`,
                    keyboard: keyboard([...methodSearch, ...menuMarkup])
                })
            }

			try {
				const user = await User.findOne({ userId: ctx.senderId })

				const countSearch = user.searchInfo.count
				const lastSearch = user.searchInfo.lastSearch
				const maxCountSearch = (await BotConfig.findOne()).maxSearch
				const extendedAccess = user.extendedAccess
				
				// const msMounth = 1000 * 60 * 60 * 24 * 30
				const botConfig = await BotConfig.findOne()
				const cooldownSearch = botConfig.cooldownSearch

				if (countSearch >= maxCountSearch && extendedAccess == false ) {
					if (Date.now() - lastSearch.getTime() >= cooldownSearch) {
						await resetSearchInfo(ctx.senderId)
					} else {
						const leftTime = convertDate(+cooldownSearch + +lastSearch.getTime())

						ctx.send({
							message: `❗ Вы превысили лимит поисков (${ countSearch }/${ maxCountSearch }). Следующие ${ maxCountSearch } поиска будут доступны ${ leftTime }. Оформите расширенный доступ для неограниченного количества поисков`,
							keyboard: keyboard(menuMarkup)	
						})
						return ctx.scene.leave()
					}
				}
			} catch (e) {
				console.log(e)
				ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
				return ctx.scene.leave()
			}

			if (ctx.scene.step.firstTime || !ctx.text) {
				return ctx.send({
					message:
						'❗ Для того чтобы найти необходимый предмет для покупки — выберите с помощью какого метода собиратесь искать товар',
					keyboard: keyboard([...methodSearch, ...menuMarkup]),
				})
			}

			ctx.scene.state.query = null
			ctx.scene.state.link = null
			ctx.scene.state.range = [0, Infinity]
			ctx.scene.state.sizeRange = []


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
			if (ctx.scene.step.firstTime || (!ctx.text && !ctx?.attachments[0]?.url))
			return ctx.send({
				message: '❗ Укажите ссылку на товар с сайта stockx.com, чтобы показать все объявления конкретного товара\n\nШаблон: stockx.com/*',
				keyboard: keyboard(previousMarkup),
			})

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(0)

			const link = convertURL(ctx.text || ctx?.attachments[0]?.url)
			
			const goodFromStockx = await getGoodFromStockx(link)
			if (!goodFromStockx)
				return ctx.send({
					message: `❗ Ссылка не ведет на товар с stockx.com, попробуйте еще раз.\n\nШаблон: stockx.com/*`,
					keyboard: keyboard(previousMarkup)
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
							'❗️Использовать фильтрацию по размеру? Введите нужные размеры через пробел в том формате, в котором они указаны на stockx.com. Если не уверены в правильности ввода, обратитесь к FAQ.\n\nПример ввода: 7 7Y 7W 11C 4K (это все разные размерные сетки)',
						keyboard: keyboard(skipMarkup),
					})
	
				if (ctx.text == 'Пропустить')
					return ctx.scene.step.next()
	
				const range = ctx.text.toUpperCase().split(' ')
				ctx.scene.state.sizeRange = range
	
				return ctx.scene.step.next()
			},
	// Фильтрация по цене
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message:
						'❗ Использовать фильтрацию по цене? Если да, то укажите диапазон.\n\nПример: 10000-200000',
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
				return ctx.send('Укажите диапазон в правильном формате \n\n❌ 10.000руб.-200.000руб.\n✔️ 10000-200000')
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

				try {
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
                        try {
                            ctx.send(`❗ По твоему запросу "${goodName}" найдены такие объявления:`)

                            let sendString = ''
                            let counter = 0;
        
                            const pages = []

                            searchedGoods.forEach((item, index) => {
                                const { sellerName, sellerId, city, size, price, _id} = item;
                
                                if (size)
                                    sendString += `📌 ${ sellerName }, ${city} (vk.com/id${sellerId})\nРазмер: ${size}, Цена: ${price}руб.\n\n`
                                else
                                    sendString += `📌 ${ sellerName }, ${city} (vk.com/id${sellerId})\nЦена: ${price}руб.\n\n`

                                counter += 1

                                if (counter >= 20 || searchedGoods.length - 1 == index) {
                                    pages.push(sendString)
                                    sendString = ''
                                    counter = 0
                                }
                            })

                            searchedGoods.forEach(async item => {
                                const { _id} = item;
                                await Good.findOneAndUpdate({ _id }, { $inc: { 'views': 1 } })
                            })

        
                            for (const page of pages)
                                await ctx.send(page)

                            await incrementSearch(ctx.senderId)
                        } catch (e) {
                            console.log(e)
                            ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                            return ctx.scene.leave()
                        }
					} else {
						ctx.send({
							message: `❗ Товар "${goodName}" никто не продает на нашей площадке. Попробуй воспользоваться поиском по названию или укажите другой размер.`,
						})
					}

					await BotConfig.updateOne(
						{
							$inc: { 'stats.countSearch': 1 }
						}
					)

					return ctx.scene.step.go(0)
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
				}
			}

			if (ctx.scene.state.query) {
				try {
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
                        try {
                            ctx.send(`❗ По твоему запросу "${ ctx.scene.state.query }" найдены такие объявления:\n\n`)
                
                            let sendString = ''
                            let counter = 0;
        
                            const pages = []

                            searchedGoods.forEach((item, index) => {
                                const { sellerName, sellerId, city, goodName, size, price, _id} = item;
                
                                if (size)
                                    sendString += `📌 ${ sellerName }, ${ city } (vk.com/id${ sellerId })\n${ goodName } | \nРазмер: ${ size }, Цена: ${ price }руб.\n\n`
                                else
                                    sendString += `📌 ${ sellerName }, ${ city } (vk.com/id${ sellerId })\n${ goodName } | Цена: ${ price }руб.\n\n`

                                counter += 1

                                if (counter >= 20 || searchedGoods.length - 1 == index) {
                                    pages.push(sendString)
                                    sendString = ''
                                    counter = 0
                                }
                            })

                            searchedGoods.forEach(async item => {
                                const { _id} = item;
                                await Good.findOneAndUpdate({ _id }, { $inc: { 'views': 1 } })
                            })

                            for (const page of pages)
                                await ctx.send(page)

                            await incrementSearch(ctx.senderId)
                        } catch (e) {
                            console.log(e)
                            ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                            return ctx.scene.leave()
                        }
					} else {
						ctx.send({
							message: `❗ К сожалению, по вашему запросу ${ctx.scene.state.query} ничего не найдено на нашей площадке. Попробуй воспользоваться поиском по названию или укажите другой размер.`, 
						})
					}

					await BotConfig.updateOne(
						{
							$inc: { 'stats.countSearch': 1 }
						}
					)

					return ctx.scene.step.go(0)
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
				}
			}
		},
	])	
]

export default searchScene
