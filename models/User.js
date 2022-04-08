import mongoose from 'mongoose'
const Schema = mongoose.Schema

const goodSchema = new Schema({
	userId: {
		type: String,
		required: true,
	},

	username: {
		type: String,
		required: true,
	},

	adminAccess: { 
		type: Boolean, 
		default: false
	},

	settingsAccess: { 
		type: Boolean, 
		default: false
	},

	searchInfo: {
		count: {
			type: Number,
			default: 0
		},

		lastSearch: {
			type: Date,
			default: null
		}
	},

    freeSearch: {
        type: Number,
        default: 0
    },

    freeSell: {
        type: Number,
        default: 0
    }
})

const User = mongoose.model('User', goodSchema)

export default User