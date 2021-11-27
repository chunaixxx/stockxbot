import { StepScene } from '@vk-io/scenes'

import baseSendMessage from '../baseSendMessage.js'

import keyboard from '../markup/keyboard.js'

import { adminMenuMarkup } from '../markup/adminMarkup.js'
import previousMarkup from '../markup/previousMarkup.js'
import menuMarkup from '../markup/menuMarkup.js'

import { resetSearchInfo } from '../utils/updateSearchInfo.js'

import User from '../models/User.js'
import Good from '../models/Good.js'
import BotConfig from '../models/BotConfig.js'

import logAdminActions from '../utils/logAdminActions.js'

const adminScene = [
	new StepScene('admin', [
		async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: 'Панель администратора',
                    keyboard: keyboard([...adminMenuMarkup, ...menuMarkup])
                })

            let admin = null
            let action = null

			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}

            try {
                admin = await User.findOne({ userId: ctx.senderId }).exec()
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
            
            if (ctx.text == 'Выдать расширенный доступ')
                action = 'Выдать расширенный доступ'
            
            if (ctx.text == 'Забрать расширенный доступ')
                action = 'Забрать расширенный доступ'
            
            if (ctx.text == 'Назначить администратора')
                if (admin.settingsAccess)
                    action = 'Назначить администратора'
                else
                    ctx.send('❗ Нет доступа')
            
            if (ctx.text == 'Снять администратора')
                if (admin.settingsAccess)
                    action = 'Снять администратора'
                else
                    ctx.send('❗ Нет доступа')

            if (ctx.text == 'Удалить объявления пользователя')
                action = 'Удалить объявления пользователя'

            if (ctx.text == 'Статистика')
                return ctx.scene.step.go(7)

            if (action) {
                ctx.scene.state.action = action
                ctx.scene.step.next()
            }
		},
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: '❗ Укажи ID пользователя',
                    keyboard: keyboard(previousMarkup)
                })

            if (ctx.text == 'Назад')
				return ctx.scene.step.go(0)
            
            try {
                const foundUser = await User.findOne({ userId: ctx.text }).exec()

                if (foundUser) {
                    ctx.scene.state.selectedUser = foundUser

                    switch (ctx.scene.state.action) {
                        case 'Выдать расширенный доступ':
                            return ctx.scene.step.go(2)
                            break;
                        case 'Забрать расширенный доступ':
                            return ctx.scene.step.go(3)
                            break;
                        case 'Назначить администратора':
                            return ctx.scene.step.go(4)
                            break;
                        case 'Снять администратора':
                            return ctx.scene.step.go(5)
                        case 'Удалить объявления пользователя':
                            return ctx.scene.step.go(6)
                    }
                    
                    ctx.scene.step.go(2)
                } else {
                    return ctx.send({
                        message: '❗ Данный пользователь не найден в базе данных',
                        keyboard: keyboard(previousMarkup)
                    })
                }
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
        },

        // Выдать расширенный доступ
        async ctx => {
            if (ctx.text == 'Назад')
				return ctx.scene.step.go(0)

            const selectedUser = ctx.scene.state.selectedUser

            if (selectedUser.extendedAccess) {
                ctx.send('❗ Данный пользователь уже имеет расширенный доступ')
                return ctx.scene.step.go(0)
            } else {
                try {
                    await logAdminActions(ctx.senderId, 'giveExtendedAccess', selectedUser.userId)

                    await User.updateOne({ _id: selectedUser._id}, { $set: { extendedAccess: true } })
                    ctx.send('❗ Пользователю успешно выдан расширенный доступ')
                    return ctx.scene.step.go(0)
                } catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
                }
            }
        },

        // Забрать расширенный доступ
        async ctx => {
            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

            const selectedUser = ctx.scene.state.selectedUser

            if (selectedUser.extendedAccess) {
                try {
                    await logAdminActions(ctx.senderId, 'takeExtendedAccess', selectedUser.userId)

                    await User.updateOne({ _id: selectedUser._id}, { $set: { extendedAccess: false } })
                    await resetSearchInfo(selectedUser.userId)
                    ctx.send('❗ У пользователя снят расширенный доступ')
                    return ctx.scene.step.go(0)
                } catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
                }
            } else {
                ctx.send('❗ У пользователя нет расширенного доступа')
                return ctx.scene.step.go(0)
            }
        },

        // Назначить администратора
        async ctx => {
            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

            const selectedUser = ctx.scene.state.selectedUser

            if (selectedUser.adminAccess) {
                ctx.send('❗ Данный пользователь уже имеет полномочия администратора')
                return ctx.scene.step.go(0)
            } else {
                try {
                    await User.updateOne({ _id: selectedUser._id}, { $set: { adminAccess: true } })
                    ctx.send('❗ Пользователю успешно выданы полномочия администратора')
                    return ctx.scene.step.go(0)
                } catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
                }
            }
        },

        // Забрать полномочия администратора
        async ctx => {
            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

            const selectedUser = ctx.scene.state.selectedUser

            if (selectedUser.userId == ctx.senderId)
                return ctx.send({
                    message: '❗ Нельзя снять с себя полномочия администратора',
                    keyboard: keyboard(previousMarkup)
                })

            if (selectedUser.adminAccess) {
                try {
                    await User.updateOne({ _id: selectedUser._id}, { $set: { adminAccess: false } })
                    ctx.send('❗ У пользователя сняты полномочия администратора')
                    return ctx.scene.step.go(0)
                } catch (e) {
					console.log(e)
					ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
					return ctx.scene.leave()
                }
            } else {
                ctx.send('❗ У пользователя нет полномочий администратора')
                return ctx.scene.step.go(0)
            }
        },

        // Удалить объявления пользователя
        async ctx => {
            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

            const selectedUser = ctx.scene.state.selectedUser
            
            try {
                await logAdminActions(ctx.senderId, 'deleteAllGoods', selectedUser.userId)
                await Good.deleteMany({ sellerId: selectedUser.userId }), 
                ctx.send('❗ У пользователя удалены все объявления')
                return ctx.scene.step.go(0)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
        },

        // Статистика
        async ctx => {
            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

            try {
                const goodsActiveCount = (await Good.find()).length
                const usersCount = (await User.find()).length
                const otherStats = await BotConfig.findOne()
    
                let sendString = `❗ Общая статистика:\n\nПоиски: ${otherStats.stats.countSearch} (${otherStats.stats.countFoundSearch} из них найденых)\nУдаленные товары: ${otherStats.stats.countDelete}\nВсего товаров: ${otherStats.stats.countGoods} (${goodsActiveCount} из них активные)\nПользователей: ${usersCount}`
    
                return ctx.send({
                    message: sendString,
                    keyboard: keyboard(previousMarkup)
                })   
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
        },
	])	
]

export default adminScene
