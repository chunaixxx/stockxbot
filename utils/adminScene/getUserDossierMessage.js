import convertDate from '../convertDate'

// Выдает информацию о пользователе в текстовом виде для администраторов
export default ({ username, userId, searchInfo, extendedAccess, settingsAccess, bannedUser, countGoods }) => {
    let title = `❗ @id${ userId } (${ username })\n`
    
    title += extendedAccess ? 'Полный доступ' : 'Без доступа'
    title += settingsAccess ? ', владелец' : ', администратор'

    if (bannedUser)
        title += `\n\n🚫 Заблокирован.\nПричина: ${ bannedUser.reason }\nИстекает: никогда`

    const lastSearch = searchInfo.lastSearch ? convertDate(searchInfo.lastSearch) : 'отсутствует'

    return `${ title }\n\nПоисков: ${ searchInfo.count } (Последний поиск: ${ lastSearch })\nТоваров: ${ countGoods }`
}