import '../mongodb.js'
import Good from '../models/Good.js'
import User from '../models/User.js'
import BotConfig from '../models/BotConfig.js'

import vk from '../commonVK.js'
import { StepScene } from '@vk-io/scenes'

import baseSendMessage from '../baseSendMessage.js'

import keyboard from '../markup/keyboard.js'

import { baseMarkup } from '../markup/baseMarkup.js'
import { myAdsMarkup, myAdsMarkupNotSize } from '../markup/myAdsMarkup.js'
import menuMarkup from '../markup/menuMarkup.js'
import previousMarkup from '../markup/previousMarkup.js'
import answerMarkup from '../markup/answerMarkup.js'

import getGoodFromStockx from '../utils/getGoodFromStockx.js'
import generateImage from '../utils/generateImage.js'
import { resetSearchInfo } from '../utils/updateSearchInfo.js'

const myAds = [
	new StepScene('profile', [
		// Показ объявлений
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text || ctx.scene.state.isDelete) {
				try {
					const goods = await Good.find({ sellerId: ctx.senderId }).exec()
					ctx.scene.state.goods = goods

					const botConfig = (await BotConfig.findOne())

					const countGoods = goods.length
					const leftGoods = botConfig.maxGoods - countGoods

					const user = await User.findOne({ userId: ctx.senderId }).exec()

					const countSearch = user.searchInfo.count
					const leftSearch = botConfig.maxSearch - user.searchInfo.count
					const extendedAccess = user.extendedAccess

					const lastSearch = user.searchInfo.lastSearch
					const cooldownSearch = process.env.COOLDOWN_SEARCH

					let sendString = ''

					if (lastSearch && Date.now() - lastSearch.getTime() >= cooldownSearch) {
						await resetSearchInfo(ctx.senderId)
						sendString += `❗ Вам снова доступно 3 новых поиска!\n\n`
					}

					if (extendedAccess) {
						sendString += `❗ Профиль\nОбъявлений: ${ countGoods } (осталось ∞)\nПоисков: ${ countSearch } (осталось ∞)\nВы имеете расширенный доступ в котором нет ограничений\n\n`
					} else {
						sendString += `❗ Профиль\nОбъявлений: ${ countGoods } (осталось ${ leftGoods })\nПоисков: ${ countSearch } (осталось ${ leftSearch })\n\n❗ Для снятия ограничений — оформите расширенный доступ\n\n`
					}

					if (goods.length === 0) {
						ctx.send({
							message: sendString + '❗ У вас отсутствуют объявления. Попробуйте создать их с помощью кнопки — Продать',
							keyboard: keyboard(baseMarkup),
						})
						return ctx.scene.leave()
					}

                    ctx.send(sendString)

                    sendString = ''
                    let counter = 0;

                    const pages = []

					goods.forEach((item, index) => {
						const { goodName, size, price, city, views } = item

						if (size)
							sendString += `[${index}] ${goodName}\n${size} | ${price}руб. | ${city} | ${views} показов\n\n`
						else
							sendString += `[${index}] ${goodName}\n${price}руб. | ${city} | ${views} показов\n\n`

                        counter += 1

                        if (counter >= 20 || goods.length - 1 == index) {
                            pages.push(sendString)
                            sendString = ''
                            counter = 0
                        }
					})

                    for (const page of pages)
                        ctx.send(page)

                    ctx.send({
                        message: '❗ Ваши объявления. Введите номер (он указан в начале), чтобы отредактировать или удалить объявление',
                        keyboard: keyboard(menuMarkup),
                    })

					ctx.scene.state.isDelete = false
					ctx.scene.state.selectedGood = null
					ctx.scene.state.newGood = null

					return 
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
				}
			}

			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}

			if (ctx.scene.state.goods[+ctx.text]) {
				ctx.scene.step.next()
			} else {
				ctx.send({
					message: '❗ Укажите действительный номер объявления',
					keyboard: keyboard(menuMarkup),
				})
			}
		},
		// Выбранный товар
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text) {
				let goods = null
				let selectedGood = null

				if (!ctx.scene.state.newGood) {
					goods = ctx.scene.state.goods
					selectedGood = goods[+ctx.text]
					ctx.scene.state.selectedGood = selectedGood
					ctx.scene.state.newGood = JSON.parse(JSON.stringify(selectedGood));
				}

				let sendString = '❗ Используйте кнопки, чтобы редактировать объявление\n\n'

				const { goodName, size, price, city } = ctx.scene.state.selectedGood
				if (ctx.scene.state.selectedGood.size)
					sendString += `${goodName}\n${size} | ${price}руб. | ${city}\n\n`
				else sendString += `${goodName}\n${price}руб. | ${city}\n\n`

				const markup = ctx.scene.state.selectedGood.size ? myAdsMarkup : myAdsMarkupNotSize

				return ctx.send({
					message: sendString,
					keyboard: keyboard(markup),
				})
			}

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(0)

			if (ctx.text == 'Удалить') {
				try {
					await Good.deleteOne({ _id: ctx.scene.state.selectedGood._id })

					await BotConfig.updateOne(
						{
							$inc: { 'stats.countDelete': 1 }
						}
					)

					// Если товар был один
					if (ctx.scene.state.goods.length == 1) {
						ctx.send({
							message: '❗ Товар успешно удален. У тебя нет больше товаров ',
							keyboard: keyboard(baseMarkup)
						})
						return ctx.scene.leave()
					} else {
						ctx.send('❗ Товар успешно удален')
						ctx.scene.state.isDelete = true
						return ctx.scene.step.go(0)
					}
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к администратору')
					return ctx.scene.leave()
				}
			}

			if (ctx.text == 'Цена')
				return ctx.scene.step.go(3)

			if (ctx.text == 'Размер' && ctx.scene.state.selectedGood.size)
				return ctx.scene.step.go(2)

			ctx.send('❗ Я тебя не понимаю, используй кнопки для управления объявлением')
		},
		// Размер
		async ctx => {
			if (!ctx.scene.state.selectedGood.size)
				return ctx.scene.step.next()

			if (ctx.scene.step.firstTime || !ctx.text) {
				try {
					const selectedGood = ctx.scene.state.selectedGood
					const goodFromStockx = await getGoodFromStockx(
						selectedGood.link
					)
					ctx.scene.state.selectedGoodFromStocx = goodFromStockx

					if (selectedGood.size)
						return ctx.send({
							message: `❗ Укажите новый размер для товара:\n\n${ goodFromStockx.allSizes.join(', ') }`,
							keyboard: keyboard(previousMarkup),
						})
					else return ctx.scene.step.next()
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
				}
			}

			if (ctx.text == 'Назад') {
				return ctx.scene.step.go(1)
			}

			const selectedGoodFromStocx = ctx.scene.state.selectedGoodFromStocx

			if (ctx.scene.state.selectedGood.size == ctx.text)
				return ctx.send({
					message: '❗ Вы указали размер который и так указан в объявлении, укажите другой',
					keyboard: keyboard(previousMarkup),
				})
				
			if (!selectedGoodFromStocx.allSizes.includes(ctx.text.toUpperCase())) {
				ctx.send({
					message:
						'Выбранного вами размера не существует. Пожалуйста напишите размер предложенный из списка выше',
					keyboard: keyboard(previousMarkup),
				})
			} else {
				ctx.scene.state.newGood.size = ctx.text.toUpperCase()
				ctx.scene.step.go(4)
			}
		},
		// Цена
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text) {
				return ctx.send({
					message:
						'❗ Укажите новую стоимость товара в рублях.',
					keyboard: keyboard(previousMarkup),
				})
			}

			if (ctx.text == 'Назад') {
				return ctx.scene.step.go(1)
			}

			if (+ctx.scene.state.selectedGood.price == +ctx.text)
				return ctx.send({
					message: '❗ Вы указали размер который и так указан в объявлении, укажите другой',
					keyboard: keyboard(previousMarkup),
				})

			const patternNumber = /^\d+$/
			if (patternNumber.test(ctx.text) == false)
				return ctx.send(
					'❗ Укажите стоимость в правильном формате:\n\n❌ 10.000руб.\n✔️ 10000'
				)

			if (+ctx.text > 10000000)
				return ctx.send('❗ Максимальная стоимость товара 10000000руб.')

			if (+ctx.text < 1)
				return ctx.send('❗ Минимальная стоимость товара 1руб.')

			ctx.scene.state.newGood.price = ctx.text
			ctx.scene.step.next()
		},
		// Уточнение по изменению товара
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text) {
				try {
					// const { imgUrl, goodName } = ctx.scene.state.selectedGood

                    // const attachment = await vk.upload.messagePhoto({
					// 	peer_id: ctx.peerId,
					// 	source: {
					// 		value: imgUrl,
					// 	},
					// })

                    const { imgUrl, filename, goodName } = ctx.scene.state.selectedGood
					const imgPath = `./images/${filename}.jpg`

					await generateImage(imgUrl, filename)
					ctx.scene.state.imgPath = imgPath

					const attachment = await vk.upload.messagePhoto({
						peer_id: ctx.peerId,
						source: {
							value: imgPath,
						},
					})

					const oldSize = ctx.scene.state.selectedGood.size
					const oldPrice = ctx.scene.state.selectedGood.price
					const newSize = ctx.scene.state.newGood.size
					const newPrice = ctx.scene.state.newGood.price

					let strOldItem = ''
					let strNewItem = ''

					if (oldSize) {
						strOldItem = `Старое | Размер: ${ oldSize } Стоимость: ${ oldPrice }руб.`
						strNewItem = `Новое | Размер: ${ newSize } Стоимость: ${ newPrice }руб.`
					} else {
						strOldItem = `Старое | Стоимость: ${ oldPrice }`
						strNewItem = `Новое | Стоимость: ${ newPrice }`
					}

					return ctx.send({
						message: `❗ Проверьте старое и измененное объявление. Все верно?\n\n${goodName}\n\n${strOldItem}\n${strNewItem}`,
						attachment,
						keyboard: keyboard(answerMarkup),
					})
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка.')
					ctx.scene.leave()
				}
			}

			if (ctx.text == 'Да') {
				try {
					const { _id, size, price } = ctx.scene.state.newGood
	
					await Good.findOneAndUpdate({'_id': _id }, { size, price }, {upsert: true});
					
					ctx.send('❗ Товар успешно изменен')
					return ctx.scene.step.go(0)
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
				}
			}

			if (ctx.text == 'Нет') {
				ctx.send('❗ Возвращаю тебя к панели редактирования объявления')
				ctx.scene.step.go(1)
			}
		},
	]),
]

export default myAds
