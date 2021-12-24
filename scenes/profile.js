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
						sendString += `❗ Теье снова доступно 3 новых поиска!\n\n`
					}

					if (extendedAccess)
						sendString += `❗ Профиль\nОбъявлений: ${ countGoods } (осталось ∞)\nПоисков: ${ countSearch } (осталось ∞)\nВы имеете расширенный доступ в котором нет ограничений\n\n`
					else
						sendString += `❗ Профиль\nОбъявлений: ${ countGoods } (осталось ${ leftGoods })\nПоисков: ${ countSearch } (осталось ${ leftSearch })\n\n❗ Для снятия ограничений — оформите расширенный доступ\n\n`

					if (goods.length === 0) {
						ctx.send({
							message: sendString + '❗ У тебя отсутствуют объявления. Попробуй создать их с помощью кнопки — Продать',
							keyboard: keyboard(baseMarkup),
						})
						return ctx.scene.leave()
					}

                    ctx.send(sendString)

                    sendString = ''
                    let counter = 0;

                    const pages = []

					goods.forEach((item, index) => {
						const { goodName, size, price, city, views, hasDelivery, hasFitting } = item

						if (size)
							sendString += `[${index}] ${goodName}\n${size} | ${price}руб. | ${city} | Доставка: ${hasDelivery} | Примерка: ${hasFitting} | ${views} показов\n\n`
						else
							sendString += `[${index}] ${goodName}\n${price}руб. | ${city} | Доставка: ${hasDelivery} | ${views} показов\n\n`

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
					ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
					return ctx.scene.leave()
				}
			}

			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}

			if (ctx.scene.state.goods[+ctx.text])
				ctx.scene.step.next()
			else
				ctx.send({
					message: '❗ Укажи действительный номер объявления',
					keyboard: keyboard(menuMarkup),
				})
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

				let sendString = '❗ Используй кнопки, чтобы редактировать объявление\n\n'

				const { goodName, size, price, city, hasDelivery, hasFitting } = ctx.scene.state.selectedGood
				if (ctx.scene.state.selectedGood.size)
					sendString += `${goodName}\n${size} | ${price}руб. | ${city} | Доставка: ${hasDelivery} | Примерка: ${hasFitting}\n\n`
				else sendString += `${goodName}\n${price}руб. | ${city}| Доставка: ${hasDelivery}\n\n`

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

					await BotConfig.updateOne({
							$inc: { 'stats.countDelete': 1 }
					})

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
					ctx.send('❗ Произошла какая-то ошибка, обратись к администратору')
					return ctx.scene.leave()
				}
			}

			if (ctx.text == 'Размер' && ctx.scene.state.selectedGood.size)
				return ctx.scene.step.go(2)

            if (ctx.text == 'Цена')
				return ctx.scene.step.go(3)
            
            if (ctx.text == 'Доставка')
				return ctx.scene.step.go(4)

            if (ctx.text == 'Примерка' && ctx.scene.state.selectedGood.size)
				return ctx.scene.step.go(4)
		},
		// Размер
		async ctx => {
			if (!ctx.scene.state.selectedGood.size)
				return ctx.scene.step.next()

			if (ctx.scene.step.firstTime || !ctx.text) {
				try {
					const selectedGood = ctx.scene.state.selectedGood
					const goodFromStockx = await getGoodFromStockx(selectedGood.link)

					ctx.scene.state.selectedGoodFromStocx = goodFromStockx

					if (selectedGood.size)
						return ctx.send({
							message: `❗ Укажи новый размер для товара:\n\n${ goodFromStockx.allSizes.join(' ') }`,
							keyboard: keyboard(previousMarkup),
						})
					
                    return ctx.scene.step.next()
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
					return ctx.scene.leave()
				}
			}

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(1)

			const selectedGoodFromStocx = ctx.scene.state.selectedGoodFromStocx

            if (/us|,/i.test(ctx.text))
                return ctx.send({
                    message: `❗ Размер указывается без приставки US. Если размер нецелочисленный, то он разделяется точкой, а не запятой. Внимательно ознакомься с руководством и выбери размер из списка ниже\n\n${ selectedGoodFromStocx.allSizes.join(' ') }`,
                    keyboard: keyboard(previousMarkup)
                })

			if (ctx.scene.state.selectedGood.size == ctx.text.toUpperCase())
				return ctx.send({
					message: `❗ Ты указал размер который и так указан в объявлении, попробуй указать другой из списка ниже\n\n${ selectedGoodFromStocx.allSizes.join(' ') }`,
					keyboard: keyboard(previousMarkup),
				})
				
			if (!selectedGoodFromStocx.allSizes.includes(ctx.text.toUpperCase()))
				return ctx.send({
					message: `❗ Выбранного тобой размера не существует. Напиши размер предложенный из списка ниже\n\n${ selectedGoodFromStocx.allSizes.join(' ') }`,
					keyboard: keyboard(previousMarkup),
				})

            ctx.scene.state.newGood.size = ctx.text.toUpperCase()
            ctx.scene.step.go(6)
		},
		// Цена
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message:
						'❗ Укажи новую стоимость товара в рублях',
					keyboard: keyboard(previousMarkup),
				})

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(1)

			if (+ctx.scene.state.selectedGood.price == +ctx.text)
				return ctx.send({
					message: '❗ Ты указал стоимость которая и так указана в объявлении, попробуй указать другую',
					keyboard: keyboard(previousMarkup),
				})

			const patternNumber = /^\d+$/
			if (patternNumber.test(ctx.text) == false)
				return ctx.send('❗ Укажи стоимость в правильном формате:\n\n❌ 10.000руб.\n✔️ 10000')

			if (+ctx.text > 10000000)
				return ctx.send('❗ Максимальная стоимость товара 10000000руб.')

			if (+ctx.text < 1)
				return ctx.send('❗ Минимальная стоимость товара 1руб.')

			ctx.scene.state.newGood.price = ctx.text
			ctx.scene.step.go(6)
		},
        // Доставка
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗ Укажите, доступна ли доставка',
					keyboard: keyboard([...answerMarkup, ...previousMarkup]),
				})

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(1)

			if (ctx.scene.state.selectedGood.hasDelivery == ctx.text)
				return ctx.send({
					message: '❗ Ты указал параметр который и так был указан в объявлении. Попробуй выбрать другой или вернись назад\n\n❗ Укажите, доступна ли доставка',
					keyboard: keyboard([...answerMarkup, ...previousMarkup]),
				})

            if (ctx.text == 'Да')
                ctx.scene.state.newGood.hasDelivery = '✔️'
            else if (ctx.text == 'Нет')
                ctx.scene.state.newGood.hasDelivery = '❌'
            else 
                return

            ctx.scene.step.go(6)
		},
        // Примерка
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗ Укажите, доступна ли примерка',
					keyboard: keyboard([...answerMarkup, ...previousMarkup]),
				})

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(1)

			if (ctx.scene.state.selectedGood.hasFitting== ctx.text)
				return ctx.send({
					message: '❗ Ты указал параметр который и так был указан в объявлении. Попробуй выбрать другой или вернись назад\n\n❗ Укажите, доступна ли доставка',
					keyboard: keyboard([...answerMarkup, ...previousMarkup]),
				})

            if (ctx.text == 'Да')
                ctx.scene.state.newGood.hasFitting = '✔️'
            else if (ctx.text == 'Нет')
                ctx.scene.state.newGood.hasFitting = '❌'
            else 
                return

            ctx.scene.step.go(6)
		},
		// Уточнение по изменению товара
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text) {
				try {
                    const { imgUrl, filename } = ctx.scene.state.selectedGood
					await generateImage(imgUrl, filename)

					const attachment = await vk.upload.messagePhoto({
						peer_id: ctx.peerId,
						source: { value: `./images/${filename}.jpg` }
					})

                    const selectedGood = ctx.scene.state.selectedGood
                    const newGood = ctx.scene.state.newGood

					let strOldItem = ''
					let strNewItem = ''

                    if (selectedGood.size) {
                        strOldItem = `❗ Старое:\nЦена: ${selectedGood.price}руб.\nРазмер: ${selectedGood.size}\nГород: ${selectedGood.city}\nПримерка: ${selectedGood.hasFitting}\nДоставка: ${selectedGood.hasDelivery}\n\n`
                        strNewItem = `❗ Новое:\nЦена: ${newGood.price}руб.\nРазмер: ${newGood.size}\nГород: ${newGood.city}\nПримерка: ${newGood.hasFitting}\nДоставка: ${newGood.hasDelivery}`
                    } else {
                        strOldItem = `❗ Старое:\nЦена: ${selectedGood.price}руб.\nГород: ${selectedGood.city}\nДоставка: ${selectedGood.hasDelivery}\n\n`
                        strNewItem = `❗ Новое:\nЦена: ${newGood.price}руб.\nГород: ${newGood.city}\nДоставка: ${newGood.hasDelivery}`
                    }

					return ctx.send({
						message: `❗ Проверь старое и измененное объявление. Применить изменения?\n\nНаименование: ${selectedGood.goodName}\n\n${strOldItem}\n${strNewItem}`,
						attachment,
						keyboard: keyboard(answerMarkup),
					})
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
					ctx.scene.leave()
				}
			}

			if (ctx.text == 'Да') {
				try {
					const newGood = ctx.scene.state.newGood
	
					await Good.findOneAndUpdate({'_id': newGood._id }, newGood);
					
					ctx.send('❗ Товар успешно изменен')

					return ctx.scene.step.go(0)
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
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
