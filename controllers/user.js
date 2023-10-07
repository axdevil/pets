const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Publication = require("../models/publication");
const global = require("../config/global");
require("../config/db");

module.exports = {
    viewSignIn: function (req, res) {
        //VISTA DE LOGIN
        deleteSession(req.session);

        res.render("user/signIn", { error: null, incorrectData: null });
    },
    viewSignUp: function (req, res) {
        //VISTA DE REGISTRO
        deleteSession(req.session);

        res.render("user/signUp", { error: null, incorrectData: {} });
    },
    singUp: function (req, res) {
        //GUARDADO DE USUARIOS
        const { name, lastname, email, day, month, year, password } = req.body;

        bcrypt.hash(password, 8, async (err, hash) => {
            if (err) throw err;

            try {
                await new User({
                    name: name,
                    lastname: lastname,
                    email: email,
                    birthday: new Date(year + "-" + month + "-" + day),
                    password: hash,
                    picture: null,
                }).save();

                res.render("user/signIn", {
                    error: null,
                    incorrectData: email,
                });
            } catch (error) {
                res.render("user/signUp", {
                    error: "Correo en uso",
                    incorrectData: req.body,
                });
            }
        });
    },
    signIn: async function (req, res) {
        //INICIO DE SESION
        const { email, password } = req.body;
        const query = await User.findOne({ email: email }).lean();

        if (query) {
            bcrypt.compare(password, query.password, (err, result) => {
                if (err) throw err;
                if (result) {
                    req.session.user = query._id;
                    if (query.picture == null) {
                        res.render("user/addPicture");
                    } else {
                        res.redirect("/");
                    }
                } else {
                    incorrect("Contraseña incorrecta", email);
                }
            });
        } else {
            incorrect("Correo incorrecto", email);
        }

        function incorrect(error, data) {
            res.render("user/signIn", { error: error, incorrectData: data });
        }
    },
    skipAddPicture: async function (req, res) {
        //OMICION DE GUARDADO DE FOTO DE PERFIL Y PUESTA FOTO POR DEFAULT
        const filter = { _id: req.session.user };
        const update = {
            $set: {
                picture: "default.jpg",
            },
        };

        await User.updateOne(filter, update);

        res.redirect("/");
    },
    changePicture: async function (req, res) {
        //CAMBIO DE IMAGEN DE PERFIL
        const filter = { _id: req.session.user };
        const update = {
            $set: {
                picture: req.file.filename,
            },
        };

        await User.updateOne(filter, update);

        res.redirect("/");
    },
    viewProfile: async function (req, res) {
        const profile = await User.findById(req.params.id).lean(); //OBTENCION DE INFORMACIÓN DEL PERFIL
        const publications = await Publication.find({ user: req.params.id })
            .sort({ createdAt: -1 })
            .select("description multimedia createdAt")
            .lean();

        publications.forEach((pub) => {
            pub.user = {
                _id: profile._id,
                name: profile.name,
                lastname: profile.lastname,
                picture: profile.picture,
            };
        });

        //PERFIL DE USUARIO
        res.render("user/profile", {
            barProfile: await global.getPictureProfile(req.session),
            profile,
            publications,
            selfId: req.session.user
        });
    },
};

function deleteSession(session) {
    if (session) {
        session.destroy((err) => {
            if (err) throw err;
        });
    }
}
