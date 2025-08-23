require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { errorHandler, noFound } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const app = express();

app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'exp://0.0.0.0:8081',
        'exp://0.0.0.0:8082',
        'exp://0.0.0.0:8083',
        'http://0.0.0.0:8081',
        'http://0.0.0.0:8082',
        'http://0.0.0.0:8083',
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:8083',
    ],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '150mb' }));

if (process.env.NODE_ENV === 'development') {
    app.use((req,res,next) => {
        console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
    });
}

app.use('/api', apiRoutes);
app.get('/', (req,res) => {
    console.log('GET / petición recibida desde', req.ip);
    res.status(200).json({
        success: true,
        message: 'SERVIDOR API DE GESTION DE PRODUCTOS',
        version:'1.0.0',
        status:'running',
        timestamp: new Date(),
        clientIP: req.ip
    });
});

app.use(noFound);
app.use(errorHandler);

//conexion con la base de datos
const connectDB = async() => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB conectada: ${conn.connection.host}`);
    } catch (error) {
     //Si la conexion falla
     console.error('Error al conectar a la base de datos MongoDB', error.message);
     process.exit(1);
    }
};

    //Iniciando servidor 

    const PORT = process.env.PORT || 5000;
    const startServer = async () => {
        try {
            await connectDB();

            const HOST = process.env.HOST || '0.0.0.0';
            app.listen(PORT, HOST, () =>{
                console.log(`
                    SERVIDOR INICIANDO
                    PUERTO: ${PORT.toString().padEnd(49)} || 
                    MODO: ${(process.env.NODE_ENV || 'development').padEnd(37)} ||
                    URL Local: http://localhost:${PORT.toString().padEnd(37)} ||
                    URL Red: http://${HOST}:${PORT.toString().padEnd(37)} ||

                    Endpoints disponibles:
                    * GET / - Información del servidor
                    * GET /api - Info de API
                    * POST /api/auth/login - Login
                    * GET /api/users - Gestión de usuarios
                    * GET /api/categories - Gestión de categorías
                    * GET /api/subcategories - Gestión de subcategorías
                    * GET /api/products - Gestión de productos
                    
                    DOCUMENTACIÓN DE POSTMAN
                    `);
            })
        } catch (error) {
            console.error('Error al iniciar servidor:', error);
            process.exit(1);
        }
    };
    process.on('uncaughtException', (err) =>{
        console.error('Uncaught Exception', err.message);
        process.exit(1);
    });

// iniciar el servidor
startServer();

process.on('unhandledRejection', (err) =>{
        console.error('Unhandled Promise rejection', err.message);
        process.exit(1);
    });

process.on('SIGTERM', () =>{
    console.log('SIGTERM recibido. Cerrando Servidor grace full...');
    mongoose.connection.close(() =>{
        console.log('conexion a mongoDB cerrada')
    process.exit(0);
    });
});

module.exports= app;