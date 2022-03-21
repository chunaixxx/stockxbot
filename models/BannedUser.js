import mongoose from 'mongoose'
const Schema = mongoose.Schema

const bannedUserSchema = new Schema({
	userId: {
		type: String,
		required: true,
	},

	expiresIn: {
		type: Date,
		required: true,
	},

    bannedAt: {
		type: Date,
		default: Date.now
	},

    reason: {
        type: String,
        default: null,
    }
})

const BannedUser = mongoose.model('BannedUser', bannedUserSchema)

export default BannedUser
