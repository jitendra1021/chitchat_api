// docs/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChitChat API Docs',
      version: '1.0.0',
      description: 'API documentation for ChitChat backend',
    },
    servers: [
      {
        url: 'http://localhost:3000', // change to your actual backend base URL
      },
    ],
     components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./router/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
