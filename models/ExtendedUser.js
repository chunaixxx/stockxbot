import mongoose from 'mongoose'
const Schema = mongoose.Schema

const extendedUserSchema = new Schema({
	userId: {
		type: String,
		required: true,
	},

	givenAt: {
		type: Date,
		default: Date.now()
	},

	expiresAt: {
		type: Date,
		default: null
	},

    forever: {
        type: Boolean,
        default: false
    }
})

const ExtendedUser = mongoose.model('ExtendedUser', extendedUserSchema)

export default ExtendedUser
