const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger_output.json';
const endpointsFiles = ['./routes/auth.js', './routes/items.js', './routes/index.js', './routes/version.js'];

const doc = {
  info: {
    title: 'Node.js Backend API Documentation',
    description: 'API documentation for the Node.js backend service, including authentication, user management, and item management functionalities.',
    version: '1.0.0',
  },
  host: 'localhost:3000',
  basePath: '/',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    { name: 'Auth', description: 'Authentication related APIs' },
    { name: 'Users', description: 'User management APIs' },
    { name: 'Items', description: 'Item management APIs' },
    { name: 'General', description: 'General APIs' },
  ],
  securityDefinitions: {
    BearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      scheme: 'bearer',
      in: 'header',
      bearerFormat: 'JWT',
    },
  },
  definitions: {
    User: {
      username: 'john_doe',
      password: 'password123',
      nickname: 'John Doe',
      roles: ['user'],
    },
    Login: {
      username: 'john_doe',
      password: 'password123',
    },
    Register: {
      username: 'new_user',
      password: 'new_password',
      nickname: 'New User',
    },
    ChangePassword: {
      oldPassword: 'old_password',
      newPassword: 'new_password',
    },
    ForgotPassword: {
      username: 'john_doe',
    },
    ResetPassword: {
      token: 'reset_token_string',
      newPassword: 'new_password',
    },
    Item: {
      name: 'Example Item',
      description: 'This is an example item.',
      price: 10.99,
    },
  },
};

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully!');
});