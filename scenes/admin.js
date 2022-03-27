import { StepScene } from '@vk-io/scenes'

import moment from 'moment'

import baseSendMessage from '../baseSendMessage'

import keyboard from '../markup/keyboard'
import { mainAdminMarkup, removeAllAdsMarkup, banReasonMarkup } from '../markup/adminMarkup'
import { menuMarkup, previousMarkup } from '../markup/generalMarkup'

import { resetSearchInfo } from '../utils/updateSearchInfo'

import User from '../models/User'
import BannedUser from '../models/BannedUser'
import Good from '../models/Good'
import MailingUser from '../models/MailingUser'
import BotConfig from '../models/BotConfig'

import getUserDossierMessage from '../utils/adminScene/getUserDossierMessage'
import getManageUserMarkup from '../utils/adminScene/getManageUserMarkup'
import getUserGoodsInPages from '../utils/adminScene/getUserGoodsInPages'

import logAdminActions from '../utils/logAdminActions'

const adminScene = [
	new StepScene('admin', [
		async ctx => {
            ctx.scene.state.selectedUser = null
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
                    return ctx.scene.step.go(7)
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

            const selectedUser = await User.findOne({ userId: selectedUserId })
            const bannedUser = await BannedUser.findOne({ userId: selectedUserId })
            const countGoods = await Good.countDocuments({ sellerId: selectedUserId })

            ctx.scene.state.selectedUser = selectedUser
            ctx.scene.state.bannedUser = bannedUser

            const { username, userId, searchInfo, extendedAccess, adminAccess, settingsAccess } = ctx.scene.state.selectedUser

            if (ctx.scene.step.firstTime || !ctx.text) {
                try {
                    const userDossierMessage = getUserDossierMessage({
                        username, 
                        userId, 
                        searchInfo,
                        extendedAccess, 
                        adminAccess, 
                        settingsAccess,
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
                if (ctx.text == 'Выдать расширенный доступ' && extendedAccess == false)
                    return ctx.scene.step.go(2)
                
                if (ctx.text == 'Забрать расширенный доступ' && extendedAccess)
                    return ctx.scene.step.go(3)

                if (ctx.text == 'Удалить объявления пользователя')
                    return ctx.scene.step.go(4)
            }

            if (settingsAccess == false && adminAccess == false) {
                if (ctx.text == 'Разблокировать' && bannedUser)
                    return ctx.scene.step.go(8)

                if (ctx.text == 'Заблокировать' && bannedUser == null)
                    return ctx.scene.step.go(9)
            }

            if (admin.settingsAccess && admin.userId != userId && settingsAccess == false) {
                if (!adminAccess && ctx.text == 'Назначить администратора')
                    return ctx.scene.step.go(5)
                else if (adminAccess && ctx.text == 'Снять администратора')
                    return ctx.scene.step.go(6)
            }
            //
		},

		// Выдать расширенный доступ
		async ctx => {
			const selectedUser = ctx.scene.state.selectedUser

            try {
                await logAdminActions(ctx.senderId, 'giveExtendedAccess', selectedUser.userId)

                await User.updateOne(
                    { _id: selectedUser._id },
                    { $set: { extendedAccess: true } }
                )

                ctx.send('❗ Пользователю успешно выдан расширенный доступ')
                
                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
		},

		// Забрать расширенный доступ
		async ctx => {
			const selectedUser = ctx.scene.state.selectedUser

            try {
                await logAdminActions(
                    ctx.senderId,
                    'takeExtendedAccess',
                    selectedUser.userId
                )

                await User.updateOne(
                    { _id: selectedUser._id },
                    {
                        $set: {
                            extendedAccess: false,
                            'searchInfo.count': 0,
                            'searchInfo.lastSearch': null,
                        }
                    }
                )

                await MailingUser.deleteMany({
                    type: 'subscribeSearch',
                    userId: selectedUser.userId
                })

                await resetSearchInfo(selectedUser.userId)

                ctx.send('❗ У пользователя снят расширенный доступ')
                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
		},

		// Удалить объявления пользователя
		async ctx => {
			const selectedUser = ctx.scene.state.selectedUser

			try {
				await logAdminActions(
					ctx.senderId,
					'deleteAllGoods',
					selectedUser.userId
				)
				await Good.deleteMany({ sellerId: selectedUser.userId }),
					ctx.send('❗ У пользователя удалены все объявления')
				return ctx.scene.step.go(0)
			} catch (e) {
				console.log(e)
				ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
				return ctx.scene.leave()
			}
		},

        // Назначить администратора
        async ctx => {
        	const selectedUser = ctx.scene.state.selectedUser

            try {
                await User.updateOne(
                    { _id: selectedUser._id },
                    { $set: { adminAccess: true } }
                )
                ctx.send('❗ Пользователю успешно выданы полномочия администратора')
                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
        },

        // Снять администратора
        async ctx => {
        	const selectedUser = ctx.scene.state.selectedUser

            try {
                await User.updateOne(
                    { _id: selectedUser._id },
                    { $set: { adminAccess: false } }
                )
                ctx.send('❗ У пользователя сняты полномочия администратора')
                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
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

            try {
                await BannedUser.deleteOne({ userId: selectedUser.userId })
                ctx.send('❗ Пользователь разблокирован')
                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }            
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

            try {
                await Good.updateMany(
                    { sellerId: selectedUser.userId },
                    { $set: { isHide: true } }
                )


                const bannedUser = new BannedUser({
                    userId: selectedUser.userId,
                    expiresIn: Date.now(),
                    reason: ctx.text
                })

                await bannedUser.save()

                ctx.send('❗ Пользователь заблокирован')
                return ctx.scene.step.go(1)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }            
        }
	]),
]

export default adminScene