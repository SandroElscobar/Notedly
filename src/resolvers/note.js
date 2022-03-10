module.exports = {
    author: async (note, args, { models }) => {
        return models.User.findById(note.author)
        console.log(note.author)
    },
    favoriteBy: async (note, args, {models}) => {
        return await models.User.find({_id : {$in: note.favoriteBy}})
    }
}