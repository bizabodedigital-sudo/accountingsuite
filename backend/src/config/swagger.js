const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bizabode Accounting Suite API',
      version: '1.0.0',
      description: 'Complete API documentation for Bizabode Accounting Suite - A comprehensive accounting platform for Jamaican businesses',
      contact: {
        name: 'Bizabode Support',
        email: 'support@bizabode.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://bizabode.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || process.env.FRONTEND_URL?.replace(':3000', ':3001') || 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
        },
        clientAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Client portal JWT token obtained from /api/client-auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            number: {
              type: 'string',
              example: 'INV-2024-001'
            },
            customerId: {
              type: 'string'
            },
            items: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            subtotal: {
              type: 'number'
            },
            tax: {
              type: 'number'
            },
            total: {
              type: 'number'
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID']
            },
            issueDate: {
              type: 'string',
              format: 'date'
            },
            dueDate: {
              type: 'string',
              format: 'date'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              example: 1
            },
            limit: {
              type: 'number',
              example: 10
            },
            total: {
              type: 'number',
              example: 100
            },
            pages: {
              type: 'number',
              example: 10
            }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Unauthorized'
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad Request - Invalid input',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Customers',
        description: 'Customer management'
      },
      {
        name: 'Invoices',
        description: 'Invoice creation, management, and tracking'
      },
      {
        name: 'Quotes',
        description: 'Quote/estimate management'
      },
      {
        name: 'Payments',
        description: 'Payment recording and processing'
      },
      {
        name: 'Expenses',
        description: 'Expense tracking and management'
      },
      {
        name: 'Products',
        description: 'Product and inventory management'
      },
      {
        name: 'Accounting',
        description: 'Chart of Accounts, Journal Entries, Ledger'
      },
      {
        name: 'Payroll',
        description: 'Employee and payroll management'
      },
      {
        name: 'Fixed Assets',
        description: 'Fixed asset tracking and depreciation'
      },
      {
        name: 'Reports',
        description: 'Financial and operational reports'
      },
      {
        name: 'Workflows',
        description: 'Automated workflow management'
      },
      {
        name: 'Settings',
        description: 'System and company settings'
      },
      {
        name: 'Client Portal',
        description: 'Client portal authentication and data access'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

