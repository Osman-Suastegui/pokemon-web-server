import { Router } from 'express'
import { getconnection, sql } from '../database/conexion.js'
import bcrypt from "bcrypt";
const saltRounds = 10;

const router = Router()


router.get("/obtenerPuntaje/:usuario",async(req,res) => {
    const usuario = req.params.usuario
    const pool = await getconnection();
    const result = await pool.request()
    .input("usuario",sql.VarChar,usuario)
    .query("SELECT puntaje FROM usuarios WHERE nomusuario=@usuario")

    res.json(result.recordset)
    
})
router.post("/insertarHistorial",async (req,res) => {

    const { nombreUsuario,up1,up2,up3,nombreRival,rp1,rp2,rp3,resultCombate,fecha,tiempo} = req.body

    const pool = await getconnection();
    const result = await pool.request()
    .input("nombreUsuario",sql.VarChar,nombreUsuario)
    .input("up1",sql.Int,up1)
    .input("up2",sql.Int,up2)
    .input("up3",sql.Int,up3)
    .input("nombreRival",sql.VarChar,nombreRival)
    .input("rp1",sql.Int,rp1)
    .input("rp2",sql.Int,rp2)
    .input("rp3",sql.Int,rp3)
    .input("resultCombate",sql.VarChar,resultCombate)
    .input("fecha",sql.Date,fecha)
    .input("tiempo",sql.Int,tiempo)
    .query(`INSERT INTO historial (usuario,up1,up2,up3,rival,rp1,rp2,rp3,resulCombate,fecha,tiempo) 
            VALUES(@nombreUsuario,@up1,@up2,@up3,@nombreRival,@rp1,@rp2,@rp3,@resultCombate,@fecha,@tiempo)
            `)
})
router.get("/obtenerHistorial/:usuario", async(req,res) => {
    const usuario = req.params.usuario
    const pool = await getconnection();
    const result = await pool.request()
    .input('usuario', sql.VarChar, usuario)
    .query(`
    SELECT h.usuario,
    up1.nombre AS 'usuariopoke1',up1.img_frente AS 'usuarioImgPoke1',
    up2.nombre AS 'usuariopoke2' ,up2.img_frente AS 'usuarioImgPoke2',
    up3.nombre AS 'usuariopoke3' ,up3.img_frente AS 'usuarioImgPoke3',
    h.rival,
    rp1.nombre AS 'rivalPoke1',rp1.img_frente AS 'rivalImgPoke1',
    rp2.nombre AS 'rivalPoke2',rp2.img_frente AS 'rivalImgPoke2',
    rp3.nombre AS 'rivalPoke3',rp3.img_frente AS 'rivalImgPoke3',
    h.resulCombate,h.fecha,h.tiempo
    FROM historial AS h
    inner join pokemones AS up1 ON up1.pokemonID = h.up1 
    INNER JOIN pokemones AS up2 ON up2.pokemonID = h.up2
    INNER JOIN pokemones AS up3 ON up3.pokemonID = h.up3
    INNER JOIN pokemones AS rp1 ON rp1.pokemonID = h.rp1
    INNER JOIN pokemones AS rp2 ON rp2.pokemonID = h.rp2
    INNER JOIN pokemones AS rp3 ON rp3.pokemonID = h.rp3
    WHERE usuario  = @usuario
    `)
    res.json(result.recordset)

    
})
router.get("/obtenerVidaTotalPokemon/:id",async (req,res)=>{
    const id = req.params.id
    const pool = await getconnection();
    const result = await pool.request()
    .input('pokemonID',sql.Int,id)
    .query(`
        SELECT t.vida FROM pokemones AS p
        INNER JOIN tiposPokemon AS t
        ON t.tipoID = P.tipoID
        WHERE p.pokemonID = @pokemonID
    `)
    res.json(result.recordset[0])
})

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