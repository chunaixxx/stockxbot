import { StepScene } from '@vk-io/scenes'

import baseSendMessage from '../baseSendMessage.js'

import keyboard from '../markup/keyboard.js'

import { adminMenuMarkup } from '../markup/adminMarkup.js'
import previousMarkup from '../markup/previousMarkup.js'
import menuMarkup from '../markup/menuMarkup.js'

import { resetSearchInfo } from '../utils/updateSearchInfo.js'

import User from '../models/User.js'

const adminScene = [
	new StepScene('admin', [
		async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: 'Панель администратора',
                    keyboard: keyboard([...adminMenuMarkup, ...menuMarkup])
                })
            
            let action = null

			if (ctx.text == 'Меню') {
				baseSendMessage(ctx)
				return ctx.scene.leave()
			}
            
            if (ctx.text == 'Выдать расширенный доступ')
                action = 'Выдать расширенный доступ'
            
            if (ctx.text == 'Забрать расширенный доступ')
                action = 'Забрать расширенный доступ'
            
            if (ctx.text == 'Назначить администратора')
                action = 'Назначить администратора'
            
            if (ctx.text == 'Снять администратора')
                action = 'Снять администратора'

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
                return ctx.send({
                    message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору',
                    keyboard: keyboard(previousMarkup)
                })
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
                    await User.updateOne({ _id: selectedUser._id}, { $set: { extendedAccess: true } })
                    ctx.send('❗ Пользователю успешно выдан расширенный доступ')
                    return ctx.scene.step.go(0)
                } catch (e) {
                    console.log(e)
                    return ctx.send({
                        message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору',
                        keyboard: keyboard(previousMarkup)
                    })
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
                    await User.updateOne({ _id: selectedUser._id}, { $set: { extendedAccess: false } })
                    await resetSearchInfo(ctx.senderId)
                    ctx.send('❗ У пользователя снят расширенный доступ')
                    return ctx.scene.step.go(0)
                } catch (e) {
                    console.log(e)
                    return ctx.send({
                        message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору',
                        keyboard: keyboard(previousMarkup)
                    })
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
                    return ctx.send({
                        message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору',
                        keyboard: keyboard(previousMarkup)
                    })
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
                    return ctx.send({
                        message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору',
                        keyboard: keyboard(previousMarkup)
                    })
                }
            } else {
                ctx.send('❗ У пользователя нет полномочий администратора')
                return ctx.scene.step.go(0)
            }
        },
	])	
]

export default adminScene
