import dotenv from 'dotenv'
import { VK } from 'vk-io'

dotenv.config()

const vk = new VK({
	token: process.env.TOKEN,
	pollingGroupId: process.env.GROUP_ID,
})

export default vk
