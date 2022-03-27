import { 
    addExtendedMarkup, 
    removeExtendedMarkup, 
    addAdminMarkup, 
    deleteAdminMarkup, 
    banMarkup, 
    unBanMarkup 
} from '../../markup/adminMarkup'

// Собирает клавиатуру для управления пользователем
export default ({ user, admin }) => {
    const markup = []

    if (user.settingsAccess == false || user.userId == admin.userId) {
        // Отображение кнопки "выдать расширенный доступ" или забрать
        if (user.extendedAccess)
            markup.push(removeExtendedMarkup)
        else
            markup.push(addExtendedMarkup)

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