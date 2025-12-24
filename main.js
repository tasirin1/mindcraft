import * as Mindcraft from './src/mindcraft/mindcraft.js';
import settings from './settings.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import express from 'express';
import { Pool } from 'pg'; // tambahan buat Aiven

let dbPool = null;

// Setup database kalo ada DATABASE_URL (Aiven)
if (process.env.DATABASE_URL) {
  dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // biar aman di prod
  });
  console.log('Memory bakal disave ke Aiven PostgreSQL ❤️');
}

// Fungsi save memory ke DB atau local
async function saveMemoryToDB(botName, memory) {
  if (!dbPool) return false;

  const client = await dbPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_memory (
        bot_name TEXT PRIMARY KEY,
        memory JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      INSERT INTO bot_memory (bot_name, memory)
      VALUES ($1, $2)
      ON CONFLICT (bot_name) DO UPDATE
      SET memory = EXCLUDED.memory, updated_at = CURRENT_TIMESTAMP
    `, [botName, memory]);

    console.log(`Memory ${botName} saved ke Aiven DB`);
    return true;
  } catch (err) {
    console.error('Gagal save ke DB:', err);
    return false;
  } finally {
    client.release();
  }
}

// Fungsi load memory dari DB
async function loadMemoryFromDB(botName) {
  if (!dbPool) return null;

  const client = await dbPool.connect();
  try {
    const res = await client.query(
      'SELECT memory FROM bot_memory WHERE bot_name = $1',
      [botName]
    );
    if (res.rows.length > 0) {
      console.log(`Memory ${botName} loaded dari Aiven DB`);
      return res.rows[0].memory;
    }
    return null;
  } catch (err) {
    console.error('Gagal load dari DB:', err);
    return null;
  } finally {
    client.release();
  }
}

// Override fungsi save/load memory di Mindcraft (hook sederhana)
const originalSave = global.saveMemory || (() => {});
const originalLoad = global.loadMemory || (() => null);

global.saveMemory = async (botName, memory) => {
  // Save ke DB dulu
  if (dbPool) await saveMemoryToDB(botName, memory);

  // Tetep save local sebagai backup
  const dir = `./bots/${botName}`;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  require('fs').writeFileSync(`${dir}/memory.json`, JSON.stringify(memory, null, 2));

  // Panggil original kalo ada
  originalSave(botName, memory);
};

global.loadMemory = async (botName) => {
  // Prioritas load dari DB
  if (dbPool) {
    const dbMem = await loadMemoryFromDB(botName);
    if (dbMem) return dbMem;
  }

  // Fallback ke local
  const path = `./bots/${botName}/memory.json`;
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf8'));
  }
  return null;
};

function parseArguments() {
    return yargs(hideBin(process.argv))
        .option('profiles', { type: 'array', describe: 'List of agent profile paths' })
        .option('task_path', { type: 'string', describe: 'Path to task file to execute' })
        .option('task_id', { type: 'string', describe: 'Task ID to execute' })
        .help().alias('help', 'h')
        .parse();
}

const args = parseArguments();

if (args.profiles) settings.profiles = args.profiles;
if (args.task_path) {
    let tasks = JSON.parse(readFileSync(args.task_path, 'utf8'));
    if (args.task_id) {
        settings.task = tasks[args.task_id];
        settings.task.task_id = args.task_id;
    } else {
        throw new Error('task_id is required when task_path is provided');
    }
}

// Env overrides
if (process.env.MINECRAFT_PORT) settings.port = process.env.MINECRAFT_PORT;
if (process.env.MINDSERVER_PORT) settings.mindserver_port = process.env.MINDSERVER_PORT;
if (process.env.PROFILES && JSON.parse(process.env.PROFILES).length > 0) settings.profiles = JSON.parse(process.env.PROFILES);
if (process.env.INSECURE_CODING) settings.allow_insecure_coding = true;
if (process.env.BLOCKED_ACTIONS) settings.blocked_actions = JSON.parse(process.env.BLOCKED_ACTIONS);
if (process.env.MAX_MESSAGES) settings.max_messages = process.env.MAX_MESSAGES;
if (process.env.NUM_EXAMPLES) settings.num_examples = process.env.NUM_EXAMPLES;
if (process.env.LOG_ALL) settings.log_all_prompts = process.env.LOG_ALL;

// Override model dari env
Mindcraft.init(true, settings.mindserver_port, settings.auto_open_ui);

for (let profile of settings.profiles) {
    let profile_json = JSON.parse(readFileSync(profile, 'utf8'));
    if (process.env.BOT_MODEL) {
        profile_json.model = process.env.BOT_MODEL;
        console.log(`Model di-override jadi: ${process.env.BOT_MODEL}`);
    }
    settings.profile = profile_json;
    Mindcraft.createAgent(settings);
}

// Health check server
const app = express();
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/', (req, res) => {
    res.send('<h1>🟢 Mish_AI is alive!</h1><p>Bot Minecraft lagi aktif nih sayang~ ❤️</p>');
});
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log(`Health check server jalan di port ${port}`);
});
