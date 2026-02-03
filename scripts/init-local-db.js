const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Simple .env parser
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '..', '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            line = line.trim();
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                process.env[key] = value;
            }
        });
    } catch (e) {
        console.log('No .env file found or error reading it.');
    }
}

loadEnv();

const files = [
    'schema.sql',
    'init.sql',
    'migration_genealogy.sql',
    'insert_genealogy_types.sql',
    'migration_business_user_role.sql',
    'migration_business_plan_tables.sql',
    'migration_add_product_sales_ratio.sql',
    'migration_add_commission_config.sql',
    'insert_default_admin.sql'
];

async function run() {
    console.log('Starting Database Initialization...');

    // 1. Connect to default postgres db to create the target db
    // Using default credentials commonly found in dev environments
    const defaultClient = new Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
        database: 'postgres',
    });

    try {
        await defaultClient.connect();

        // Check if DB exists
        const res = await defaultClient.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${process.env.DB_NAME}...`);
            await defaultClient.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
        } else {
            console.log(`Database ${process.env.DB_NAME} already exists.`);
        }
        await defaultClient.end();

    } catch (err) {
        console.error('Error connecting to default postgres database. Make sure PostgreSQL is running.');
        console.error('Error details:', err.message);
        console.log('Skipping database creation step. Trying to connect to existing database...');
    }

    // 2. Connect to the target db and run scripts
    const dbClient = new Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'epixel_mlm_tools',
    });

    try {
        await dbClient.connect();
        console.log('Connected to target database. Running scripts...');

        for (const file of files) {
            const filePath = path.join(__dirname, '..', 'database', file);
            if (fs.existsSync(filePath)) {
                console.log(`Running ${file}...`);
                const sql = fs.readFileSync(filePath, 'utf8');
                try {
                    await dbClient.query(sql);
                } catch (e) {
                    console.error(`Error running ${file}:`, e.message);
                    // Continue as some errors might be "table already exists"
                }
            } else {
                console.warn(`File not found: ${filePath}`);
            }
        }

        console.log('Database initialization complete.');
        await dbClient.end();

    } catch (err) {
        console.error('Error connecting to target database:', err.message);
        process.exit(1);
    }
}

run();
