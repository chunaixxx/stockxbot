import '../mongodb.js'
import User from '../models/User.js'
import BotConfig from '../models/BotConfig.js'

import { StepScene } from '@vk-io/scenes'

import keyboard from '../markup/keyboard.js'
import { settingsMenuMarkup } from '../markup/adminMarkup.js'
import menuMarkup from '../markup/menuMarkup.js'

import baseSendMessage from '../baseSendMessage.js'
import previousMarkup from '../markup/previousMarkup.js'

import convertDate from '../utils/convertDate.js'
import { resetSearchInfo } from '../utils/updateSearchInfo.js'

const superadminScene = [
	new StepScene('superadmin', [
		async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text) {
                const lastAdminActions = (await BotConfig.findOne()).lastAdminActions

                
                let deleteGoods = lastAdminActions?.deleteAllGoods
                let giveExtened = lastAdminActions?.giveExtendedAccess
                let takeExtened = lastAdminActions?.takeExtendedAccess

                let sendString = `❗ Последние действия администраторов: \n\n`

                if (deleteGoods?.adminName)
                    sendString += `Удаление всех товаров пользователя:\n ${deleteGoods?.adminName} (ID ${deleteGoods?.adminID}), ${convertDate(deleteGoods?.dateOfAction)}\nID пользователя: ${deleteGoods?.userID} (vk.com/id${deleteGoods?.userID})\n\n`
                else
                    sendString += `Удаление всех товаров пользователя: Запись отсутствует\n\n`

                if (giveExtened?.adminName)
                    sendString += `Выдача расширенного доступа:\n ${giveExtened?.adminName} (ID ${giveExtened?.adminID}), ${convertDate(giveExtened?.dateOfAction)}\nID пользователя: ${giveExtened?.userID} (vk.com/id${giveExtened?.userID})\n\n`
                else
                    sendString += `Выдача расширенного доступа: Запись отсутствует\n\n`

                if (takeExtened?.adminName)
                    sendString += `Удаление расширенного доступа:\n ${takeExtened?.adminName} (ID ${takeExtened?.adminID}), ${convertDate(takeExtened?.dateOfAction)}\nID пользователя: ${takeExtened?.userID} (vk.com/id${takeExtened?.userID})\n\n`
                else
                    sendString += `Удаление расширенного доступа: Запись отсутствует\n\n`

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

            if (ctx.text == 'Время отката')
                return ctx.scene.step.go(1)

            if (ctx.text == 'Максимальное кол-во поисков')
                return ctx.scene.step.go(2)

            if (ctx.text == 'Максимальное кол-во товаров')
                return ctx.scene.step.go(3)
		},

        // Время отката
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: '❗ Введите количество минут для отката поиска бесплатного доступа',
                    keyboard: keyboard([...previousMarkup]),
                })

            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

            // Находится ли в строке только цифры?
			const patternNumber = /^\d+$/
			if (patternNumber.test(ctx.text) == false)
				return ctx.send('❗ Укажите количество минут в прафильном формате:\n\n❌ 10.000 мин.\n✔️ 10000')

            try {
                await BotConfig.updateOne({}, { cooldownSearch: +ctx.text * 1000 * 60 })

                await resetSearchInfo('*')

                ctx.send('❗ Время отката для поиска успешно изменено')
                return ctx.scene.step.go(0)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка при изменении времени отката, обратитесь к тех.администратору')
                ctx.scene.leave()
            }
        },

        // Максимальное кол-во поисков'
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: '❗ Введите количество поисков для бесплатного доступа',
                    keyboard: keyboard([...previousMarkup]),
                })

            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

			const patternNumber = /^\d+$/
			if (patternNumber.test(ctx.text) == false)
				return ctx.send('❗ Укажите количество поисков в прафильном формате:\n\n❌ 10 поисков \n✔️ 10')

            try {
                await BotConfig.updateOne({}, { maxSearch: +ctx.text })

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
                    message: '❗ Введите количество товаров для бесплатного доступа',
                    keyboard: keyboard([...previousMarkup]),
                })

            if (ctx.text == 'Назад')
                return ctx.scene.step.go(0)

            // Находится ли в строке только цифры?
			const patternNumber = /^\d+$/
			if (patternNumber.test(ctx.text) == false)
				return ctx.send('❗ Укажите количество товаров в прафильном формате:\n\n❌ 10 товаров \n✔️ 10')

            try {
                await BotConfig.updateOne({}, { maxGoods: +ctx.text })
                ctx.send('❗ Количество бесплатных товаров успешно изменено')
                return ctx.scene.step.go(0)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка при изменении времени отката, обратитесь к тех.администратору')
                ctx.scene.leave()
            }
        }
	]),
]

export default superadminScene
