import './mongodb.js'

import User from './models/User.js'

import { HearManager } from '@vk-io/hear'
import { QuestionManager } from 'vk-io-question'
import { SessionManager } from '@vk-io/session'
import { SceneManager } from '@vk-io/scenes'

import baseSendMessage from './baseSendMessage.js'

import searchScene from './scenes/search.js'
import sellScene from './scenes/sell.js'
import profileScene from './scenes/profile.js'
import adminScene from './scenes/admin.js'

import getUserName from './utils/getUserName.js'
import { resetSearchInfo } from './utils/updateSearchInfo.js'

import vk from './commonVK.js'

const sessionManager = new SessionManager()
const sceneManager = new SceneManager()
const questionManager = new QuestionManager()
const hearManager = new HearManager()

vk.updates.on('message_new', sessionManager.middleware)
vk.updates.on('message_new', sceneManager.middleware)
vk.updates.on('message_new', sceneManager.middlewareIntercept)
vk.updates.use(questionManager.middleware)
vk.updates.on('message', hearManager.middleware)

vk.updates.on('message_new', ctx => baseSendMessage(ctx))

sceneManager.addScenes(searchScene)
sceneManager.addScenes(sellScene)
sceneManager.addScenes(profileScene)
sceneManager.addScenes(adminScene)

vk.updates.startPolling()
