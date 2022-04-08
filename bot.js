import config from 'config'
console.log('CONFIG: ' + config.get('configName'))

import vk from './commonVK'

import './mongodb'
import './cron'
import './ws'


import { SessionManager } from '@vk-io/session'
import { SceneManager } from '@vk-io/scenes'

import { skipBotMessage, skipChat, checkOnlySub, checkUser, checkPromocode } from './middleware'
import baseSendMessage from './baseSendMessage'
import { searchScene, sellScene, profileScene, adminScene, superadminScene } from './scenes'

const sessionManager = new SessionManager()
const sceneManager = new SceneManager()

// middlewares
vk.updates.on('message', skipBotMessage)
vk.updates.use(skipChat)
vk.updates.on('message', checkOnlySub)
vk.updates.on('message', checkUser)
vk.updates.on('message', checkPromocode)

vk.updates.on('message_new', sessionManager.middleware)
vk.updates.on('message_new', sceneManager.middleware)
vk.updates.on('message_new', sceneManager.middlewareIntercept)
//

vk.updates.on('message_new', ctx => baseSendMessage(ctx))

// scenes
sceneManager.addScenes(searchScene)
sceneManager.addScenes(sellScene)
sceneManager.addScenes(profileScene)
sceneManager.addScenes(adminScene)
sceneManager.addScenes(superadminScene)
//

vk.updates.startPolling()
