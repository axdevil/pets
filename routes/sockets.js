const User = require("../models/user");
const Publication = require("../models/publication");
const Chat = require("../models/chat");
require("../config/db");

module.exports = (server) => {
    const io = require("socket.io")(server);

    io.on("connection", (socket) => {
        /* USER */
        //SEGUIR USUARIOS
        socket.on("follow", async (_id, selfId) => {
            if (_id != selfId) {
                let follow = false;
                const following = await User.findById(selfId).select("following").lean();
                // Comprobar si ya se sigue, si es correcto eliminarlo
                const promises = following.following.map(async (user) => {
                    if (user == _id) {
                        await User.findByIdAndUpdate(selfId, { $pull: { following: _id } });
                        await User.findByIdAndUpdate(_id, { $pull: { followers: selfId } });
                        return true;
                    }
                    return false;
                });

                const results = await Promise.all(promises);
                follow = results.some((result) => result);
                // Si no se sigue se añade
                if (!follow) {
                    // Añadir a seguidores al dueño del perfil
                    await User.findByIdAndUpdate(_id, { $push: { followers: selfId } });
                    // Añadir a siguiendo al usuario conectado
                    await User.findByIdAndUpdate(selfId, { $push: { following: _id } });
                }
            }
        });
        /*---- PUBLICACIONES ----*/
        //LIKES
        socket.on("like", async (idPub, selfId) => {
            const liked = await Publication.findOne({
                _id: idPub,
                likes: {
                    $elemMatch: {
                        $eq: selfId,
                    },
                },
            });

            if (!liked) {
                await Publication.findByIdAndUpdate(idPub, {
                    $push: { likes: selfId },
                });
            } else {
                await Publication.findByIdAndUpdate(idPub, {
                    $pull: { likes: selfId },
                });
            }
        });

        //COMENTARIOS
        socket.on("newComment", async (idPub, selfId, text) => {
            await Publication.findByIdAndUpdate(idPub, {
                $push: { comments: { user: selfId, text: text } },
            });

            fillComments(socket, idPub);
        });
        socket.on("onFillComments", async (idPub) => {
            fillComments(socket, idPub);

            const likes = await Publication.findById(idPub).select("likes").populate("likes", "name lastname picture").lean();
            socket.emit("fillLikes", likes.likes);
        });

        /*--- CHAT ---*/
        //NUEVO MENSAJE
        socket.on("sendMsg", async (senderId, receiverId, msg) => {
            await new Chat({
                sender: senderId,
                receiver: receiverId,
                msg: msg,
            }).save();
        });
    });
};

async function fillComments(socket, idPub) {
    const comments = await Publication.findById(idPub)
        .select("comments")
        .populate({ path: "comments", populate: { path: "user", select: "name lastname picture" } })
        .lean();

    socket.emit("fillComments", [...comments.comments].reverse());
}
