require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect()
  .then(() => client.query('SELECT version()'))
  .then(res => { console.log(res.rows[0]); return client.end(); })
  .catch(err => console.error('ERROR:', err.message));