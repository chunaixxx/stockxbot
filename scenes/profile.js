import config from 'config'

import User from '../models/User'
import Good from '../models/Good'
import MailingUser from '../models/MailingUser'
import BannedUser from '../models/BannedUser'
import BotConfig from '../models/BotConfig'

import vk from '../commonVK'
import { StepScene } from '@vk-io/scenes'

import baseSendMessage from '../baseSendMessage'

import keyboard from '../markup/keyboard'

import { baseMarkup } from '../markup/baseMarkup'
import { editGoodMarkup, editGoodNotSizeMarkup, editGoodsMarkup, updateGoodsMarkup, editAllGoodsMarkup, subArchiveMarkup, showOtherProfileMarkup, deleteDescGoodMarkup, unSubArchiveMarkup, subSearchGoodMarkup } from '../markup/profileMarkup'
import { menuMarkup, previousMarkup, answerMarkup, nextMarkup } from '../markup/generalMarkup'

import getGoodFromStockx from '../utils/getGoodFromStockx'
import generateImage from '../utils/generateImage'
import { resetSearchInfo } from '../utils/updateSearchInfo'
import formatSubcribesOnGoods from '../utils/formatMessages/formatSubcribesOnGoods'

import getUserDossierMessage from '../utils/adminScene/getUserDossierMessage'
import getUserGoodsInPages from '../utils/adminScene/getUserGoodsInPages'
import { findExtendedUser } from '../controllers/manageUser'

