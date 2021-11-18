import fs from 'fs'

const fileIsExist = filepath => {
	return new Promise((resolve, reject) => {
		fs.access(filepath, fs.constants.F_OK, error => {
			resolve(!error)
		})
	})
}

export default fileIsExist
