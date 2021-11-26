import mongoose from 'mongoose'
const Schema = mongoose.Schema

const botConfigSchema = new Schema({
	fullAccessEveryBody: { 
		type: Boolean, 
		default: false
	},

	cooldownSearch: { 
		type: Number, 
		default: 2592000000
	},

	maxGoods: {
		type: Number,
		default: 3
	},

	maxSearch:  {
		type: Number,
		default: 3
	},

	stats: {
		countFoundSearch: {
			type: Number,
			default: 0
		},

		countSearch: {
			type: Number,
			default: 0
		},

		countDelete: {
			type: Number,
			default: 0
		},

		countGoods: {
			type: Number,
			default: 0
		}
	},

	lastAdminActions: {
		deleteAllGoods: { 
			adminName: {
				type: String, 
				default: null
			},

			adminID: {
				type: Number, 
				default: null
			},

			dateOfAction: {
				type: Date, 
				default: null
			},

			userID: {
				type: String,
				default: null
			}
		},

		giveExtendedAccess: {
			adminName: {
				type: String, 
				default: null
			},

			adminID: {
				type: Number, 
				default: null
			},

			dateOfAction: {
				type: Date, 
				default: null
			},

			userID: {
				type: String,
				default: null
			}
		},

		takeExtendedAccess: { 
			adminName: {
				type: String, 
				default: null
			},

			adminID: {
				type: Number, 
				default: null
			},

			dateOfAction: {
				type: Date, 
				default: null
			},

			userID: {
				type: String,
				default: null
			}
		},
	}
})

const BotConfig = mongoose.model('BotConfig', botConfigSchema)

export default BotConfig