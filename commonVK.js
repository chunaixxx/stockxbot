import config from 'config'
import { VK } from 'vk-io'

const vk = new VK({
	token: config.get('token'),
	pollingGroupId: config.get('groupID'),
})

export default vk
