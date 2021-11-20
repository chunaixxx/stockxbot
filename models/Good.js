import mongoose from 'mongoose'
const Schema = mongoose.Schema

const goodSchema = new Schema({
	sellerId: {
		type: String,
		required: true,
	},

	sellerName: { 
		type: String, 
		required: true
	},

	goodName: { 
		type: String,
		index: true,
		required: true
	},

	filename: { 
		type: String,
		required: true
	},

	link: {
		type: String,
		required: true
	},

	size: { 
		type: String, 
		default: null
	 },

	price: { 
		type: Number, 
		required: true 
	},
	
	city: {
		type: String,
		required: true,
	},
})

const Good = mongoose.model('Good', goodSchema)

export default Good

// const user = new Good({
//     seller: 'vk.com/chunaipalich',
//     sellerName: 'Даниил Кириллов',
//     urlGood: 'stockx.com/reebok',
//     size: '5 US',
//     price: 10000,
//     city: 'Москва'
// })

// user.save(err => {
//     mongoose.disconnect()

//     if (err) return console.log(err)
//     console.log('Сохранен объект', user)
// })
