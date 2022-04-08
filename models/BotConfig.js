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
		},

        archiving: {
            lastDate: {
                type: Date,
                default: Date.now()
            },

            lastCount: {
                type: Number,
                default: null
            }
        }
	},

	lastAdminActions: {
		deleteAllGoods: { 
			adminName: {
				type: String, 
				default: null
			},

			adminId: {
				type: Number, 
				default: null
			},

			dateOfAction: {
				type: Date, 
				default: null
			},

			userId: {
				type: String,
				default: null
			}
		},

		extendExtendedAccess: {
			adminName: {
				type: String, 
				default: null
			},

			adminId: {
				type: Number, 
				default: null
			},

			dateOfAction: {
				type: Date, 
				default: null
			},

			userId: {
				type: String,
				default: null
			}
		},

        giveExtendedAccess: {
			adminName: {
				type: String, 
				default: null
			},

			adminId: {
				type: Number, 
				default: null
			},

			dateOfAction: {
				type: Date, 
				default: null
			},

			userId: {
				type: String,
				default: null
			}
		},

		takeExtendedAccess: { 
			adminName: {
				type: String, 
				default: null
			},

			adminId: {
				type: Number, 
				default: null
			},

			dateOfAction: {
				type: Date, 
				default: null
			},

			userId: {
				type: String,
				default: null
			}
		},

        banUser: { 
			adminName: {
				type: String, 
				default: null
			},

			adminId: {
				type: Number, 
				default: null
			},

			dateOfAction: {
				type: Date, 
				default: null
			},

			userId: {
				type: String,
				default: null
			}
		},

        unbanUser: { 
			adminName: {
				type: String, 
				default: null
			},

			adminId: {
				type: Number, 
				default: null
			},

			dateOfAction: {
				type: Date, 
				default: null
			},

			userId: {
				type: String,
				default: null
			}
		},
	}
})

const BotConfig = mongoose.model('BotConfig', botConfigSchema)

export default BotConfig