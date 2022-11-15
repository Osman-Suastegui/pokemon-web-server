import express from 'express';
import router from './routes/rout.js'
import cors from "cors";
import http from 'http';

const app = express()
const server = http.createServer(app);
import { Server } from "socket.io"
const io = new Server(server, {
    cors: {
        origin: '*',

    },
}
);

app.use(cors())
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(router)

let cola = []
let salaDeBatalla = 0


io.on('connection', (socket) => {
   

    socket.on("disconnect", () => {
        // si esta en cola y se desconetcta lo sacamos de la cola
        if(cola.length != 0 && cola[0].id == socket.id){
            cola.shift()
        }
    });


    socket.on("usuarioencola", () => {
        cola.push(socket)
        if (cola.length != 2) return

        salaDeBatalla++;
        socket.join(salaDeBatalla)
        const JUGADOR1 = cola.shift()
        const JUGADOR2 = cola.shift()
        JUGADOR1.join(salaDeBatalla)
        JUGADOR2.join(salaDeBatalla)
        io.to(salaDeBatalla).emit("asignarSaladeBatalla", salaDeBatalla);

    })
    socket.on("salirDeSala", (msg) => {
        io.to(msg.sala).emit("usuarioHaSalidoDePartida", msg.nombreUsuario)
        cola = []
    })

    socket.on("btnPress", (sala) => {
        io.to(sala).emit("cambiarBtnColor")
    })

    socket.on("mensaje", (mensaje) => {
        console.log("msg servidor ", mensaje)
        io.to(mensaje.sala).emit("mimensaje", { "usuario": mensaje.usuario, "mensaje": mensaje.mensaje })
    })



})
const PORT = process.env.PORT  || 3000
server.listen(PORT)
console.log("servidor en puerto ",PORT);
export default app