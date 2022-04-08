import { StepScene } from '@vk-io/scenes'

import moment from 'moment'

import baseSendMessage from '../baseSendMessage'

import keyboard from '../markup/keyboard'
import { mainAdminMarkup, removeAllAdsMarkup, banReasonMarkup, selectDaysMarkup, manageSearchSellMarkup } from '../markup/adminMarkup'
import { menuMarkup, previousMarkup } from '../markup/generalMarkup'

import User from '../models/User'
import BannedUser from '../models/BannedUser'
import Good from '../models/Good'
import MailingUser from '../models/MailingUser'
import BotConfig from '../models/BotConfig'

import getUserDossierMessage from '../utils/adminScene/getUserDossierMessage'
import getManageUserMarkup from '../utils/adminScene/getManageUserMarkup'
import getUserGoodsInPages from '../utils/adminScene/getUserGoodsInPages'

import { giveExtendedAccess, takeExtendedAccess, extendExtendedAccess, deleteAllAds, giveAdminAccess, takeAdminAccess, banUser, unbanUser, findExtendedUser } from '../controllers/manageUser'

const adminScene = [
	new StepScene('admin', [
		async ctx => {
            ctx.scene.state.selectedUser = null
            ctx.scene.state.typeManageSearchSell = null
			const admin = ctx.state.user

			if (ctx.scene.step.firstTime)
				return ctx.send({
					message: `${admin.username}, ты авторизован как администратор.\n\n❗ Чтобы отредактировать или посмотреть статистику пользователя отправь ID или перешли его сообщение`,
					keyboard: keyboard([...mainAdminMarkup, ...menuMarkup]),
				})

            switch (ctx.text) {
                case 'Меню':
                    baseSendMessage(ctx)
                    return ctx.scene.leave()
                case 'Статистика':
                    return ctx.scene.step.go(8)
                case 'Выбрать меня':
                    ctx.scene.state.selectedUserId = admin.userId
                    return ctx.scene.step.next()
            }

            try {
                let queryId = ctx.hasForwards ? ctx.forwards[0].senderId : ctx.text

				const foundUser = await User.findOne({ userId: queryId }).exec()

				if (foundUser) {
                    ctx.scene.state.selectedUserId = foundUser.userId
                    return ctx.scene.step.next()
				} else {
					return ctx.send({
						message: '❗ Данный пользователь не найден в базе данных',
						keyboard: keyboard([...mainAdminMarkup, ...menuMarkup]),
					})
				}
			} catch (e) {
				console.log(e)
				ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
				return ctx.scene.leave()
			}
		},

        // Действие над пользователем
		async ctx => {
            const admin = ctx.state.user

            const selectedUserId = ctx.scene.state.selectedUserId

            const selectedUser = await User.findOne({ userId: selectedUserId }).lean()
            const bannedUser = await BannedUser.findOne({ userId: selectedUserId })
            const countGoods = await Good.countDocuments({ sellerId: selectedUserId })

            ctx.scene.state.selectedUser = selectedUser
            ctx.scene.state.bannedUser = bannedUser

            const { username, userId, searchInfo, adminAccess, settingsAccess } = ctx.scene.state.selectedUser
            const extendedAccess = await findExtendedUser(userId)

            if (ctx.scene.step.firstTime || !ctx.text) {
                try {
                    const userDossierMessage = getUserDossierMessage({
                        ...selectedUser,
                        extendedAccess,
                        countGoods,
                        bannedUser
                    })

                    ctx.send(userDossierMessage)  

                    // Вывод товаров
                    const searchedGoods = await Good.find({ sellerId: userId })
                    if (searchedGoods.length) {
                        ctx.send(`❗ Активные товары пользователя:`)

                        let pages = getUserGoodsInPages(searchedGoods)
                        pages.forEach(async page => await ctx.send(page))    
                    }

                    // Собрать клавиаутуру для управления пользователем
                    const manageUserMarkup = getManageUserMarkup({
                        user: {
                            userId,
                            settingsAccess,
                            extendedAccess,
                            adminAccess,
                            bannedUser,
                        },

                        admin: { userId: admin.userId, settingsAccess: admin.settingsAccess }
                    })
                    //

                    if (manageUserMarkup.length) {
                        return ctx.send({
                            message: '❗ Действие над пользователем',
                            keyboard: keyboard([...manageUserMarkup, removeAllAdsMarkup, previousMarkup])
                        })
                    } else {
                        return ctx.send({
                            message: '❗ У вас нет доступа для управления этим пользователем',
                            keyboard: keyboard(previousMarkup)
                        })
                    }

                } catch (e) {
                    console.log(e)
                    ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
                }
            }

            // Проверка доступа
            if (ctx.text == 'Назад') 
                return ctx.scene.step.go(0)

            if (settingsAccess == false || (settingsAccess && ctx.senderId == userId)) {
                if (ctx.text == 'Выдать PRO' && !extendedAccess)
                    return ctx.scene.step.go(2)

                if (ctx.text == 'Продлить PRO' && extendedAccess?.forever == false)
                    return ctx.scene.step.go(3)
                
                if (ctx.text == 'Забрать PRO' && extendedAccess)
                    return ctx.scene.step.go(4)

                if (ctx.text == 'Удалить объявления пользователя')
                    return ctx.scene.step.go(5)

                if (ctx.text == 'Управление поисками/продажами' && extendedAccess == null)
                    return ctx.scene.step.go(11)
            }

            if (settingsAccess == false && adminAccess == false) {
                if (ctx.text == 'Разблокировать' && bannedUser)
                    return ctx.scene.step.go(9)

                if (ctx.text == 'Заблокировать' && bannedUser == null)
                    return ctx.scene.step.go(10)
            }

            if (admin.settingsAccess && admin.userId != userId && settingsAccess == false) {
                if (!adminAccess && ctx.text == 'Назначить администратора')
                    return ctx.scene.step.go(6)
                else if (adminAccess && ctx.text == 'Снять администратора')
                    return ctx.scene.step.go(7)
            }
            //
		},

		// Выдать расширенный доступ
		async ctx => {
            try {
                const userId = ctx.scene.state.selectedUser.userId
                const adminId = ctx.state.user.userId

                if (ctx.scene.step.firstTime)
                    return ctx.send({
                        message: '❗ На сколько дней выдать PRO-версию? Для выбора используй кнопки или напиши вручную нужное количество дней',
                        keyboard: keyboard([...selectDaysMarkup, ...previousMarkup])
                    })

                if (ctx.text == 'Назад') 
                    return ctx.scene.step.go(0)

                let result = null

                if (ctx.text == 'Навсегда') {
                    result = await giveExtendedAccess({
                        adminId,
                        userId,
                        forever: true
                    })
                } else {
                    const patternNumber = /^\d+$/
                    if (patternNumber.test(ctx.text) == false)
                        return ctx.send({
                            message: '❗ Неправильный формат ввода. Укажи число',
                            keyboard: keyboard(previousMarkup)
                        })

                    if (+ctx.text > 365)
                        return ctx.send({
                            message: '❗ Максимальное количество дней — 365 ',
                            keyboard: keyboard(previousMarkup)
                        })

                    if (+ctx.text < 1)
                        return ctx.send({
                            message: '❗ Минимальное количество дней — 1',
                            keyboard: keyboard(previousMarkup)
                        })

                    result = await giveExtendedAccess({
                        adminId,
                        userId,
                        days: +ctx.text
                    })
                }

                ctx.send(result.message)
                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
		},

        // Продлить расширенный доступ
		async ctx => {
            try {
                const userId = ctx.scene.state.selectedUser.userId
                const adminId = ctx.state.user.userId

                if (ctx.scene.step.firstTime)
                    return ctx.send({
                        message: '❗ На сколько дней продлить PRO-версию? Для выбора используй кнопки или напиши вручную нужное количество дней',
                        keyboard: keyboard([...selectDaysMarkup, ...previousMarkup])
                    })

                if (ctx.text == 'Назад') 
                    return ctx.scene.step.go(0)

                let result = null

                if (ctx.text == 'Навсегда') {
                    result = await extendExtendedAccess({
                        adminId,
                        userId,
                        forever: true
                    })
                } else {
                    const patternNumber = /^\d+$/
                    if (patternNumber.test(ctx.text) == false)
                        return ctx.send({
                            message: '❗ Неправильный формат ввода. Укажи число',
                            keyboard: keyboard(previousMarkup)
                        })

                    if (+ctx.text > 365)
                        return ctx.send({
                            message: '❗ Максимальное количество дней — 365 ',
                            keyboard: keyboard(previousMarkup)
                        })

                    if (+ctx.text < 1)
                        return ctx.send({
                            message: '❗ Минимальное количество дней — 1',
                            keyboard: keyboard(previousMarkup)
                        })

                    result = await extendExtendedAccess({
                        adminId,
                        userId,
                        days: +ctx.text
                    })
                }

                ctx.send(result.message)
                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
		},

		// Забрать расширенный доступ
		async ctx => {
			const userId = ctx.scene.state.selectedUser.userId
            const adminId = ctx.state.user.userId

            const result = await takeExtendedAccess({ adminId, userId })
            ctx.send(result.message)

            return ctx.scene.step.go(1)
		},

		// Удалить объявления пользователя
		async ctx => {
			const selectedUser = ctx.scene.state.selectedUser

            const result = await deleteAllAds({ adminId: ctx.senderId, userId: selectedUser.userId })
            ctx.send(result.message)

            return ctx.scene.step.go(0)
		},

        // Назначить администратора
        async ctx => {
        	const selectedUser = ctx.scene.state.selectedUser

            const result = await giveAdminAccess({ userId: selectedUser.userId})
            ctx.send(result.message)

            return ctx.scene.step.go(1)
        },

        // Снять администратора
        async ctx => {
            const selectedUser = ctx.scene.state.selectedUser

            const result = await takeAdminAccess({ userId: selectedUser.userId})
            ctx.send(result.message)

            return ctx.scene.step.go(1)
        },
        
		// Статистика
		async ctx => {
			if (ctx.text == 'Назад') return ctx.scene.step.go(0)

			try {
				const goodsActiveCount = (await Good.find()).length
				const usersCount = (await User.find()).length
				const mailingArchiveCount = (await MailingUser.find({ type: 'archive' })).length
                const mailingSearchCount = (await MailingUser.find({ type: 'subscribeSearch' })).length

				const { countSearch, countFoundSearch, countDelete, countGoods} = (await BotConfig.findOne()).stats

				let sendString = `📊 Общая статистика\n\nПоиски: ${countSearch} (${countFoundSearch} из них найденых)\nУдаленные товары: ${countDelete}\nВсего товаров: ${countGoods} (${goodsActiveCount} из них активные)\nПользователей: ${usersCount}\nПодписаны на рассылку архивации: ${mailingArchiveCount}\nПодписок на поиск товара: ${ mailingSearchCount }\n\n`

                let weekBuyers = await User.find({ 
                    'searchInfo.lastSearch': {
                        $gte: moment().subtract(7, 'days'),
                        $lte: moment(),
                    }
                })

                sendString += `📊 Статистика за последние 7 дней\n\nПокупатели которые нашли товар: ${weekBuyers.length}`

				return ctx.send({
					message: sendString,
					keyboard: keyboard(previousMarkup),
				})
			} catch (e) {
				console.log(e)
				ctx.send( '❗ Произошла какая-то ошибка, обратитесь к главному администратору')
				return ctx.scene.leave()
			}
		},

        // Разблокировать
        async ctx => {
        	const selectedUser = ctx.scene.state.selectedUser

            const result = await unbanUser({ adminId: ctx.senderId, userId: selectedUser.userId })
            ctx.send(result.message)

            return ctx.scene.step.go(1)   
        },

        // Заблокировать
        async ctx => {
            if (ctx.scene.step.firstTime)
                return ctx.send({
                    message: `Укажи причину бана из списка кнопок. Если причина особенная, то напиши ее вручную. Все товары пользователя при этом пропадут из поиска и попадут в архив`,
                    keyboard: keyboard([...banReasonMarkup, ...previousMarkup]),
                })

            if (ctx.text == 'Назад')
                return ctx.scene.step.go(1)

            const selectedUser = ctx.scene.state.selectedUser
            const result = await banUser({ adminId: ctx.senderId, userId: selectedUser.userId, reason: ctx.text })  
            ctx.send(result.message)

            return ctx.scene.step.go(1) 
        },

        async ctx => {
            ctx.scene.state.typeManageSearchSell = null
            const selectedUser = ctx.scene.state.selectedUser

            if (ctx.text == 'Назад')
                return ctx.scene.step.go(1)

            if (ctx.scene.step.firstTime)
                return ctx.send({
                    message: '❗ Укажи какие параметры хочешь изменить',
                    keyboard: keyboard([...manageSearchSellMarkup, ...previousMarkup])
                })

            if (ctx.text == 'Выдать поиски') {
                ctx.scene.state.typeManageSearchSell = 'giveSearch'
                return ctx.scene.step.go(12)
            }
                
            if (ctx.text == 'Забрать поиски') {
                if (selectedUser.freeSearch == 0)
                    return ctx.send({
                        message: '❗ У пользователя 0 поисков',
                        keyboard: keyboard(previousMarkup)
                    })

                ctx.scene.state.typeManageSearchSell = 'takeSearch'
                return ctx.scene.step.go(12)
            }

            if (ctx.text == 'Выдать продажи') {
                ctx.scene.state.typeManageSearchSell = 'giveSell'
                return ctx.scene.step.go(12)
            }

            if (ctx.text == 'Забрать продажи') {
                if (selectedUser.freeSearch == 0)
                    return ctx.send({
                        message: '❗ У пользователя 0 продаж',
                        keyboard: keyboard(previousMarkup)
                    })

                ctx.scene.state.typeManageSearchSell = 'takeSell'
                return ctx.scene.step.go(12)
            }
        },

        // Выдать/забрать поиски/продажи
        async ctx => {
            try {
                const typeManageSearchSell = ctx.scene.state.typeManageSearchSell
                let title = ''

                if (typeManageSearchSell == 'giveSearch')
                    title = '❗ Сколько выдать поисков?'
                if (typeManageSearchSell == 'takeSearch')
                    title = '❗ Сколько забрать поисков?'
                if (typeManageSearchSell == 'giveSell')
                    title = '❗ Сколько выдать продаж?'
                if (typeManageSearchSell == 'takeSell')
                    title = '❗ Сколько забрать продаж?'

                if (ctx.scene.step.firstTime)
                    return ctx.send({
                        message: title,
                        keyboard: keyboard(previousMarkup)
                    })

                if (ctx.text == 'Назад')
                    return ctx.scene.step.go(11)

                const patternNumber = /^\d+$/             
                
                if (patternNumber.test(ctx.text)) {
                    const selectedUser = ctx.scene.state.selectedUser

                    if (typeManageSearchSell == 'giveSearch') {
                        await User.updateOne(
                            { userId: selectedUser.userId },
                            { $inc: { freeSearch: +ctx.text } }
                        )
                    }

                    if (typeManageSearchSell == 'takeSearch') {
                        if (selectedUser.freeSearch - +ctx.text < 0) {
                            return ctx.send({
                                message: '❗ У пользователя тогда будет отрицательное количество поисков. Попробуй еще раз',
                                keyboard: keyboard(previousMarkup)
                            })
                        } else {
                            await User.updateOne(
                                { userId: selectedUser.userId },
                                { $inc: { freeSearch: -(+ctx.text) } }
                            )
                        }
                    } 

                    if (typeManageSearchSell == 'giveSell') {
                        await User.updateOne(
                            { userId: selectedUser.userId },
                            { $inc: { freeSell: +ctx.text } }
                        )
                    }

                    if (typeManageSearchSell == 'takeSell') {
                        if (selectedUser.freeSell - +ctx.text < 0) {
                            return ctx.send({
                                message: '❗ У пользователя тогда будет отрицательное количество продаж. Попробуй еще раз',
                                keyboard: keyboard(previousMarkup)
                            })
                        } else {
                            await User.updateOne(
                                { userId: selectedUser.userId },
                                { $inc: { freeSell: -(+ctx.text) } }
                            )
                        }
                    } 

                    ctx.send('❗ Изменения успешно применились')
                    return ctx.scene.step.go(1) 
                } else {
                    return ctx.send('❗ Укажи целое число. Попробуй еще раз')
                }
			} catch (e) {
				console.log(e)
				ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
				return ctx.scene.leave()
			}
        },
	]),
]

export default adminScene