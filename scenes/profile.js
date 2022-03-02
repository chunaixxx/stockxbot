import config from 'config'

import Good from '../models/Good'
import MailingUser from '../models/MailingUser'
import BotConfig from '../models/BotConfig'

import vk from '../commonVK'
import { StepScene } from '@vk-io/scenes'

import baseSendMessage from '../baseSendMessage'

import keyboard from '../markup/keyboard'

import { baseMarkup } from '../markup/baseMarkup'
import { myAdsMarkup, myAdsMarkupNotSize, mainMenuProfile, allAdsSettings, profileNext, subsribeMailing, unsubsribeMailing } from '../markup/myAdsMarkup'
import menuMarkup from '../markup/menuMarkup'
import previousMarkup from '../markup/previousMarkup'
import answerMarkup from '../markup/answerMarkup'

import getGoodFromStockx from '../utils/getGoodFromStockx'
import generateImage from '../utils/generateImage'
import { resetSearchInfo } from '../utils/updateSearchInfo'

const profileScene = [
	new StepScene('profile', [
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text) {
                try {
                    const goods = await Good.find({ sellerId: ctx.senderId })
    
                    const someGoodIsHide = goods.some(good => good.isHide)
    
                    if (someGoodIsHide) {
                        return ctx.send({
                            message: '🔒 Твои товары пропали из поиска, потому что ты не обновлял их актуальность',
                            keyboard: keyboard(...profileNext) 
                        })
                    } else {
                        ctx.scene.step.next()
                    }                    
                } catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
					return ctx.scene.leave()
				}
            }

            if (ctx.text == 'Продолжить')
                ctx.scene.step.next()
        },
		// Показ объявлений
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text || ctx.scene.state.isDelete) {
				try {
                    // Объект с пользователем
					const user = ctx.state.user

                    // Товары пользователя
                    const goods = await Good.find({ sellerId: ctx.senderId })
                    ctx.scene.state.goods = goods

                    // Конфигурация бота
					const { maxSearch, maxGoods, cooldownSearch } = await BotConfig.findOne()

                    // Информация о поисках пользователя
					const { count: countSearch, lastSearch } = user.searchInfo
                    
                    // Сколько осталось товаров и поисков у пользователя
					const leftGoods = maxGoods - goods.length
					const leftSearch = maxSearch - countSearch

					let sendString = ''

                    // Если прошло время выдать бесплатные поиски
					if (lastSearch && Date.now() - lastSearch.getTime() >= cooldownSearch) {
						await resetSearchInfo(ctx.senderId)
						sendString += `❗ Тебе снова доступны бесплатные поиски!\n\n`
					}

					if (user.extendedAccess)
						sendString += `❗ Профиль\nОбъявлений: ${ goods.length } (осталось ∞)\nПоисков: ${ countSearch } (осталось ∞)\nВы имеете расширенный доступ в котором нет ограничений\n\n`
					else
						sendString += `❗ Профиль\nОбъявлений: ${ goods.length } (осталось ${ leftGoods })\nПоисков: ${ countSearch } (осталось ${ leftSearch })\n\n❗ Для снятия ограничений — оформите расширенный доступ\n\n`


					if (goods.length === 0) {
						ctx.send({
							message: sendString + '❗ У тебя отсутствуют объявления. Попробуй создать их с помощью кнопки — Продать',
							keyboard: keyboard(baseMarkup),
						})
						return ctx.scene.leave()
					}

                    ctx.send(sendString)

                    // Пагинация товаров на несколько сообщений
                    sendString = ''
                    let counter = 0;
                    const pages = []
					goods.forEach((item, index) => {
						const { goodName, size, price, city, views, hasDelivery, hasFitting, isHide } = item

                        sendString += `[${index}] `

                        if (isHide)
                            sendString += '🔒 Неактивно 🔒 '

						if (size)
							sendString += `${goodName}\n${size} | ${price}руб. | ${city} | Доставка: ${hasDelivery} | Примерка: ${hasFitting} | ${views} показов\n\n`
						else
							sendString += `${goodName}\n${price}руб. | ${city} | Доставка: ${hasDelivery} | ${views} показов\n\n`

                        counter += 1

                        if (counter >= 20 || goods.length - 1 == index) {
                            pages.push(sendString)
                            sendString = ''
                            counter = 0
                        }
					})

                    for (const page of pages)
                        ctx.send(page)
                    //

                    ctx.scene.state.isDelete = false
                    ctx.scene.state.selectedGood = null
                    ctx.scene.state.newGood = null

                    const mailingArchiveUser = await MailingUser.findOne({ userId: ctx.senderId, type: 'archive' })
                    ctx.scene.state.mailingArchiveUser = mailingArchiveUser

                    const subscribeMarkup = mailingArchiveUser ? unsubsribeMailing : subsribeMailing

                    return ctx.send({
                        message: '❗ Твои объявления. Введи номер (он указан в начале), чтобы отредактировать или удалить объявление\n\n❗ Ты можешь отредактировать параметр "Примерка" и "Доставка" сразу для всех объявлений, для этого нажми кнопку "Все объявления"',
                        keyboard: keyboard([...mainMenuProfile, ...subscribeMarkup, ...menuMarkup]),
                    }) 
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
					return ctx.scene.leave()
				}
			}

            switch (ctx.text) {
                case 'Меню':
                    baseSendMessage(ctx)
                    return ctx.scene.leave()
                case 'Все объявления':
                    return ctx.scene.step.go(8)
                case 'Обновить товары':
                    return ctx.scene.step.go(11)
            }

            // Рассылка архивации товаров
            try {
                const mailingArchiveUser = ctx.scene.state.mailingArchiveUser

                if (ctx.text == 'Напоминать об актуальности' && !mailingArchiveUser) {
                    const mailingUser = new MailingUser({
                        userId: ctx.senderId,
                        type: 'archive',
                        groupId: config.get('groupID')
                    })

                    await mailingUser.save()

                    ctx.send('✅ Ты подписался на рассылку которая будет напоминать тебе об актуальности твоих товаров за день до архивации!')
                    return ctx.scene.step.go(1)
                }
    
                if (ctx.text == 'Не напоминать об актуальности' && mailingArchiveUser) {
                    await MailingUser.deleteOne({ userId: ctx.senderId, type: 'archive'})

                    ctx.send('❌ Ты отписался от рассылки которая будет напоминать тебе об актуальности твоих товаров. Будь аккуратнее, не забывай обновлять товары!')
                    return ctx.scene.step.go(1)
                }                
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
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
				else 
                    sendString += `${goodName}\n${price}руб. | ${city} | Доставка: ${hasDelivery}\n\n`

				const markup = ctx.scene.state.selectedGood.size ? myAdsMarkup : myAdsMarkupNotSize

				return ctx.send({
					message: sendString,
					keyboard: keyboard(markup),
				})
			}

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(1)

			if (ctx.text == 'Удалить') {
				try {
					await Good.deleteOne({ _id: ctx.scene.state.selectedGood._id })
					await BotConfig.updateOne({ $inc: { 'stats.countDelete': 1 } })

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
						return ctx.scene.step.go(1)
					}
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратись к администратору')
					return ctx.scene.leave()
				}
			}

			if (ctx.text == 'Размер' && ctx.scene.state.selectedGood.size)
				return ctx.scene.step.go(3)

            if (ctx.text == 'Цена')
				return ctx.scene.step.go(4)
            
            if (ctx.text == 'Доставка')
				return ctx.scene.step.go(5)

            if (ctx.text == 'Примерка' && ctx.scene.state.selectedGood.size)
				return ctx.scene.step.go(6)
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
				return ctx.scene.step.go(2)

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
            ctx.scene.step.go(7)
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
				return ctx.scene.step.go(2)

			if (+ctx.scene.state.selectedGood.price == +ctx.text)
				return ctx.send({
					message: '❗ Ты указал стоимость которая и так указана в объявлении, попробуй указать другую',
					keyboard: keyboard(previousMarkup),
				})

			const patternNumber = /^\d+$/
			if (patternNumber.test(ctx.text) == false)
				return ctx.send('❗ Укажи стоимость в правильном формате:\n\n❌ 10.000руб.\n✅ 10000')

			if (+ctx.text > 10000000)
				return ctx.send('❗ Максимальная стоимость товара 10000000руб.')

			if (+ctx.text < 1)
				return ctx.send('❗ Минимальная стоимость товара 1руб.')

			ctx.scene.state.newGood.price = ctx.text
			ctx.scene.step.go(7)
		},
        // Доставка
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗ Укажи, доступна ли доставка',
					keyboard: keyboard([...answerMarkup, ...previousMarkup]),
				})

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(2)

            const hasDelivery = ctx.scene.state.selectedGood.hasDelivery

			if ((hasDelivery == '❌' && ctx.text == 'Нет') || (hasDelivery == '✅' && ctx.text == 'Да'))
				return ctx.send({
					message: '❗ Ты указал параметр который и так был указан в объявлении. Попробуй выбрать другой или вернись назад\n\n❗ Укажите, доступна ли доставка',
					keyboard: keyboard([...answerMarkup, ...previousMarkup]),
				})

            if (ctx.text == 'Да')
                ctx.scene.state.newGood.hasDelivery = '✅'
            else if (ctx.text == 'Нет')
                ctx.scene.state.newGood.hasDelivery = '❌'
            else 
                return

            ctx.scene.step.go(7)
		},
        // Примерка
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗ Укажи, доступна ли примерка',
					keyboard: keyboard([...answerMarkup, ...previousMarkup]),
				})

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(2)

            const hasFitting = ctx.scene.state.selectedGood.hasFitting

            if ((hasFitting == '❌' && ctx.text == 'Нет') || (hasFitting == '✅' && ctx.text == 'Да'))
				return ctx.send({
					message: '❗ Ты указал параметр который и так был указан в объявлении. Попробуй выбрать другой или вернись назад\n\n❗ Укажите, доступна ли примерка',
					keyboard: keyboard([...answerMarkup, ...previousMarkup]),
				})

            if (ctx.text == 'Да')
                ctx.scene.state.newGood.hasFitting = '✅'
            else if (ctx.text == 'Нет')
                ctx.scene.state.newGood.hasFitting = '❌'
            else 
                return

            ctx.scene.step.go(7)
		},
		// Уточнение по изменению товара
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text) {
				try {
                    const { selectedGood, newGood } = ctx.scene.state

                    let { imgUrl, filename } = selectedGood
                    let attachment = null


                    try {
                        await generateImage(imgUrl, filename)

                        attachment = await vk.upload.messagePhoto({
                            peer_id: ctx.peerId,
                            source: { value: `./images/${filename}.jpg` }
                        })                        
                    } catch (e) {
                        console.log(e)
                    }

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
						attachment, keyboard: keyboard(answerMarkup),
					})
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
					ctx.scene.leave()
				}
			}

            // Подтверждение редактирования
            try {
                switch (ctx.text) {
                    case 'Да':
                        const newGood = ctx.scene.state.newGood
                        await Good.findOneAndUpdate({'_id': newGood._id }, newGood);
                        ctx.send('❗ Товар успешно изменен')
                        return ctx.scene.step.go(1)
                    case 'Нет':
                        ctx.send('❗ Возвращаю тебя к панели редактирования объявления')
                        return ctx.scene.step.go(2)
                }
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
                return ctx.scene.leave()
            }
		},
        // Настройка всех объявлений
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({ 
                    message: '❗ Ты попал в меню настроек всех объявлений. Выбери параметр который хочешь изменить для ВСЕХ объявлений.',
                    keyboard: keyboard([...allAdsSettings, ...previousMarkup])
                })

            switch (ctx.text) {
                case 'Назад':
                    return ctx.scene.step.go(1)
                case 'Доставка':
                    return ctx.scene.step.go(9)
                case 'Примерка':
                    return ctx.scene.step.go(10)
            }
        },
        // Настройка доставки для всех объявлений
        async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗ Укажи, доступна ли доставка для ВСЕХ товаров',
					keyboard: keyboard([...answerMarkup, ...previousMarkup]),
				})

            try {
                switch (ctx.text) {
                    case 'Назад':
                        return ctx.scene.step.go(8)
                    case 'Да':
                        await Good.updateMany({ 'sellerId': ctx.peerId }, { hasDelivery: '✅' })
                        ctx.send('✅ Доставка теперь доступна для всех твоих товаров.')
                        break;
                    case 'Нет':
                        await Good.updateMany({ 'sellerId': ctx.peerId }, { hasDelivery: '❌' })
                        ctx.send('❌ Доставка теперь недоступна для всех твоих товаров')
                        break;
                }

                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
                return ctx.scene.leave()
            }
        },
        // Настройка примерки для всех объявлений
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: '❗ Укажи, доступна ли примерка для ВСЕХ товаров',
                    keyboard: keyboard([...answerMarkup, ...previousMarkup]),
                })

            try {
                switch (ctx.text) {
                    case 'Назад':
                        return ctx.scene.step.go(8)
                    case 'Да':
                        await Good.updateMany(
                            { 'sellerId': ctx.peerId, 'hasFitting': { "$in": ['✅', '❌'] } }, 
                            { hasFitting: '✅' }
                        )
                        ctx.send('✅ Примерка теперь доступна для всех твоих товаров.')
                        break;
                    case 'Нет':
                        await Good.updateMany(
                            { 'sellerId': ctx.peerId, 'hasFitting': { "$in": ['✅', '❌'] } }, 
                            { hasFitting: '❌' }
                        )
                        ctx.send('❌ Примерка теперь недоступна для всех твоих товаров')
                        break;
                }             

                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
                return ctx.scene.leave()
            }     
        },
        // Обновление актуальности товаров
        async ctx => {
            try {
                await Good.updateMany({ sellerId: ctx.peerId}, { isHide: false, updatedAt: Date.now() })

                ctx.send('✅ Товары были успешно обновлены')

                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
                return ctx.scene.leave()
            }
        }
	]),
]

export default profileScene
