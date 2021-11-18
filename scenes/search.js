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

const searchScene = [
	new StepScene('search', [
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message:
						'❗ Для того чтобы найти необходимый предмет для покупки — укажите ссылку на товар с сайта stockx.com\n\nПример: stockx.com/pants',
					keyboard: keyboard(menuMarkup),
				})

			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}


			const link = convertURL(ctx.text)
			ctx.scene.state.link = link

			const searchedGoods = await Good.find({ link }).exec()



			if (searchedGoods.length) {
				const {	name } = await getGoodFromStockx(link)
				let sendString = `❗ По твоему запросу "${name}" найдены такие объявления:\n\n`
	
				searchedGoods.forEach((item, index) => {
					const { sellerName, sellerId, city, size, price} = item
	
					if (size)
						sendString += `📌 ${ sellerName }, ${city} (vk.com/id${sellerId})\nРазмер: ${size}, Цена: ${price}руб.\n\n`
					else
						sendString += `📌 ${ sellerName }, ${city} (vk.com/id${sellerId})\nЦена: ${price}руб.\n\n`
				})

				ctx.send(sendString)
				
				return ctx.scene.leave()
			} else {
				ctx.send('Товаров нет')
				return ctx.scene.leave()
			}

			if (ctx.scene.state.good) ctx.scene.step.next()
			else
				ctx.send({
					message: `❗ Товар не найден по данной ссылке, попробуйте еще раз.\n\nШаблон: stockx.com/*`,
					keyboard: keyboard(menuMarkup)
				})
		},
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
		async ctx => {
			const sizes = ctx.scene.state.good.allSizes

			if (ctx.scene.step.firstTime || !ctx.text) {
				if (sizes) {
					return ctx.send({
						message: `❗ Теперь укажи размер который тебе подходит. Пожалуйста, обрати внимание на то, что у женских и мужских моделей разная размерная сетка, поэтому пойми какой размер тебе нужен из списка на сайте:\n\n${ sizes.join(', ') }`,
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
		async ctx => {
			ctx.send('Good')
		}
	])	
]

export default searchScene
