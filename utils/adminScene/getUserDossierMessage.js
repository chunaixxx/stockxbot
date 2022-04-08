import convertDate from '../convertDate'
import moment from 'moment'

// Выдает информацию о пользователе в текстовом виде для администраторов
export default ({ username, userId, searchInfo, extendedAccess, adminAccess, freeSearch, freeSell, settingsAccess, bannedUser, countGoods }) => {
    let title = `❗ @id${ userId } (${ username })\n`
    
    if (extendedAccess) {
        title += `🚀 PRO (Выдан: ${ moment().format('DD.MM.YYYY') }.`

        if (extendedAccess.forever)
            title += ` Заканчивается: ∞)`
        else 
            title += ` Заканчивается: ${ moment(extendedAccess.expiresAt).format('DD.MM.YYYY') })`
        
    } else {
        title += 'Пользователь'
    }

    if (settingsAccess)
        title += ', владелец, администратор'
    else if (adminAccess)
        title += ', администратор'

    if (bannedUser)
        title += `\n\n🚫 Заблокирован.\nПричина: ${ bannedUser.reason }\nИстекает: никогда`

    const lastSearch = searchInfo?.lastSearch ? convertDate(searchInfo.lastSearch) : 'отсутствует'

    title += `\n\nПоисков: ${ searchInfo?.count } (Последний поиск: ${ lastSearch })\nТоваров: ${ countGoods }`

    if (extendedAccess == null) {
        title += `\nБесплатных поисков: ${ freeSearch }\nБесплатных объявлений: ${ freeSell }`
    }

    return title
}