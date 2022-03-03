import { StepScene } from '@vk-io/scenes'

import moment from 'moment'


import baseSendMessage from '../baseSendMessage'

import keyboard from '../markup/keyboard'
import { statsMarkup, selectMyIDMarkup, editUserMarkup, addAdmin, deleteAdmin, banMarkup, unBanMarkup } from '../markup/adminMarkup'
import previousMarkup from '../markup/previousMarkup'
import menuMarkup from '../markup/menuMarkup'

import { resetSearchInfo } from '../utils/updateSearchInfo'

import User from '../models/User'
import Good from '../models/Good'
import MailingUser from '../models/MailingUser'
import BotConfig from '../models/BotConfig'

import logAdminActions from '../utils/logAdminActions'
import convertDate from '../utils/convertDate'
import formatFoundGoodsToMessages from '../utils/formatMessages/search/foundGoods.js'

const adminScene = [
	new StepScene('admin', [
		async ctx => {
            ctx.scene.state.selectedUser = null
			const admin = ctx.state.user

			if (ctx.scene.step.firstTime)
				return ctx.send({
					message: `${admin.username}, ты авторизован как администратор.\n\n❗ Чтобы отредактировать или посмотреть статистику пользователя отправь ID или перешли его сообщение`,
					keyboard: keyboard([...statsMarkup, ...selectMyIDMarkup, ...menuMarkup]),
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

            // Ручной ввод ID
            try {
                let queryId = ctx.hasForwards ? ctx.forwards[0].senderId : ctx.text

				const foundUser = await User.findOne({ userId: queryId }).exec()

				if (foundUser) {
                    ctx.scene.state.selectedUserId = foundUser.userId
                    return ctx.scene.step.next()
				} else {
					return ctx.send({
						message: '❗ Данный пользователь не найден в базе данных',
						keyboard: keyboard([...statsMarkup, ...selectMyIDMarkup, ...menuMarkup]),
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
            const selectedUser = await User.findOne({ userId: selectedUserId }).exec()
            ctx.scene.state.selectedUser = selectedUser

            const { username, userId, searchInfo, extendedAccess, adminAccess, settingsAccess } = ctx.scene.state.selectedUser

            if (ctx.scene.step.firstTime || !ctx.text) {
                try {
                    const countGoods = await Good.countDocuments({ sellerId: userId });
    
                    let title = `❗ @id${userId} (${ username })\n`
    
                    if (extendedAccess) title += 'Полный доступ'
                    else title += 'Без доступа'
    
                    if (settingsAccess) title += ', владелец'
                    else if (adminAccess) title += ', администратор'
    
                    const lastSearch = searchInfo.lastSearch ? convertDate(searchInfo.lastSearch) : 'отсутствует'

                    ctx.send(`${ title }\n\nПоисков: ${ searchInfo.count } (Последний поиск: ${ lastSearch })\nТоваров: ${ countGoods }`)  
                    
                    const searchedGoods = await Good.find({ sellerId: userId })

                    if (searchedGoods.length)
                        ctx.send(`❗ Активные товары пользователя:`)

                    let pages = formatFoundGoodsToMessages(searchedGoods)
                    pages.forEach(async page => await ctx.send(page))
                    
                    const markup = []
                    if (!settingsAccess || (settingsAccess && admin.userId == userId))
                        markup.push(...editUserMarkup)

                    if (admin.settingsAccess && admin.userId != userId && settingsAccess == false) {
                        if (adminAccess)
                            markup.push(...deleteAdmin)
                        else
                            markup.push(...addAdmin)
                    }

                    if (markup.length) {
                        return ctx.send({
                            message: '❗ Действие над пользователем',
                            keyboard: keyboard([...markup, ...previousMarkup])
                        })
                    } else {
                        return ctx.send({
                            message: '❗ У вас нет доступа для управления этим пользователем',
                            keyboard: keyboard([...markup, ...previousMarkup])
                        })
                    }

                } catch (e) {
                    console.log(e)
                    ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
                }
            }

            if (ctx.text == 'Назад') 
                return ctx.scene.step.go(0)

            if (!settingsAccess || (settingsAccess && ctx.senderId == userId)) {
                switch (ctx.text) {
                    case 'Выдать расширенный доступ':
                        return ctx.scene.step.go(2)
                    case 'Забрать расширенный доступ':
                        return ctx.scene.step.go(3)
                    case 'Удалить объявления пользователя':
                        return ctx.scene.step.go(4)
                }
            }

            if (admin.settingsAccess && admin.userId != userId && settingsAccess == false) {
                if (ctx.text == 'Назначить администратора')
                    return ctx.scene.step.go(5)
                else if (adminAccess && ctx.text == 'Снять администратора')
                    return ctx.scene.step.go(6)
            }
		},

		// Выдать расширенный доступ
		async ctx => {
			const selectedUser = ctx.scene.state.selectedUser

			if (selectedUser.extendedAccess) {
				ctx.send('❗ Данный пользователь уже имеет расширенный доступ')
				return ctx.scene.step.go(1)
			} else {
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
			}
		},

		// Забрать расширенный доступ
		async ctx => {
			const selectedUser = ctx.scene.state.selectedUser

			if (selectedUser.extendedAccess) {
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

					await resetSearchInfo(selectedUser.userId)

					ctx.send('❗ У пользователя снят расширенный доступ')
					return ctx.scene.step.go(1)
				} catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
				}
			} else {
				ctx.send('❗ У пользователя нет расширенного доступа')
				return ctx.scene.step.go(1)
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
				const mailingCount = (await MailingUser.find()).length

				const { countSearch, countFoundSearch, countDelete, countGoods} = (await BotConfig.findOne()).stats

				let sendString = `📊 Общая статистика\n\nПоиски: ${countSearch} (${countFoundSearch} из них найденых)\nУдаленные товары: ${countDelete}\nВсего товаров: ${countGoods} (${goodsActiveCount} из них активные)\nПользователей: ${usersCount}\n Подписаны на рассылку архивации: ${mailingCount}\n\n`


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
	]),
]

export default adminScene