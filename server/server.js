const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

// Initializing the Google Generative AI SDK
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (err) {
  console.warn("Advertencia: No se pudo cargar el SDK de Google Generative AI. Ejecuta npm install primero.");
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const path = require('path');
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// JWT Secret Key configuration
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura_para_erp_produccion';

// PostgreSQL Pool configuration (compatible with Google Cloud SQL connection strings)
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/produccion_erp',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Test DB Connection
db.connect()
  .then(() => console.log('Conexión exitosa a la base de datos PostgreSQL (Google Cloud SQL)'))
  .catch(err => console.error('Error al conectar a la base de datos PostgreSQL:', err.message));

// ==========================================================================
// 1. ENDPOINTS DE AUTENTICACIÓN (LOGIN & REGISTRO)
// ==========================================================================

// Endpoint: Registrar Usuario
app.post('/api/auth/register', async (req, res) => {
  const { alias, nombre, correo, password, telefono, distrito, area, sub_rol } = req.body;

  if (!alias || !nombre || !correo || !password || !telefono || !distrito || !area) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    // Verificar si el correo o alias ya están registrados
    const userCheck = await db.query('SELECT id FROM usuarios WHERE correo = $1 OR alias = $2', [correo.toLowerCase(), alias.toLowerCase()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El correo o el alias ya se encuentran registrados.' });
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar el nuevo usuario en la base de datos
    const insertQuery = `
      INSERT INTO usuarios (alias, nombre, correo, password_hash, telefono, distrito, rol, area, sub_rol)
      VALUES ($1, $2, $3, $4, $5, $6, 'servant', $7, $8)
      RETURNING id, alias, nombre, correo, telefono, distrito, rol, area, sub_rol
    `;
    const newUser = await db.query(insertQuery, [
      alias.trim(),
      nombre.trim(),
      correo.trim().toLowerCase(),
      passwordHash,
      telefono.trim(),
      distrito.trim(),
      area.trim(),
      area.trim() === 'Switchers y Cámaras' ? sub_rol : null
    ]);

    // Generar Token JWT
    const token = jwt.sign(
      { id: newUser.rows[0].id, rol: newUser.rows[0].rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registro exitoso.',
      token,
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor al procesar el registro.' });
  }
});

// Endpoint: Iniciar Sesión (Login)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body; // email puede ser correo o alias

  if (!email || !password) {
    return res.status(400).json({ error: 'Se requiere correo/alias y contraseña.' });
  }

  try {
    // Buscar usuario por correo o alias
    const query = 'SELECT * FROM usuarios WHERE correo = $1 OR alias = $2';
    const result = await db.query(query, [email.trim().toLowerCase(), email.trim()]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas. Revisa tu correo o alias.' });
    }

    const user = result.rows[0];

    // Verificar contraseña con bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta.' });
    }

    // Generar Token JWT
    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Omitir el password_hash en la respuesta
    const { password_hash, ...userResponse } = user;

    res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error interno del servidor al procesar el login.' });
  }
});


// ==========================================================================
// 2. ENDPOINTS DE EQUIPOS & MIEMBROS (TEAMS)
// ==========================================================================

// Endpoint: Obtener Miembros de Equipos (Equivalente relacional de areasData)
app.get('/api/teams', async (req, res) => {
  try {
    const query = 'SELECT id, alias, nombre, correo, telefono, distrito, rol, area, sub_rol FROM usuarios ORDER BY nombre ASC';
    const result = await db.query(query);
    
    // Lista de las 14 áreas de la simulación
    const areasList = [
      { id: "arena", name: "Arena", pillar: "live", leader: "Carlos Gómez", coleader: "Mateo Díaz" },
      { id: "presenter", name: "Presenter", pillar: "live", leader: "Sofía Martínez", coleader: "Lucía Torres" },
      { id: "luces", name: "Luces", pillar: "live", leader: "David Rojas", coleader: "Kevin Vega" },
      { id: "switchers", name: "Switchers y Cámaras", pillar: "live", leader: "Andrés Pinzón", coleader: "Daniela Ruiz" },
      { id: "streaming", name: "Streaming", pillar: "live", leader: "Lucas Morales", coleader: "Samuel Ortíz" },
      { id: "fotografia", name: "Fotografía", pillar: "media", leader: "Valeria Guerrero", coleader: "Mariana Silva" },
      { id: "edicion", name: "Edición", pillar: "media", leader: "Santiago Tovar", coleader: "Sebastián Castro" },
      { id: "filmaking", name: "Filmaking", pillar: "media", leader: "Esteban Herrera", coleader: "Diana Cárdenas" },
      { id: "disenoweb", name: "Diseño Web", pillar: "creative", leader: "Laura Fonseca", coleader: "Andrés Osorio" },
      { id: "disenografico", name: "Diseño Gráfico", pillar: "creative", leader: "Paola Méndez", coleader: "Isabella R." },
      { id: "redaccion", name: "Redacción", pillar: "creative", leader: "Camila Restrepo", coleader: "Manuela B." },
      { id: "redes", name: "Redes", pillar: "creative", leader: "Juliana Pérez", coleader: "Sara Giraldo" },
      { id: "coordinacion", name: "Coordinación", pillar: "logistics", leader: "Mariana Ospina", coleader: "Felipe Cardona" },
      { id: "protocolo", name: "Protocolo", pillar: "logistics", leader: "David Kim", coleader: "Andrea Londoño" }
    ];

    // Mapear los usuarios correspondientes a cada área como servants
    const structuredTeams = areasList.map(area => {
      // Filtrar usuarios del área correspondiente (ignorar líderes ya declarados si no son servants)
      const servants = result.rows
        .filter(u => u.area === area.name && u.rol === 'servant' && u.nombre !== 'ALeonnnc')
        .map(u => {
          if (area.id === 'switchers' && u.sub_role !== null) {
            return `${u.nombre} (${u.alias}) (${u.sub_rol || 'Switcher'})`;
          }
          return `${u.nombre} (${u.alias})`;
        });

      return {
        ...area,
        servants
      };
    });

    res.json(structuredTeams);
  } catch (err) {
    console.error('Error al obtener equipos:', err);
    res.status(500).json({ error: 'Error al consultar miembros del equipo.' });
  }
});


// ==========================================================================
// 3. ENDPOINTS DE EVENTOS ESPECIALES (GET, POST, DELETE)
// ==========================================================================

// Endpoint: Obtener todos los Eventos Especiales y sus asignaciones
app.get('/api/events', async (req, res) => {
  try {
    const eventsQuery = `
      SELECT e.*, u.nombre as creador_nombre 
      FROM eventos_especiales e
      LEFT JOIN usuarios u ON e.creador_id = u.id
      ORDER BY e.fecha ASC, e.hora ASC
    `;
    const eventsResult = await db.query(eventsQuery);

    const structuredEvents = [];

    for (const event of eventsResult.rows) {
      // Obtener requerimientos de área para cada evento
      const reqQuery = `
        SELECT r.area_nombre, u.nombre as asignado_nombre 
        FROM evento_areas_requeridas r
        LEFT JOIN usuarios u ON r.asignado_usuario_id = u.id
        WHERE r.evento_id = $1
      `;
      const reqResult = await db.query(reqQuery, [event.id]);

      const areasRequired = [];
      const assignments = {};

      reqResult.rows.forEach(row => {
        areasRequired.push(row.area_nombre);
        assignments[row.area_nombre] = row.asignado_nombre || null;
      });

      structuredEvents.push({
        id: event.id,
        title: event.titulo,
        date: event.fecha.toISOString().split('T')[0],
        time: event.hora.substring(0, 5),
        description: event.descripcion,
        status: event.status,
        creator: event.creador_nombre || 'Superlíder',
        areasRequired,
        assignments
      });
    }

    res.json(structuredEvents);
  } catch (err) {
    console.error('Error al obtener eventos:', err);
    res.status(500).json({ error: 'Error al consultar eventos especiales.' });
  }
});

// Endpoint: Crear Evento Especial (Superlíder / Admin)
app.post('/api/events', async (req, res) => {
  const { title, date, time, description, areasRequired, creatorId } = req.body;

  if (!title || !date || !time || !description || !areasRequired || areasRequired.length === 0) {
    return res.status(400).json({ error: 'Campos incompletos para crear evento.' });
  }

  try {
    // 1. Insertar el evento especial
    const insertEventQuery = `
      INSERT INTO eventos_especiales (titulo, fecha, hora, descripcion, status, creador_id)
      VALUES ($1, $2, $3, $4, 'programado', $5) RETURNING *
    `;
    const eventResult = await db.query(insertEventQuery, [title, date, time, description, creatorId || null]);
    const eventId = eventResult.rows[0].id;

    // 2. Insertar los requerimientos de áreas
    const insertAreaQuery = `
      INSERT INTO evento_areas_requeridas (evento_id, area_nombre, asignado_usuario_id)
      VALUES ($1, $2, NULL)
    `;
    for (const area of areasRequired) {
      await db.query(insertAreaQuery, [eventId, area]);
    }

    res.status(201).json({
      message: 'Evento especial programado exitosamente.',
      event: eventResult.rows[0]
    });
  } catch (err) {
    console.error('Error al crear evento:', err);
    res.status(500).json({ error: 'Error interno al programar el evento.' });
  }
});

// Endpoint: Eliminar y Deshacer Evento Especial (Exclusivo Admin)
app.delete('/api/events/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    const deleteQuery = 'DELETE FROM eventos_especiales WHERE id = $1 RETURNING *';
    const result = await db.query(deleteQuery, [eventId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento especial no encontrado.' });
    }

    res.json({
      message: 'Evento especial eliminado y deshecho correctamente.',
      deletedEvent: result.rows[0]
    });
  } catch (err) {
    console.error('Error al eliminar evento:', err);
    res.status(500).json({ error: 'Error al deshacer el evento.' });
  }
});