const profileScene = [
	new StepScene('profile', [
        // Уведомления о том, что скрыты товары
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text) {
                try {
                    const goods = await Good.find({ sellerId: ctx.senderId })
    
                    const someGoodIsHide = goods.some(good => good.isHide)
    
                    if (someGoodIsHide) {
                        return ctx.send({
                            message: '🔒 Твои товары пропали из поиска, потому что ты не обновлял их актуальность',
                            keyboard: keyboard(...nextMarkup) 
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
                    
                    // Сколько осталось товаров и поисков у пользователя
					const leftSell = user?.freeSell
					const leftSearch = user?.freeSearch

					let sendString = ''
					if (user.extendedAccess)
						sendString += `❗ Профиль | PRO-версия 🚀\n\nДоступно объявлений: ∞\nДоступно поисков: ∞\n`
					else
						sendString += `❗ Профиль\n\nДоступно объявлений: ${ leftSell }\nДоступно поисков: ${ leftSearch }\n\n❗ Для снятия ограничений — приобрети PRO-версию!\n\n`


					if (goods.length === 0) {
						return ctx.send({
							message: sendString + '\n\n❗ У тебя отсутствуют объявления. Попробуй создать их с помощью кнопки — Продать',
							keyboard: user.extendedAccess ? keyboard([...subSearchGoodMarkup, ...menuMarkup]) : keyboard(menuMarkup),
						})
					} else {
                        ctx.send(sendString)

                        // Пагинация товаров на несколько сообщений
                        sendString = ''
                        let counter = 0;
                        const pages = []
                        goods.forEach((item, index) => {
                            const { goodName, size, price, city, views, hasDelivery, hasFitting, isHide, desc } = item
    
                            sendString += `[${index + 1}] `
    
                            if (isHide)
                                sendString += '🔒 Неактивно 🔒 '

                            let strViews = ''

                            if (user.extendedAccess)
                                strViews = ` | ${views} показов`
    
                            if (size)
                                sendString += `${goodName}\n${size} | ${price}₽ | ${city} | Доставка: ${hasDelivery} | Примерка: ${ hasFitting }${ strViews }`
                            else
                                sendString += `${goodName}\n${price}₽ | ${city} | Доставка: ${hasDelivery} | ${views} показов`
    
                            if (desc)
                                sendString += `\n📝 ${desc}`

                            sendString += '\n\n'

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
    
                        const subscribeMarkup = mailingArchiveUser ? unSubArchiveMarkup : subArchiveMarkup
    
                        return ctx.send({
                            message: '❗ Твои объявления. Введи номер (он указан в начале), чтобы отредактировать или удалить объявление\n\n❗ Ты можешь отредактировать параметр "Примерка" и "Доставка" сразу для всех объявлений, для этого нажми кнопку "Все объявления"',
                            keyboard: user.extendedAccess ? 
                                    keyboard([...editGoodsMarkup, ...updateGoodsMarkup, ...subscribeMarkup, ...subSearchGoodMarkup, ...showOtherProfileMarkup, ...menuMarkup]) 
                                : 
                                    keyboard([...updateGoodsMarkup, ...subscribeMarkup, ...menuMarkup]),
                        }) 
                    }
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
                case 'Обновить товары':
                    return ctx.scene.step.go(13)
            }

            if (ctx.text == 'Все объявления' && ctx.state.user.extendedAccess)
                return ctx.scene.step.go(9)

            if (ctx.text == 'Подписка на поиск' && ctx.state.user.extendedAccess)
                return ctx.scene.step.go(14)

            if (ctx.text == 'Чужой профиль' && ctx.state.user.extendedAccess)
                return ctx.scene.step.go(15)

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

            if (ctx.scene.state.goods.length) {
                if (ctx.scene.state.goods[+ctx.text - 1])
                    ctx.scene.step.next()
                else
                    ctx.send({
                        message: '❗ Укажи действительный номер объявления',
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
					selectedGood = goods[+ctx.text - 1]
					ctx.scene.state.selectedGood = selectedGood
					ctx.scene.state.newGood = JSON.parse(JSON.stringify(selectedGood));
				}

				let sendString = '❗ Используй кнопки, чтобы редактировать объявление\n\n'

				const { goodName, size, price, city, hasDelivery, hasFitting, desc } = ctx.scene.state.selectedGood

				if (ctx.scene.state.selectedGood.size)
					sendString += `${goodName}\n${size} | ${price}руб. | ${city} | Доставка: ${hasDelivery} | Примерка: ${hasFitting}`
				else 
                    sendString += `${goodName}\n${price}руб. | ${city} | Доставка: ${hasDelivery}`

                if (desc)
                    sendString += `\n${ desc }`

				const markup = ctx.scene.state.selectedGood.size ? editGoodMarkup : editGoodNotSizeMarkup

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

            if (ctx.text == 'Описание') {
                if (ctx.state.user.extendedAccess) {
				    return ctx.scene.step.go(3)
                } else {
                    ctx.send('❗ Этот функционал доступен только в PRO-версии')
                    return ctx.scene.step.go(2)
                }
            }

			if (ctx.text == 'Размер' && ctx.scene.state.selectedGood.size)
				return ctx.scene.step.go(4)

            if (ctx.text == 'Цена')
				return ctx.scene.step.go(5)
            
            if (ctx.text == 'Доставка')
				return ctx.scene.step.go(6)

            if (ctx.text == 'Примерка' && ctx.scene.state.selectedGood.size)
				return ctx.scene.step.go(7)
		},
        // Описание
        async ctx => {
            try {
                if (ctx.scene.step.firstTime || !ctx.text)
                    return ctx.send({
                        message: '❗ Укажи новое описание для товара, либо нажми — Удалить, чтобы убрать описание с товара',
                        keyboard: keyboard([...deleteDescGoodMarkup, ...previousMarkup])
                    })

                if (ctx.text == 'Назад')
                    return ctx.scene.step.go(2)

                if (ctx.text == 'Удалить') {
                    const { selectedGood } = ctx.scene.state
                
                    await Good.updateOne(
                        { _id: selectedGood._id },
                        { desc: null }
                    )
                } else {
                    if (ctx.text.length > 25)
                        return ctx.send({
                            message: '❗ Максимальная длина описания — 25 символов. Попробуй еще раз',
                            keyboard: keyboard(previousMarkup)
                        })

                    if (ctx.text.length < 3)
                        return ctx.send({
                            message: '❗ Минимальная длина описания — 3 символа. Попробуй еще раз',
                            keyboard: keyboard(previousMarkup)
                        })

                    const { selectedGood } = ctx.scene.state
                    
                    await Good.updateOne(
                        { _id: selectedGood._id },
                        { desc: ctx.text }
                    )
                }
                    
                ctx.send('❗ Описание успешно добавлено и теперь будет видно другим пользователям при поиске твоего товара')
                return ctx.scene.step.go(1)
            } catch (c) {
                ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
                return ctx.scene.leave()
            }
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
            ctx.scene.step.go(8)
		},
		// Цена
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗ Укажи новую стоимость товара в рублях',
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
			ctx.scene.step.go(8)
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

            ctx.scene.step.go(8)
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

            ctx.scene.step.go(8)
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
                    keyboard: keyboard([...editAllGoodsMarkup, ...previousMarkup])
                })

            switch (ctx.text) {
                case 'Назад':
                    return ctx.scene.step.go(1)
                case 'Доставка':
                    return ctx.scene.step.go(10)
                case 'Примерка':
                    return ctx.scene.step.go(11)
                case 'Цена':
                    return ctx.scene.step.go(12)
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
                        return ctx.scene.step.go(9)
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
                        return ctx.scene.step.go(9)
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
        // Настройка цены для всех объявлений
        async ctx => {
            try {
                if (ctx.scene.step.firstTime || !ctx.text)
                    return ctx.send({
                        message: '❗ Укажи стоимость или процент на который нужно повысить каждый товар в стоимости\n\nПример:\n-2000 (Все товары снизят цену на 2000₽)\n20% (Все товары повысят цену на 20 процентов)',
                        keyboard: keyboard(previousMarkup),
                    })

                if (ctx.text == 'Назад')
                    return ctx.scene.step.go(9)

                const patternPercent = /^-?\d+%$/
                const patternNumber = /^-?\d+$/

                if (patternNumber.test(ctx.text)) {
                    const price = +ctx.text

                    if (price > 1000000)
                        return ctx.send('❗ Слишком большое значение. Максимальная наценка - 1.000.000₽')

                    if (price < -1000000)
                        return ctx.send('❗ Слишком маленькое значение. Максимальная скидка - 1.000.000₽')

                    const goods = await Good.find({ sellerId: ctx.senderId })

                    for (const good of goods) {
                        let newPrice = good.price + price

                        if (newPrice >= 10_000_000)
                            newPrice = 10_000_000
                        
                        if (newPrice <= 0)
                            newPrice = 1

                        await Good.updateOne(
                            { _id: good._id },
                            { price: newPrice }
                        )
                    }

                    ctx.send('❗ Цены на твои товары успешно изменились. Некоторые товары могут иметь другую стоимость из-за ограничений по минимальной и максимальной цены')
                    return ctx.scene.step.go(1)
                } else if (patternPercent.test(ctx.text)) {
                    const percent = +ctx.text.replace('%', '')

                    if (percent > 100)
                        return ctx.send('❗ Слишком большая наценка. Максимальное значение — 100%')
                    
                    if (percent < -75)
                        return ctx.send('❗ Слишком большая скидка. Максимальное значение — -75%')

                        const goods = await Good.find({ sellerId: ctx.senderId })

                    for (const good of goods) {
                        let newPrice = Math.ceil(good.price + (good.price * (percent / 100)))

                        if (newPrice >= 10_000_000)
                            newPrice = 10_000_000
                        
                        if (newPrice <= 0)
                            newPrice = 1

                        await Good.updateOne(
                            { _id: good._id },
                            { price: newPrice }
                        )
                    }

                    ctx.send('❗ Цены на твои товары успешно изменились. Некоторые товары могут иметь другую стоимость из-за ограничений по минимальной и максимальной цены')
                    return ctx.scene.step.go(1)
                } else {
                    ctx.send({
                        message: '❗ Неправильный формат ввода. Попробуй еще раз\n\nПримеры: 20, -50, 100, 25.5',
                        keyboard: keyboard(previousMarkup)
                    })
                }
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
        },
        // Подписка на поиск
        async ctx => {
            try {
                const subsribes = await MailingUser.find({
                    userId: ctx.senderId,
                    type: "subscribeSearch"
                })


                if (subsribes.length == 0) {
                    ctx.send('❗ У тебя пока нет подписок на появления товара. Чтобы подписаться на товар, попробуй найти интересующий тебя товар по ссылке')
                    return ctx.scene.step.go(1)
                }

                if (ctx.scene.step.firstTime || !ctx.text) {
                    ctx.send('📩 Твои подписки на поиск товара. Бот сообщит тебе когда появится интересующий тебя товар')

                    // Получить и вывести постранично найденные товары
                    let pages = formatSubcribesOnGoods(subsribes)
                    pages.forEach(async page => await ctx.send(page))

                    return ctx.send({
                        message: '❗ Введи номер (он указан в начале), чтобы удалить подписку на товар',
                        keyboard: keyboard(previousMarkup)
                    })
                }

                if (ctx.text == 'Назад')
				    return ctx.scene.step.go(1)

                let selectedId = +ctx.text - 1
                let selectedSubcribe = subsribes[selectedId]


                if (selectedSubcribe) {
                    const goodName = selectedSubcribe.data.userQuery.goodName
                    await MailingUser.deleteOne({ _id: selectedSubcribe._id })

                    ctx.send(`✅ Ты успешно отписался от подписки на товар ${ goodName }`)
                    return ctx.scene.step.go(13)
                } else {
                    ctx.send({
                        message: '❗ Укажи действительный номер подписки',
                        keyboard: keyboard(previousMarkup),
                    })
                }
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратись к главному администратору')
                return ctx.scene.leave()
            }            
        },
        // Чужой профиль
        async ctx => {
            try {
                if (ctx.scene.step.firstTime)
                    return ctx.send({
                        message: '❗ Укажи ID пользователя или перешли его сообщение, чтобы посмотреть его профиль',
                        keyboard: keyboard(previousMarkup)
                    })

                if (ctx.text == 'Назад')
                    return ctx.scene.step.go(1)

                let queryId = ctx.hasForwards ? ctx.forwards[0].senderId : ctx.text

                const foundUser = await User.findOne({ userId: queryId }).lean()
                const extendedAccess = await findExtendedUser(queryId)
                const bannedUser = await BannedUser.findOne({ userId: queryId })
                const countGoods = await Good.countDocuments({ sellerId: queryId })

                if (foundUser) {
                    const dossierMessage = getUserDossierMessage({
                        ...foundUser,
                        extendedAccess,
                        countGoods,
                        bannedUser
                    })

                    ctx.send(dossierMessage)

                    // Вывод товаров
                    const searchedGoods = await Good.find({ sellerId: queryId })
                    if (searchedGoods.length) {
                        ctx.send(`❗ Активные товары пользователя:`)

                        let pages = getUserGoodsInPages(searchedGoods)
                        pages.forEach(async page => await ctx.send(page))    
                    }

                    return ctx.send({
                        message: '❗ Можешь посмотреть еще раз чужой профиль, либо вернуться назад',
                        keyboard: keyboard(previousMarkup)
                    })
                } else {
                    return ctx.send({
                        message: '❗ Данный пользователь не найден в базе данных',
                        keyboard: keyboard(previousMarkup),
                    })
                }
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
        }
	]),
]

export default profileScene
