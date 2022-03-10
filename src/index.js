const express = require('express')
const {ApolloServer} = require('apollo-server-express')
require('dotenv').config()
const db = require('./db')
const models = require('./models')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')
const jwt = require('jsonwebtoken')

const getUser = (token) => {
    if(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET)
        } catch (err) {
            new Error("session invalid")
        }

    }
}

const port = process.env.PORT || 3000

const DB_HOST = process.env.DB_HOST

const app = express()
db.connect(DB_HOST)
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) => {
        const token = req.headers.authorization
        const user = getUser(token)
        return {models, user}
    }
})

server.start().then(res => {
    server.applyMiddleware({app, path:'/api'})
})

app.listen({port}, () => {
    console.log('GraphQL server running at port 3000')
})

//Страница 100