// ==========================================================================
// 4. INTEGRACIÓN CON GOOGLE AI STUDIO (GEMINI API PROXY)
// ==========================================================================

// Endpoint: Consulta Contextual Inteligente (Gemini)
app.post('/api/ia/consultar', async (req, res) => {
  const { pregunta } = req.body;

  if (!pregunta) {
    return res.status(400).json({ error: 'La pregunta es obligatoria.' });
  }

  if (!genAI) {
    return res.status(503).json({ error: 'El servicio de IA no está configurado. Revisa tu GEMINI_API_KEY.' });
  }

  try {
    // 1. Obtener la lista de usuarios y roles actuales en la base de datos
    const usersResult = await db.query('SELECT alias, nombre, rol, area, sub_rol FROM usuarios');
    const dbContext = JSON.stringify(usersResult.rows);

    // 2. Cargar modelo Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // 3. Crear Prompt contextualizado
    const prompt = `
      Eres el asistente de Inteligencia Artificial para el sistema "ProDucción ERP" de la iglesia.
      Cuentas con la siguiente base de datos en tiempo real de los servidores registrados en el equipo:
      ${dbContext}
      
      Pregunta del usuario: "${pregunta}"
      
      Responde a la pregunta de manera clara, concisa, profesional y en base al contexto provisto.
    `;

    const aiResult = await model.generateContent(prompt);
    const responseText = aiResult.response.text();

    res.json({
      respuesta: responseText
    });
  } catch (err) {
    console.error('Error al consultar Google AI Studio (Gemini):', err);
    res.status(500).json({ error: 'Error al procesar la respuesta con la Inteligencia Artificial.' });
  }
});


// Ruta fallback para servir el frontend en cualquier otra ruta
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint de API no encontrado.' });
  }
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor API del ERP corriendo exitosamente en el puerto ${PORT}`);
});
