import { StepScene } from '@vk-io/scenes'

import BotConfig from '../models/BotConfig'
import User from '../models/User'
import Promocode from '../models/Promocode'

import baseSendMessage from '../baseSendMessage'

import keyboard from '../markup/keyboard'
import { settingsMenuMarkup, createPromocodeMarkup } from '../markup/adminMarkup'
import { menuMarkup, previousMarkup, skipMarkup } from '../markup/generalMarkup'

import { createPromocode, deletePromocode } from '../controllers/promocode'

import convertDate from '../utils/convertDate'

const superadminScene = [
	new StepScene('superadmin', [
		async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text) {
                const { giveExtendedAccess, extendExtendedAccess, takeExtendedAccess, deleteAllGoods, banUser, unbanUser} = (await BotConfig.findOne()).lastAdminActions

                let sendString = `❗ Последние действия администраторов: \n\n`

                const logBlock = async (logTitle, { adminName, adminId, dateOfAction, userId}) => {
                    if (adminName) {
                        const userName = (await User.findOne({ userId }))?.username || 'No Name'
                        return `${ logTitle }:\nАдминистратор: @id${adminId} (${adminName})\nПользователь: @id${userId} (${userName})\n${convertDate(dateOfAction)}\n\n`
                    } else {
                        return `${ logTitle }: Запись отсутствует\n\n`        
                    }
                }

                sendString += await logBlock('Выдача PRO', giveExtendedAccess)
                sendString += await logBlock('Продление PRO', extendExtendedAccess)
                sendString += await logBlock('Удаление PRO', takeExtendedAccess)
                sendString += await logBlock('Удаление всех товаров пользователя', deleteAllGoods)
                sendString += await logBlock('Выдача бана', banUser)
                sendString += await logBlock('Снятие бана', unbanUser)

                sendString += '❗ Панель настроек чат-бота, выберите пункт для изменения параметров чат-бота'

                ctx.send({
                    message: sendString,
                    keyboard: keyboard([...settingsMenuMarkup, ...menuMarkup]),
                })
            }

            if (ctx.text == 'Меню') {
                baseSendMessage(ctx)
                return ctx.scene.leave()
            }

            switch (ctx.text) {
                case 'Поисков в месяц':
                    return ctx.scene.step.go(1)
                case 'Объявлений в месяц':
                    return ctx.scene.step.go(2)
                case 'Промокоды':
                    return ctx.scene.step.go(3)
            }
		},

        // Максимальное кол-во поисков
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: '❗ Укажи количество бесплатных поисков в месяц',
                    keyboard: keyboard([...previousMarkup]),
                })

            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

			const patternNumber = /^\d+$/
			if (patternNumber.test(ctx.text) == false)
				return ctx.send('❗ Укажите количество поисков в правильном формате:\n\n❌ 10 поисков \n✅ 10')

            try {
                await BotConfig.updateOne({}, { maxSearch: +ctx.text })

                await User.updateMany(
                    { },
                    {
                        freeSearch: +ctx.text
                    }
                )

                ctx.send('❗ Количество бесплатных поисков успешно изменено')
                return ctx.scene.step.go(0)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка при изменении времени отката, обратитесь к тех.администратору')
                ctx.scene.leave()
            }
        },

        // Максимальное кол-во товаров'
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: '❗ Укажи количество бесплатных объявлений в месяц',
                    keyboard: keyboard([...previousMarkup]),
                })

            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

            // Находится ли в строке только цифры?
			const patternNumber = /^\d+$/
			if (patternNumber.test(ctx.text) == false)
				return ctx.send('❗ Укажите количество товаров в прафильном формате:\n\n❌ 10 товаров \n✅ 10')

            try {
                await BotConfig.updateOne({}, { maxGoods: +ctx.text })

                await User.updateMany(
                    { },
                    {
                        freeSell: +ctx.text
                    }
                )

                ctx.send('❗ Количество бесплатных товаров успешно изменено')
                return ctx.scene.step.go(0)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка при изменении времени отката, обратитесь к тех.администратору')
                ctx.scene.leave()
            }
        },

        // Промокоды
        async ctx => {
            ctx.scene.state.selectedPromocode = null

            const promocodes = await Promocode.find()
            ctx.scene.state.promocodes = promocodes

            try {
                if (ctx.scene.step.firstTime || !ctx.text) {
                    let message = '❗ Укажи номер промокода, чтобы его удалить\n\n'

                    if (promocodes.length !== 0) {
                        promocodes.forEach((promocode, i) => {
                            const date = promocode.days == 0 ? 'Навсегда' : promocode.days + ' дней'
                            const activated = promocode.activated == null ? 'Не активирован' : `@id${ promocode.activated.userId } (${ promocode.activated.username })`
    
                            message += `[${i + 1}] ${ promocode.promocode } | ${ date } | ${ activated }\n`
                        })
                    } else {
                        message = '❗ Промокоды не найдены'
                    }

                    return ctx.send({
                        message,
                        keyboard: keyboard([...createPromocodeMarkup, ...previousMarkup])
                    })
                }

                const patternNumber = /^\d+$/

                if (patternNumber.test(ctx.text) && +ctx.text <= promocodes.length) {
                    await deletePromocode(promocodes[+ctx.text - 1].promocode)
                    ctx.send('❗ Промокоды удален')
                    return ctx.scene.step.go(3)
                }

                if (ctx.text == 'Назад')
                    return ctx.scene.step.go(0)

                if (ctx.text == 'Создать промокод')
                    return ctx.scene.step.go(4)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка при изменении времени отката, обратитесь к тех.администратору')
                ctx.scene.leave()
            }
        },

        // Создать промокод, указать имя
        async ctx => {
            try {
                if (ctx.scene.step.firstTime || !ctx.text)
                    return ctx.send({
                        message: '❗ Укажи промокод',
                        keyboard: keyboard(previousMarkup)
                    })

                const promocodes = ctx.scene.state.promocodes
                const filteredPromocodes = promocodes.filter(promocode => promocode.promocode == ctx.text)

                if (filteredPromocodes.length)
                    return ctx.send({
                        message: '❗ Такой промокод уже есть. Придумай другой',
                        keyboard: keyboard(previousMarkup)
                    })

                if (ctx.text == 'Назад')
                    return ctx.scene.step.go(3)

                ctx.scene.state.selectedPromocode = ctx.text
                ctx.scene.step.next()
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка при изменении времени отката, обратитесь к тех.администратору')
                ctx.scene.leave()
            }
        },

        // Указать длительность PRO-версии для промокода
        async ctx => {
            try {
                if (ctx.scene.step.firstTime || !ctx.text)
                    return ctx.send({
                        message: '❗ Укажи количество дней на которое будет выдаваться/продливаться PRO-версия. Можешь нажать на кнопку — Пропустить, тогда PRO-версия будет выдана навсегда',
                        keyboard: keyboard([...skipMarkup, ...previousMarkup])
                    })

                if (ctx.text == 'Назад')
                    return ctx.scene.step.go(4)

                const promocode = ctx.scene.state.selectedPromocode
                const patternNumber = /^\d+$/

                if (ctx.text == 'Пропустить') {
                    await createPromocode(promocode, 0)
                } else if (patternNumber.test(ctx.text)) {
                    await createPromocode(promocode, +ctx.text)
                } else {
                    return ctx.send({
                        message: '❗ Укажи целочисленное число. Попробуй еще раз',
                        keyboard: keyboard(previousMarkup)
                    })
                }

                ctx.send('❗ Промокод успешно создан')
                return ctx.scene.step.go(3)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка при изменении времени отката, обратитесь к тех.администратору')
                ctx.scene.leave()
            }
        }
	]),
]

export default superadminScene
