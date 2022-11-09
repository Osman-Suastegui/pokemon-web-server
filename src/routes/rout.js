import { Router } from 'express'
import { getconnection, sql } from '../database/conexion.js'
import bcrypt from "bcrypt";
const saltRounds = 10;

const router = Router()

router.get('/obtenerPokemones', async (req, res) => {
    try {
        const pool = await getconnection();
        const result = await pool.request().query(`
            SELECT P.pokemonID,t.fuerza,t.defensa,t.velocidad,t.vida,t.tipo,p.nombre,p.img_frente from pokemones as p 
            INNER JOIN tiposPokemon as t ON p.tipoID = t.tipoID
        `)


        res.json(result.recordset)

    } catch (error) {
        res.send(error.message)
    }
})

router.get('/obtenerUsuarios', async (req, res) => {
    try {
        const pool = await getconnection();
        const result = await pool.request().query("SELECT nomusuario,email,puntaje FROM usuarios")
        res.send(result.recordset)

    } catch (error) {
        res.status(500)
        res.send(error.message)
    }

})

router.post("/existeUsuario", async (req, res) => {
    try {
        const { nomusuario } = req.body
        const pool = await getconnection();
        const usuarios = await pool.request().query("SELECT nomusuario FROM usuarios")
        const existeUsuario = { "existe": false }
        usuarios.recordset.map(usuario => {
            if (usuario.nomusuario == nomusuario) {
                existeUsuario.existe = true
            }
        })
        return res.status(200).send(existeUsuario)

    } catch (error) {
        res.send(error.message)
    }
})

router.post("/login", async (req, res) => {
    try {

        const { nomusuario, contra } = req.body

        const logged = {
            loggedIn: false,
            usuario: nomusuario,
            mensaje: "usuario o contrasenia invalidas"
        }
        const pool = await getconnection();
        const user = await pool.request()
            .input('nomusuario', sql.VarChar, nomusuario)
            .query("SELECT contrasenia FROM usuarios WHERE nomusuario = @nomusuario")

        const contraHash = user.recordset[0] == undefined ? " " : user.recordset[0].contrasenia

        if (bcrypt.compareSync(contra, contraHash)) { //cifraste la clave?
            logged.mensaje = "usuario o contrasenia validas"
            logged.loggedIn = true
        }

        return res.status(200).json(logged)


    } catch (error) {
        res.status(500).send(error.message)
    }
})
router.post("/obtenerPerfil", async (req, res) => {
    try {
        const { nomUsuario } = req.body
        const pool = await getconnection();
        const result = await pool.request()
            .input("nomusuario", sql.VarChar, nomUsuario)
            .query("SELECT * FROM usuarios WHERE nomusuario = @nomusuario")
        res.send(result.recordset[0])

    } catch (error) {
        res.send(error.message)
    }
})

router.post("/eliminarPokemon", async (req, res) => {
    try {
        const { usuario, pokemonID } = req.body
        const pool = await getconnection()
        await pool.request()
            .input("usuario", sql.VarChar, usuario)
            .input("pokemonID", sql.Int, pokemonID)
            .query("DELETE FROM usuario_pokemon WHERE usuario = @usuario AND pokemonID = @pokemonID")

        res.json({ "mensaje": "pokemon eliminado" })
    } catch (error) {
        console.log(error.message)
    }
})
router.post("/obtenerEquipo", async (req, res) => {
    try {
        const { usuario } = req.body
        console.log("usuari ", usuario)
        const pool = await getconnection();
        const pokemones = await pool.request()
            .input("usuario", sql.VarChar, usuario)
            .query(`
                SELECT P.pokemonID,T.tipo,T.velocidad,T.fuerza,T.defensa,T.vida, nombre,img_frente,img_espaldas
                FROM pokemones AS P INNER JOIN usuario_pokemon AS U 
                ON P.pokemonID = U.pokemonID 
                INNER JOIN tiposPokemon as T ON P.tipoID = T.tipoID
                WHERE usuario = @usuario
            `)
        res.json(pokemones.recordset)
    } catch (error) {
        console.log(error.message)

    }
})

router.post("/guardarPokemonEquipo", async (req, res) => {
    try {
        const { id, usuario } = req.body
        const pool = await getconnection();
        await pool.request()
            .input("usuario", sql.VarChar, usuario)
            .input("id", sql.Int, id)
            .query("INSERT INTO usuario_pokemon (usuario,pokemonID) VALUES(@usuario,@id)")
        res.json({ "mensaje": "pokemon agregado a tu lista" })
    } catch (error) {
        console.log(error.message)
    }
})

router.post('/registrarse', async (req, res) => {

 
    try {
        const { nomUsuario, email, contra } = req.body;

        // validamos que el usuario no exista
        const pool = await getconnection();
        const res2 = await pool.request()
            .input("nomusuario", sql.VarChar, nomUsuario)
            .query("SELECT * FROM usuarios WHERE nomusuario = @nomusuario")
        const existeUsuario = res2.recordset.length != 0
        if (existeUsuario) {
            res.json({ "mensaje": "El usuario ya se encuentra registrado" })
        } else {
            const hashContra = bcrypt.hashSync(contra, saltRounds);
            await pool.request()
                .input("nomusuario", sql.VarChar, nomUsuario)
                .input("email", sql.VarChar, email)
                .input("contrasenia", sql.VarChar, hashContra)
                .query('INSERT INTO usuarios (nomusuario,email,contrasenia) VALUES(@nomusuario,@email,@contrasenia)')
            res.json({ "mensaje": "Usuario agregado" })
        }

    } catch (error) {
        res.json({ "mensaje": error.message })
    }

})

router.get("/obtenerRanking", async (req, res) => {
    try {
        const pool = await getconnection();
        const result = await pool.request().query("SELECT nomusuario,puntaje FROM usuarios ORDER BY puntaje DESC")
        res.send(result.recordset)
    } catch (error) {
        res.send(error.message)
    }
})
export default router