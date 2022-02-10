import config from 'config'

import Good from '../models/Good'
import User from '../models/User'
import CachedGood from '../models/CachedGood'
import BotConfig from '../models/BotConfig'

import vk from '../commonVK'
import { StepScene } from '@vk-io/scenes'

import baseSendMessage from '../baseSendMessage'

import keyboard from '../markup/keyboard'

import answerMarkup from '../markup/answerMarkup'
import { baseMarkup } from '../markup/baseMarkup'
import menuMarkup from '../markup/menuMarkup'
import cityMarkup from '../markup/cityMarkup'
import previousMarkup from '../markup/previousMarkup'

import generateImage from '../utils/generateImage'
import getUserName from '../utils/getUserName.js'
import getGoodFromStockx from '../utils/getGoodFromStockx'
import convertURL from '../utils/convertURL'

const sellScene = [
	new StepScene('sell', [
		// Обработка ссылки
		async ctx => {
            // Сброс выбранных параметров
            ctx.scene.state.selectedSizes = null
            ctx.scene.state.selectedPrices = null
            ctx.scene.state.hasDelivery = null
            ctx.scene.state.hasFitting = null

            // Приветственное сообщение
            if (ctx.scene.step.firstTime || (!ctx.text && !ctx?.attachments[0]?.url))
                return ctx.send({
                    message: '❗ Для того чтобы выставить предмет на продажу — укажите ссылку на товар с сайта stockx.com\n\nШаблон: stockx.com/*',
                    keyboard: keyboard(menuMarkup),
                })

			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}

            // Мы нашли ваш товар?
            if (ctx.text == 'Нет')
                return ctx.send({
                    message: '❗ Хорошо, можете попробовать еще раз указать ссылку на товар. В случае проблем обращайтесь к главному администратору',
                    keyboard: keyboard(menuMarkup),
                })

			try {
				const goodsOfUser = await Good.find({ sellerId: ctx.senderId })
				const user = await User.findOne({ userId: ctx.senderId })

				const countGoods = goodsOfUser.length
				const maxGoods = (await BotConfig.findOne()).maxGoods
				const extendedAccess = user.extendedAccess
                
                ctx.scene.state.countGoods = countGoods
                ctx.scene.state.maxGoods = maxGoods
                ctx.scene.state.extendedAccess = extendedAccess

				if (countGoods >= maxGoods && extendedAccess == false)
					return ctx.send({
						message: `❗ Ты превысил лимит выставления объявлений (${ countGoods }/${ maxGoods }). Удали объявление, либо приобрети расширенный доступ, чтобы выставлять на продажу неограниченное количество товаров`,
						keyboard: keyboard(menuMarkup)	
					})

                // Заменить эмодзи на emoji текст
                const regexEmoji = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
                const deletedEmoji = ctx.text?.replace(regexEmoji, 'emoji');
               
                const unFormattedLink = ctx?.attachments[0]?.url || deletedEmoji
                const link = convertURL(unFormattedLink)
                ctx.scene.state.link = link
                
                // Кэширование товаров
                const cachedGood = await CachedGood.findOne({ url: link })
                if (cachedGood) {
                    ctx.scene.state.good = cachedGood
                } else {
                    ctx.scene.state.good = await getGoodFromStockx(link)
                    
                    if (!ctx.scene.state.good) 
                        return ctx.send({
                            message: `❗ Ссылка не ведет на товар с stockx.com, попробуй еще раз.\n\nШаблон: stockx.com/*`,
                            keyboard: keyboard(menuMarkup)
                        })

                    const newCachedGood = new CachedGood({ ...ctx.scene.state.good })
                    await newCachedGood.save()
                }

                // Проверка безразмерного товара на наличие в продаже
                const allSizes = ctx.scene.state.good.allSizes
                if (allSizes === null) {
                    const checkRepeatGood = await Good.findOne({ sellerId: ctx.peerId, link })

                    if (checkRepeatGood)
                        return ctx.send({
                            message: `❗ У тебя уже есть этот товар на продаже. Попробуй еще раз`,
                            keyboard: keyboard(menuMarkup)
                        })
                }

				if (ctx.scene.state.good) 
                    ctx.scene.step.next()
				else
					return ctx.send({
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

            if (!sizes?.length)
                return ctx.scene.step.next()

            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: `❗️ Теперь напиши размер. ЕСЛИ хочешь добавить несколько пар сразу, введи размеры через пробел. ВАЖНО! Писать в той размерности, которая указана у товара на stockx.com. Подробнее в FAQ\n\nДоступные размеры:\n${ sizes.join(' ') }`,
                    keyboard: keyboard(previousMarkup),
                })

            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

            const mappedSizes = sizes.map(size => size.toUpperCase())
            const selectedSizes = ctx.text.split(' ').map(size => size.toUpperCase())

            const { countGoods, maxGoods, extendedAccess } = ctx.scene.state
            const countSelectedGoods = selectedSizes?.length

            if (countGoods + countSelectedGoods > maxGoods && extendedAccess == false)
                return ctx.send({
                    message: `❗ Ты не можешь выставить столько объявлений, тогда у тебя будет превышен лимит товаров (${ countGoods +  countSelectedGoods}/${ maxGoods }). Доступно для продажи: ${maxGoods - countGoods}. Удали ненужные/проданные объявления, либо приобрети расширенный доступ, чтобы выставлять на продажу неограниченное количество товаров.\n\nДоступные размеры:\n${ sizes.join(' ') }`,
                    keyboard: keyboard(previousMarkup)	
                })

            const existingGoods = await Good.find({ sellerId: ctx.senderId, link: ctx.scene.state.link })
            const existingSizes = existingGoods.map(good => good.size)

            for (const selectedSize of selectedSizes) {
                if (!mappedSizes.includes(selectedSize))
                    return ctx.send({
                        message: `❗️ Неправильный формат ввода. Примеры ниже. ЕСЛИ выставляешь несколько товаров, каждый размер через пробел\n\nДоступные размеры:\n${ sizes.join(' ') }`,
                        keyboard: keyboard(previousMarkup)
                    })

                const checkRepeatSize = existingSizes.some(existingSize => existingSize == selectedSize)
                if (checkRepeatSize)
                    return ctx.send({
                        message: `❗ У тебя уже выставлен этот товар с размером ${selectedSize}. Попробуй указать другой размер\n\nДоступные размеры:\n${ sizes.join(' ') }`,
                        keyboard: keyboard(previousMarkup)	
                    })

                const checkRepeatSizeInMessage = selectedSizes.filter(size => selectedSize == size).length > 1
                if (checkRepeatSizeInMessage)
                    return ctx.send({
                        message: `❗ Ты пытаешься выставить товары с одинаковыми размерами.\n\nДоступные размеры:\n${ sizes.join(' ') }`,
                        keyboard: keyboard(previousMarkup)	
                    })
            }

            ctx.scene.state.selectedSizes = selectedSizes
            ctx.scene.step.next()
		},
		// Указать стоимость
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗ Введи цену товара в рублях. ЕСЛИ ты выставил несколько размеров, введи цену на каждый товар через пробел в той же последовательности.\n\nПример:\n1000\n23500 25000 (если указал 2 размера)',
					keyboard: keyboard(previousMarkup),
				})

			if (ctx.text == 'Назад' && !ctx.scene.state.good.allSizes) {
				return ctx.scene.step.go(0)
			} else if (ctx.text == 'Назад') {
				return ctx.scene.step.go(2)
			}

            const selectedPrices = ctx.text.split(' ')
            for (const selectedPrice of selectedPrices) {
                // Находится ли в строке только цифры?
                const patternNumber = /^\d+$/
                if (patternNumber.test(selectedPrice) == false)
                    return ctx.send({
                        message: '❗ Укажите стоимость в правильном формате:\n\n❌ 10.000руб.\n✅ 10000\n❌ 10.000руб. 12.000руб.\n✅ 10000 12000',
                        keyboard: keyboard(previousMarkup)
                })

                if (+selectedPrice > 10000000)
                    return ctx.send({
                        message: '❗ Максимальная стоимость товара 10000000руб. Попробуй еще раз',
                        keyboard: keyboard(previousMarkup)
                    })

                if (+selectedPrice < 1)
                    return ctx.send({
                        message: '❗ Минимальная стоимость товара 1руб. Попробуй еще раз',
                        keyboard: keyboard(previousMarkup)
                    })
            }

            const selectesSizes = ctx.scene.state.selectedSizes

            const allSizes = ctx.scene.state.good.allSizes
            if (allSizes == null && selectedPrices.length > 1) {
                return ctx.send({
                    message: '❗ Ты указал несколько ценников. На площадке ты можешь выставить 1 объявление конкретного товара, за исключением если у товара несколько размеров. Попробуй еще',
                    keyboard: keyboard(previousMarkup),
                })
            }

            if (selectedPrices.length !== selectesSizes?.length && allSizes) {
                return ctx.send({
                    message: `❗ Количество ценников не равняется количеству выбранных размеров. Попробуй еще раз\n\nВыбранные размеры: ${selectesSizes.join(', ')}\nКоличество выбранных размеров: ${selectesSizes.length}`,
                    keyboard: keyboard(previousMarkup),
                })                
            }

			ctx.scene.state.selectedPrices = selectedPrices
			ctx.scene.step.next()
		},
		// Указать город
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗️ Укажите город, в котором осуществляется продажа. Если города нет в списке, введите название вручную.',
					keyboard: keyboard([...cityMarkup, ...previousMarkup]),
				})

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(3)

			if (ctx.text.length > 20)
				return ctx.send('❗ Название города слишком длинное')

			ctx.scene.state.city = ctx.text

			ctx.scene.step.next()
		},
        // Указать возможность доставки
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗️ Укажите, доступна ли доставка',
					keyboard: keyboard([...answerMarkup, ...previousMarkup]),
				})

            switch (ctx.text) {
                case 'Назад':
                    return ctx.scene.step.go(4)
                case 'Да':
                    ctx.scene.state.hasDelivery = '✅'
                    break
                case 'Нет':
                    ctx.scene.state.hasDelivery = '❌'
                    break
                default:
                    return
            }

			ctx.scene.step.next()
		},
        // Указать возможность примерки
		async ctx => {
            // Примерка доступна если у товара есть размер
            if (ctx.scene.state.selectedSizes?.length) {
                if (ctx.scene.step.firstTime || !ctx.text)
                    return ctx.send({
                        message: '❗️ Укажите, доступна ли примерка',
                        keyboard: keyboard([...answerMarkup, ...previousMarkup]),
                    })

                switch (ctx.text) {
                    case 'Назад':
                        return ctx.scene.step.go(5)
                    case 'Да':
                        ctx.scene.state.hasFitting = '✅'
                        break
                    case 'Нет':
                        ctx.scene.state.hasFitting = '❌'
                        break
                    default:
                        return
                }
            }

			ctx.scene.step.next()
		},
		// Уточнение правильно ли составлено обьявление и добавление товара в базу данных
		async ctx => {
            const { link, selectedPrices, selectedSizes, city, hasFitting, hasDelivery } = ctx.scene.state
            const { name: goodName, allSizes, imgUrl, filename } = ctx.scene.state.good

            const formattedSelectedSizes = selectedSizes ? selectedSizes.join(', ') : null
            const formattedSelectedPrices = selectedPrices.join('руб., ')

			if (ctx.scene.step.firstTime || !ctx.text) {
				let message = ``

                const questionClarification = selectedPrices.length > 1 ? 'Объявления составлены правильно?' : 'Объявление составлено правильно?'
                const wordPrice = selectedPrices.length > 1 ? 'Цены' : 'Цена'
                const wordSize = selectedSizes?.length > 1 ? 'Размеры' : 'Размер'

				if (allSizes) 
					message = `❗ ${questionClarification}\n\nНаименование: ${goodName}\n${wordPrice}: ${formattedSelectedPrices}руб.\n${wordSize}: ${formattedSelectedSizes}\nГород: ${city}\nПримерка: ${hasFitting}\nДоставка: ${hasDelivery}`
				else
					message = `❗ ${questionClarification}\n\nНаименование: ${goodName}\n${wordPrice}: ${formattedSelectedPrices}руб.\nГород: ${city}\nДоставка: ${hasDelivery}`

				ctx.send({
					message,
					keyboard: keyboard(answerMarkup),
					attachment: ctx.scene.state.attachment,
				})
			} else {
                if (ctx.text == 'Да') {
                    try {
                        const { firstname, lastname } = await getUserName(ctx.senderId)

                        const goods = []

                        for (let i = 0; i < selectedPrices.length; i++) {
                            const size = allSizes ? selectedSizes[i] : null
                            const price = selectedPrices[i]

                            const goodParams = {
                                sellerId: ctx.senderId,
                                sellerName: `${ firstname } ${ lastname }`,
                                goodName,
                                imgUrl,
                                filename,
                                link,
                                size,
                                price,
                                city,
                                hasDelivery,
                                hasFitting
                            }
        
                            goods.push(goodParams)
                        }


                        goods.forEach(async good => await(new Good(good)).save())

                        await BotConfig.updateOne({ $inc: { 'stats.countGoods': goods.length } })

                        if (config.has('messages.sell.after'))
                            ctx.send(config.get('messages.sell.after'))

                        if (goods.length > 1)
                            ctx.send({
                                message: '❗ Товары успешно добавлены. Ты можешь увидеть свои объявления в пункте — Профиль',
                                keyboard: keyboard(baseMarkup),
                            })
                        else
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
    
                if (ctx.text == 'Нет')
                    ctx.scene.step.go(0)
            }
		},
	]),
]

export default sellScene
