const oracledb = require("oracledb");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const dbConfig = {
  user: "system",
  password: "aartre78",
  connectString: "localhost:1521/XE"
};

// Ruta de login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT TIPO_USUARIO FROM usuarios WHERE EMAIL = :email AND PASSWORD = :password`,
      [email, password]
    );

    if (result.rows.length > 0) {
      const tipoUsuario = result.rows[0][0];
      res.json({ success: true, role: tipoUsuario });
    } else {
      res.json({ success: false, message: "Credenciales incorrectas" });
    }
  } catch (err) {
    console.error("Error en la base de datos:", err);
    res.status(500).json({ success: false, message: "Error en el servidor. Intenta más tarde." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error al cerrar la conexión:", err);
      }
    }
  }
});

// Ruta de registro modificada para incluir todos los campos y manejar el ID
app.post("/register", async (req, res) => {
  const {
    email,
    password,
    tipo_usuario,
    nombre,
    estado,
    municipio,
    ciudad,
    colonia,
    calle,
    numero
  } = req.body;

  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    // Primero, obtener el siguiente valor para el ID
    const resultId = await connection.execute(
      `SELECT NVL(MAX(ID), 0) + 1 as next_id FROM usuarios`
    );
    const nextId = resultId.rows[0][0];

    // Insertar el nuevo usuario con todos los campos
    const result = await connection.execute(
      `INSERT INTO usuarios (
        ID,
        EMAIL,
        PASSWORD,
        TIPO_USUARIO,
        NOMBRE,
        ESTADO,
        MUNICIPIO,
        CIUDAD,
        COLONIA,
        CALLE,
        NUMERO,
        FECHA_REGISTRO
      ) VALUES (
        :id,
        :email,
        :password,
        :tipo_usuario,
        :nombre,
        :estado,
        :municipio,
        :ciudad,
        :colonia,
        :calle,
        :numero,
        SYSTIMESTAMP
      )`,
      {
        id: nextId,
        email,
        password,
        tipo_usuario,
        nombre,
        estado,
        municipio,
        ciudad,
        colonia,
        calle,
        numero
      },
      { autoCommit: true }
    );

    res.json({ success: true, message: "Registro exitoso" });
  } catch (err) {
    console.error("Error en la base de datos:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error en el servidor. Intenta más tarde.",
      error: err.message 
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error al cerrar la conexión:", err);
      }
    }
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});