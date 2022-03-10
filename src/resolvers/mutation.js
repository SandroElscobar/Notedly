const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {AuthenticationError, ForbiddenError} = require('apollo-server-express')
const mongoose = require('mongoose')
require('dotenv').config()
require("../models");

const gravatar = require('gravatar')
module.exports = {
        newNote: async (parent, args, {models, user}) => {
            if(!user) {
                throw new Error("Вы должны авторизоваться для добавление заметки")
            }
            return await models.Note.create({
                content: args.content,
                author: mongoose.Types.ObjectId(user.id),
            })
        },
        deleteNote: async (parent, {id}, {models, user}) => {
            if(!user) {
                throw new AuthenticationError("Вы должны войти в систему чтобы удалить этот пост!")
            }

            const note = await models.Note.findById(id)
            if (note && String(note.author) !== user.id) {
                throw new Error("У вас нет разрешений на удаление этой заметки")
            }
            try {
                await note.remove()
                return true
            } catch (err) {
                return false
            }
        },
        updateNote: async (parent, {content, id}, {models, user}) => {
            if(!user) {
                throw new Error('Вы должны войти в систему чтобы редактировать заметку')
            }
            const note = await models.Note.findById(id)
            if (note && String(note.author) !== user.id) {
                throw new Error("У вас не достаточно прав для редактирования этой заметки")
            }
            return models.Note.findOneAndUpdate(
                {_id: id},
                {$set: {content}},
                {new: true}
            );
        },
        signUp: async (parent, {username, email, password}, {models}) => {
            email = email.trim().toLowerCase()
            const hashed = await bcrypt.hash(password, 10)
            const avatar = gravatar.url(email)
            try {
                const user = await models.User.create({
                    username,
                    email,
                    avatar,
                    password: hashed
                })
                return jwt.sign({id: user._id}, process.env.JWT_SECRET)
            } catch (err) {
                console.log(err)
                throw new Error('Error creating acount')
            }
        },
        signIn: async (parent, {username, email, password}, {models}) => {
            if(email) {
                email = email.trim().toLowerCase()
            }
            const user = await models.User.findOne({
                $or: [{email}, {username}]
            })
            if (!user) {
                throw new Error("Error signing in")
            }

            const valid = await bcrypt.compare(password, user.password)
            if(!valid) {
                throw new  Error("Error sign in")
            }
            return jwt.sign({id: user._id}, process.env.JWT_SECRET)
        },
        toggleFavorite: async (parent, {id},{models, user}) => {
            if(!user) {
                throw new AuthenticationError()
            }

            let noteCheck = await models.Note.findById(id)
            const hasUser = noteCheck.favoriteBy.indexOf(user.id)

            if (hasUser >= 0) {
                return models.Note.findByIdAndUpdate(
                    id,
                    {
                        $pull: {
                            favoriteBy: mongoose.Types.ObjectId(user.id)
                        },
                        $inc: {
                            favoriteCount: -1
                        }
                    },
                    {
                        new: true
                    }
                );
            } else {
                return models.Note.findByIdAndUpdate(
                    id,
                    {
                        $push: {
                            favoriteBy: mongoose.Types.ObjectId(user.id)
                        },
                        $inc: {
                            favoriteCount: 1
                        }
                    },
                    {
                        new: true
                    }
                );
            }
        }
}