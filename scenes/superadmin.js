import BotConfig from '../models/BotConfig'

import { StepScene } from '@vk-io/scenes'

import keyboard from '../markup/keyboard'
import { settingsMenuMarkup } from '../markup/adminMarkup'
import menuMarkup from '../markup/menuMarkup'

import baseSendMessage from '../baseSendMessage'
import previousMarkup from '../markup/previousMarkup'

import convertDate from '../utils/convertDate'
import { resetSearchInfo } from '../utils/updateSearchInfo'

const superadminScene = [
	new StepScene('superadmin', [
		async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text) {
                const { deleteAllGoods, giveExtendedAccess, takeExtendedAccess } = (await BotConfig.findOne()).lastAdminActions

                let sendString = `❗ Последние действия администраторов: \n\n`

                const logBlock = (logTitle, { adminName, adminID, dateOfAction, userID}) => {
                    if (adminName)
                        return `${ logTitle }:\n ${adminName} (ID ${adminID}), ${convertDate(dateOfAction)}\nID пользователя: ${userID} (vk.com/id${userID})\n\n`
                    else
                        return `${ logTitle }: Запись отсутствует\n\n`                        
                }

                sendString += logBlock('Удаление всех товаров пользователя', deleteAllGoods)
                sendString += logBlock('Выдача расширенного доступа', giveExtendedAccess)
                sendString += logBlock('Удаление расширенного доступа', takeExtendedAccess)

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
                case 'Время отката':
                    return ctx.scene.step.go(1)
                case 'Максимальное кол-во поисков':
                    return ctx.scene.step.go(2)
                case 'Максимальное кол-во товаров':
                    return ctx.scene.step.go(3)
            }
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
				return ctx.send('❗ Укажите количество минут в прафильном формате:\n\n❌ 10.000 мин.\n✅ 10000')

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
				return ctx.send('❗ Укажите количество поисков в правильном формате:\n\n❌ 10 поисков \n✅ 10')

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
				return ctx.send('❗ Укажите количество товаров в прафильном формате:\n\n❌ 10 товаров \n✅ 10')

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
