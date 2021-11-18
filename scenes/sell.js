import '../mongodb.js'
import Good from '../models/Good.js'

import vk from '../commonVK.js'
import { StepScene } from '@vk-io/scenes'

import baseSendMessage from '../baseSendMessage.js'

import keyboard from '../markup/keyboard.js'

import answerMarkup from '../markup/answerMarkup.js'
import { baseMarkup } from '../markup/baseMarkup.js'
import menuMarkup from '../markup/menuMarkup.js'
import cityMarkup from '../markup/cityMarkup.js'
import previousMarkup from '../markup/previousMarkup.js'

import getUserName from '../utils/getUserName.js'
import getGoodFromStockx from '../utils/getGoodFromStockx.js'
import generateImage from '../utils/generateImage.js'
import convertURL from '../utils/convertURL.js'

const sellScene = [
	new StepScene('sell', [
		// Обработка ссылки
		async ctx => {
			ctx.scene.state.size = null

			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message:
						'❗ Для того чтобы выставить предмет на продажу — укажите ссылку на товар с сайта stockx.com\n\nПример: stockx.com/pants',
					keyboard: keyboard(menuMarkup),
				})

			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}

			ctx.scene.state.link = convertURL(ctx.text)
			ctx.scene.state.good = await getGoodFromStockx(ctx.scene.state.link)

			if (ctx.scene.state.good) ctx.scene.step.next()
			else
				ctx.send({
					message: `❗ Товар не найден по данной ссылке, попробуйте еще раз.\n\nШаблон: stockx.com/*`,
					keyboard: keyboard(menuMarkup)
				})
		},
		// Уточнение у пользователя
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text) {
				try {
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
						message: `❗ Теперь укажи размер. Пожалуйста, обрати внимание на то, что у женских и мужских моделей разная размерная сетка, поэтому пойми какой размер тебе нужен из списка на сайте:\n\n${ sizes.join(', ') }`,
						keyboard: keyboard(previousMarkup),
					})
				}
			}

			if (sizes) {
				if (ctx.text == 'Назад') {
					return ctx.scene.step.go(0)
				}

				if (!sizes.includes(ctx.text)) {
					ctx.send(
						'❗ Выбранного вами размера не существует. Пожалуйста напишите размер предложенный из списка выше'
					)
				} else {
					ctx.scene.state.size = ctx.text
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
				return ctx.send('Укажите стоимость в правильном формате:\n\n❌ 10.000руб.\n✔️ 10000')

			ctx.scene.state.price = ctx.text
			ctx.scene.step.next()
		},
		// Указать город
		async ctx => {
			const msg = ctx.text.toLowerCase()

			if (ctx.scene.step.firstTime || !ctx.text) {
				return ctx.send({
					message:
						'❗ Укажите город в котором осуществляется продажа.',
					keyboard: keyboard([...cityMarkup, ...previousMarkup]),
				})
			}

			if (ctx.text == 'Назад') {
				return ctx.scene.step.go(3)
			}

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
					attachment: ctx.scene.state.attachment ,
				})
			}

			if (ctx.text == 'Да') {
				try {
					const { link, price, city } = ctx.scene.state
					const size = ctx.scene.state.size || null
					const goodName = ctx.scene.state.good.name
					const filename = ctx.scene.state.good.filename

					const { firstname, lastname } = await getUserName(ctx.senderId)

					const goodObj = {
						sellerId: ctx.senderId,
						sellerName: `${ firstname } ${ lastname }`,
						goodName,
						filename,
						link,
						size,
						price,
						city
					}

					console.log()

					const good = new Good(goodObj)
	
					await good.save()
	
					ctx.send({
						message: '❗ Товар успешно добавлен. Ты можешь увидеть свое объявление в пункте — Мои объявления',
						keyboard: keyboard(baseMarkup),
					})
	
					ctx.scene.step.next()					
				} catch (e) {
					console.log(e)
					ctx.send('Произошла какая-то ошибка при сохранении товара')
					ctx.scene.leave()
				}
			}

			if (ctx.text == 'Нет') {
				ctx.send('❗ Возвращаю тебя к панели создания объявления')
				ctx.scene.step.go(0)
			}
		},
	]),
]

export default sellScene
