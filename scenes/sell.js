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
import cityMarkup from '../markup/cityMarkup.js'
import previousMarkup from '../markup/previousMarkup.js'

import generateImage from '../utils/generateImage.js'
import getUserName from '../utils/getUserName.js'
import getGoodFromStockx from '../utils/getGoodFromStockx.js'
import convertURL from '../utils/convertURL.js'

const profileScene = [
	new StepScene('sell', [
		// Обработка ссылки
		async ctx => {
			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}

            // Мы нашли ваш товар?
            if (ctx.text == 'Нет')
                return ctx.send({
                    message:
                        '❗ Хорошо, можете попробовать еще раз указать ссылку на товар. В случае проблем обращайтесь к главному администратору',
                    keyboard: keyboard(menuMarkup),
                })
			try {
				const goodsOfUser = await Good.find({ sellerId: ctx.senderId })
				const user = await User.findOne({ userId: ctx.senderId })

				const countGoods = goodsOfUser.length
				const maxGoods = (await BotConfig.findOne()).maxGoods
				const extendedAccess = user.extendedAccess

				if (countGoods >= maxGoods && extendedAccess == false)
					return ctx.send({
						message: `❗ Вы превысили лимит выставления объявлений (${ countGoods }/${ maxGoods }). Удалите объявление, либо приобретите расширенный доступ, чтобы выставлять на продажу неограниченное количество товаров`,
						keyboard: keyboard(menuMarkup)	
					})


				ctx.scene.state.size = null

				if (ctx.scene.step.firstTime || (!ctx.text && !ctx?.attachments[0]?.url))
					return ctx.send({
						message:
							'❗ Для того чтобы выставить предмет на продажу — укажите ссылку на товар с сайта stockx.com\n\nШаблон: stockx.com/*',
						keyboard: keyboard(menuMarkup),
					})

                const link = ctx?.attachments[0]?.url || ctx.text

				ctx.scene.state.link = convertURL(link)
				ctx.scene.state.good = await getGoodFromStockx(ctx.scene.state.link)

				if (ctx.scene.state.good) ctx.scene.step.next()
				else
					ctx.send({
						message: `❗ Ссылка не ведет на товар с stockx.com, попробуйте еще раз.\n\nШаблон: stockx.com/*`,
						keyboard: keyboard(menuMarkup)
					})
			} catch (e) {
				console.log(e)
				ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
				return ctx.scene.leave()
			}
		},
		// Уточнение у пользователя
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text) {
				try {
					// const { imgUrl } = ctx.scene.state.good

					// const goodName = ctx.scene.state.good.name

					// const attachment = await vk.upload.messagePhoto({
					// 	peer_id: ctx.peerId,
					// 	source: {
					// 		value: imgUrl,
					// 	},
					// })

					// ctx.scene.state.attachment = attachment


					const { imgUrl, filename } = ctx.scene.state.good
					const goodName = ctx.scene.state.good.name
					const imgPath = `./images/${filename}.jpg`

					await generateImage(imgUrl, filename)
					ctx.scene.state.imgPath = imgPath

					const attachment = await vk.upload.messagePhoto({
						peer_id: ctx.peerId,
						source: {
							value: imgPath,
						},
					})

					ctx.scene.state.attachment = attachment



					ctx.send({
						message: `❗ Мы нашли твой товар?\n\n${goodName}`,
						attachment,
						keyboard: keyboard(answerMarkup),
					})
				} catch (e) {
                    console.log(e);
					ctx.send('Произошла какая-то ошибка.')
					ctx.scene.leave()
				}
				
			}

			if (ctx.text == 'Да')
				ctx.scene.step.next()

			if (ctx.text == 'Нет') {
				ctx.scene.step.go(0)
			}
		},
		// Указать размер
		async ctx => {
			const sizes = ctx.scene.state.good.allSizes

			if (ctx.scene.step.firstTime || !ctx.text) {
				if (sizes) {
					return ctx.send({
						message: `❗️ Теперь напиши размер. ВАЖНО! Писать в той размерности, которая указана у товара на stockx.com. Подробнее в FAQ.\n\n${ sizes.join(', ') }`,
						keyboard: keyboard(previousMarkup),
					})
				}
			}

			if (sizes) {
				if (ctx.text == 'Назад') {
					return ctx.scene.step.go(0)
				}

				if (!sizes.includes(ctx.text.toUpperCase())) {
					ctx.send(
						'❗ Выбранного вами размера не существует. Пожалуйста напишите размер предложенный из списка выше'
					)
				} else {
					ctx.scene.state.size = ctx.text.toUpperCase()
					ctx.scene.step.next()
				}
			} else
				ctx.scene.step.next()
		},
		// Указать стоимость
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text) {
				return ctx.send({
					message: '❗ Введите цену товара в рублях',
					keyboard: keyboard(previousMarkup),
				})
			}

			if (ctx.text == 'Назад' && !ctx.scene.state.good.allSizes) {
				return ctx.scene.step.go(0)
			} else if (ctx.text == 'Назад') {
				return ctx.scene.step.go(2)
			}

			// Находится ли в строке только цифры?
			const patternNumber = /^\d+$/
			if (patternNumber.test(ctx.text) == false)
				return ctx.send('❗ Укажите стоимость в правильном формате:\n\n❌ 10.000руб.\n✔️ 10000')

			if (+ctx.text > 10000000)
				return ctx.send('❗ Максимальная стоимость товара 10000000руб.')

			if (+ctx.text < 1)
				return ctx.send('❗ Минимальная стоимость товара 1руб.')

			ctx.scene.state.price = ctx.text
			ctx.scene.step.next()
		},
		// Указать город
		async ctx => {
			const msg = ctx.text.toLowerCase()

			if (ctx.scene.step.firstTime || !ctx.text) {
				return ctx.send({
					message:
						'❗️ Укажите город, в котором осуществляется продажа. Если города нет в списке, введите название вручную.',
					keyboard: keyboard([...cityMarkup, ...previousMarkup]),
				})
			}

			if (ctx.text == 'Назад') {
				return ctx.scene.step.go(3)
			}

			if (ctx.text.length > 20)
				return ctx.send('❗ Название города слишком длинное')

			ctx.scene.state.city = ctx.text

			ctx.scene.step.next()
		},
		// Уточнение правильно ли составлено обьявление и добавление товара в базу данных
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text) {
				const sizes = ctx.scene.state.good.allSizes
				let message = ``

				if (sizes) 
					message = `❗ Обявление составлено правильно?\n\nНаименование: ${ctx.scene.state.good.name}\nЦена: ${ctx.scene.state.price}руб.\nРазмер: ${ctx.scene.state.size}\nГород: ${ctx.scene.state.city}`
				else
					message = `❗ Обявление составлено правильно?\n\nНаименование: ${ctx.scene.state.good.name}\nЦена: ${ctx.scene.state.price}руб.\nГород: ${ctx.scene.state.city}`
				
				ctx.send({
					message,
					keyboard: keyboard(answerMarkup),
					attachment: ctx.scene.state.attachment,
				})
			}

			if (ctx.text == 'Да') {
				try {
					const { link, price, city } = ctx.scene.state
					const size = ctx.scene.state.size || null
					const goodName = ctx.scene.state.good.name
					const { imgUrl, filename } = ctx.scene.state.good

					const { firstname, lastname } = await getUserName(ctx.senderId)

					const goodObj = {
						sellerId: ctx.senderId,
						sellerName: `${ firstname } ${ lastname }`,
						goodName,
						imgUrl,
                        filename,
						link,
						size,
						price,
						city
					}

					const good = new Good(goodObj)
	
					await good.save()

					await BotConfig.updateOne(
						{
							$inc: { 'stats.countGoods': 1 }
						}
					)
	
					ctx.send({
						message: '❗ Товар успешно добавлен. Ты можешь увидеть свое объявление в пункте — Профиль',
						keyboard: keyboard(baseMarkup),
					})
	
					ctx.scene.step.next()					
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
				}
			}

			if (ctx.text == 'Нет') {
				ctx.scene.step.go(0)
			}
		},
	]),
]

export default profileScene
