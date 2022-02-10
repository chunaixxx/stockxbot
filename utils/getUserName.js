import config from 'config'
import api from 'node-vk-bot-api/lib/api.js'

const getUserName = async id => {
	if (id > 0) {
		const usersGet = await api('users.get', {
			user_ids: id,
			access_token: config.get('token'),
		})
	
		const firstname = usersGet.response[0].first_name
		const lastname = usersGet.response[0].last_name
	
		return { firstname, lastname }
	} else {
		return { firstname: 'No', lastname: 'Name' }
	}
}

export default getUserName