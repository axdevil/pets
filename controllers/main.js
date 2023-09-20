const global = require("../config/global");
const User = require("../models/user");
const Publication = require("../models/publication");
require("../config/db");

module.exports = {
    viewHome: function (req, res) {
        global.ifSession(req, res, async () => {
            const date = new Date();

            //FOTO DE PERFIL
            const pictureProfile = await User.findById(req.session.user)
                .select("picture")
                .lean();
            //ULTIMAS PUBLICACIONES
            const lastPublications = await Publication.find({
                user: req.session.user,
                createdAt: {
                    $gte: date.setDate(date.getDate() - 1),
                },
            })
                .sort({ createdAt: -1 }).select("description multimedia createdAt")
                .populate("user","name lastname picture")
                .lean();

            res.render("main/index", {
                pictureProfile: pictureProfile.picture,
                lastPublications,
            });
        });
    },
};
