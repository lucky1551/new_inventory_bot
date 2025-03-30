const { Client } = require('pg');

const dbConfig = {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 5432,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
};

const getDbClient = async () => {
    const client = new Client(dbConfig);
    try {
        await client.connect();
        return client;
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
};

// Removed releaseClient function

module.exports = { getDbClient }; // Removed releaseClient from exports