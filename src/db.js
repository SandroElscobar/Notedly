const mongoose = require('mongoose')

module.exports = {
    connect: DB_HOST => {
        mongoose.connect((DB_HOST))
        mongoose.connection.on('error', err => {
            console.log(err)
            console.log('MongoDB connection error. Pleace make sure MongoDB is running.')
            process.exit()
        })
    },
    close: () => {
        mongoose.connection.close()
    }
}