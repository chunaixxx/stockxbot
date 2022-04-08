import { 
    addExtendedMarkup,
    extendExtendedMarkup,
    removeExtendedMarkup, 
    addAdminMarkup, 
    deleteAdminMarkup, 
    banMarkup, 
    unBanMarkup,
    manageSearchSellMenuMarkup
} from '../../markup/adminMarkup'

// Собирает клавиатуру для управления пользователем
export default ({ user, admin }) => {
    const markup = []

    if (user.settingsAccess == false || user.userId == admin.userId) {
        // Кнопки: выдать, забрать, продлить
        if (user.extendedAccess) {
            markup.push(removeExtendedMarkup)

            if (!user.extendedAccess.forever)
                markup.push(extendExtendedMarkup)
        } else {
            markup.push(addExtendedMarkup)
            markup.push(manageSearchSellMenuMarkup)
        }

        // Отображение кнопки "снять админа" или "добавить админа"
        if (admin.settingsAccess && admin.userId != user.userId && user.settingsAccess == false)
            if (user.adminAccess)
                markup.push(deleteAdminMarkup)
            else
                markup.push(addAdminMarkup)

        // Отображение кнопки заблокировать или разблокировать
        if (user.adminAccess == false && user.userId !== admin.userId) {
            if (user.bannedUser)
                markup.push(unBanMarkup)
            else
                markup.push(banMarkup)
        }
    }

    return markup
}