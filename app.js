
//declaramos una varible para ocupar el framework expres
const express = require("express")
const mysql= require("mysql2")

let bodyParser=require('body-parser')
let app=express()
let con=mysql.createConnection({
    host:'127.0.0.1',
    user:'root',
    password:'n0m3l0',
    database:'bullnodes_tests'
})
con.connect();

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(express.static('public'))

//funcion para agregar un usuario
app.post('/agregarUsuario', (req, res) => {
    const nombre = req.body.nombre;
    const id = req.body.id;

    con.query('INSERT INTO usuario (id_usuario, nombre) VALUES (?, ?)', [id, nombre], (err, respuesta) => {
        if (err) {
            console.log("Error al insertar usuario:", err);
            return res.status(500).send("Error al conectar");
        }
        const nuevoId = respuesta.insertId;
        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Usuario Creado</title>
                <link rel="stylesheet" href="success.css">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
            </head>
            <body>
                <div class="success-container">
                    <div class="success-icon">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <h2>¡Usuario creado exitosamente!</h2>
                    <p><strong>ID:</strong> ${nuevoId}</p>
                    <p><strong>Nombre:</strong> ${nombre}</p>
                    <a href="/" class="btn-return">
                        <i class="fas fa-arrow-left"></i> Volver al inicio
                    </a>
                </div>
            </body>
            </html>
        `);
    });
});

//Función para consultar todos los usuarios

app.get('/obtenerUsuario', (req, res) => {
    con.query('SELECT * FROM usuario', (err, respuesta) => {
        if (err) {
            console.log('ERROR: ', err);
            return res.status(500).send('Error al obtener usuarios');
        }

        let rows = respuesta.map(user => `
            <tr>
                <td>${user.id_usuario}</td>
                <td>${user.nombre}</td>
            </tr>
        `).join('');

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Lista de Usuarios</title>
                <link rel="stylesheet" href="users.css">
            </head>
            <body>
                <div class="container">
                    <h1>Usuarios Registrados</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                    <a href="/" class="btn-return">Volver al inicio</a>
                </div>
            </body>
            </html>
        `);
    });
});

//funcion para buscar usuarios por ID o nombre
app.get('/buscarUsuarioAcciones', (req, res) => {
    const { id, nombre } = req.query;

    let query = 'SELECT * FROM usuario';
    let where = [];
    let values = [];

    if (id) {
        where.push('id_usuario = ?');
        values.push(id);
    }

    if (nombre) {
        where.push('nombre LIKE ?');
        values.push('%' + nombre + '%');
    }

    if (where.length > 0) {
        query += ' WHERE ' + where.join(' AND ');
    }

    con.query(query, values, (err, resultados) => {
        if (err) return res.status(500).send('Error al buscar usuario');

        if (resultados.length === 0) {
            return res.send(`
            <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8" />
            <title>Usuario no encontrado</title>
            <link rel="stylesheet" href="search.css" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        </head>
        <body>
            <div class="container not-found">
                <div class="icon">
                    <i class="fas fa-search-minus"></i>
                </div>
                <h2>Usuario no encontrado :(</h2>
                <a href="/" class="btn-return">Volver al inicio</a>
            </div>
        </body>
        </html>
            `);
        }

        let bloques = resultados.map(usuario => `
            <div class="card">
                <p><strong>ID:</strong> ${usuario.id_usuario}</p>
                <p><strong>Nombre:</strong> ${usuario.nombre}</p>

                <form action="/editarUsuario" method="POST" class="inline-form">
                    <input type="hidden" name="id" value="${usuario.id_usuario}" />
                    <input type="text" name="nuevoNombre" placeholder="Nuevo nombre" required />
                    <button type="submit" class="btn-modificar">Modificar</button>
                </form>

                <form action="/eliminarUsuario" method="POST" class="inline-form" onsubmit="return confirm('¿Seguro que deseas eliminar este usuario?');">
                    <input type="hidden" name="id" value="${usuario.id_usuario}" />
                    <button type="submit" class="btn-eliminar">Eliminar</button>
                </form>
            </div>
        `).join('');

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8" />
                <title>Resultado de búsqueda</title>
                <link rel="stylesheet" href="search.css" />
            </head>
            <body>
                <div class="container">
                    <h2>Resultado de búsqueda</h2>
                    ${bloques}
                    <a href="/" class="btn-return">Volver al inicio</a>
                </div>
            </body>
            </html>
        `);
    });
});

//funcion para editar un usuario
app.post('/editarUsuario', (req, res) => {
    const { id, nuevoNombre } = req.body;

    con.query('UPDATE usuario SET nombre = ? WHERE id_usuario = ?', [nuevoNombre, id], (err, resultado) => {
        if (err) return res.status(500).send('Error al actualizar usuario');
        if (resultado.affectedRows === 0) {
            return res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8" />
                    <title>Usuario no encontrado</title>
                    <link rel="stylesheet" href="search.css" />
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
                </head>
                <body>
                    <div class="container not-found">
                        <div class="icon">
                            <i class="fas fa-search-minus"></i>
                        </div>
                        <h2>Usuario no encontrado :(</h2>
                        <a href="/" class="btn-return">Volver al inicio</a>
                    </div>
                </body>
                </html>
            `);
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8" />
                <title>Usuario actualizado</title>
                <link rel="stylesheet" href="success.css" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
            </head>
            <body>
                <div class="success-container">
                    <div class="success-icon">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <h2>Usuario actualizado correctamente</h2>
                    <p><strong>ID:</strong> ${id}</p>
                    <p><strong>Nuevo nombre:</strong> ${nuevoNombre}</p>
                    <a href="/" class="btn-return">Volver al inicio</a>
                </div>
            </body>
            </html>
        `);
    });
});
//funcion para eliminar un usuario
app.post('/eliminarUsuario', (req, res) => {
    const { id } = req.body;

    con.query('DELETE FROM usuario WHERE id_usuario = ?', [id], (err, resultado) => {
        if (err) return res.status(500).send('Error al eliminar usuario');
        if (resultado.affectedRows === 0) {
            return res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8" />
                    <title>Usuario no encontrado</title>
                    <link rel="stylesheet" href="search.css" />
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
                </head>
                <body>
                    <div class="container not-found">
                        <div class="icon">
                            <i class="fas fa-search-minus"></i>
                        </div>
                        <h2>Usuario no encontrado :(</h2>
                        <a href="/" class="btn-return">Volver al inicio</a>
                    </div>
                </body>
                </html>
            `);
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8" />
                <title>Usuario eliminado</title>
                <link rel="stylesheet" href="success.css" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
            </head>
            <body>
                <div class="success-container">
                    <div class="success-icon">
                        <i class="fas fa-user-times"></i>
                    </div>
                    <h2> Usuario eliminado correctamente</h2>
                    <p><strong>ID:</strong> ${id}</p>
                    <a href="/" class="btn-return">Volver al inicio</a>
                </div>
            </body>
            </html>
        `);
    });
});



app.listen(5000,()=>{
    console.log('Servidor escuchando en el puerto 5000')
})