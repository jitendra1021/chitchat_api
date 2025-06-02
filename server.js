import express from 'express';
import dotenv from 'dotenv';
import authRouter from './router/authRouter.js';
import connectDB from './db/connectDB.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './doc/swagger.js'; // or .ts


const app = express();
app.use(express.json()); 

dotenv.config();


app.get( '/', (req, res)=>{
    res.send("<h1>Backend server is running<h1/>");
} )

app.use('/auth', authRouter);                                            // api url: http://localhost:3000/auth/register
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));     //swagger link:- http://localhost:${PORT}/api-docs


//Global error handler (must come after all routes )
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error"
  return res.status(statusCode).json({
    success: false,
    message,
  });
});

const PORT = process.env?.PORT || 3000

connectDB().then( () =>{
    app.listen(PORT, () =>{
        console.log(`Server is running on port ${PORT}`);
        console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
    } )
} )