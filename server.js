const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const configPath = fs.existsSync('/etc/mywebapp/config.json') 
    ? '/etc/mywebapp/config.json' 
    : path.join(__dirname, 'config.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const pool = new Pool(config.db);

async function runMigrations() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
        await pool.query(sql);
        console.log('Міграції бази даних успішно виконані.');
    } catch (err) {
        console.error('Помилка під час виконання міграцій:', err);
    }
}

function sendResponse(req, res, data, htmlTemplate) {
    if (req.accepts('html')) {
        res.send(htmlTemplate);
    } else {
        res.json(data);
    }
}

app.get('/', (req, res) => {
    res.send(`
        <h1>Task Tracker API</h1>
        <ul>
            <li><a href="/tasks">GET /tasks</a> - Список усіх задач</li>
            <li>POST /tasks - Створити нову задачу (потрібно передати 'title')</li>
            <li>POST /tasks/1/done - Змінити статус задачі з id=1 на 'done'</li>
            <li><a href="/health/alive">GET /health/alive</a> - Перевірка стану (alive)</li>
            <li><a href="/health/ready">GET /health/ready</a> - Перевірка БД (ready)</li>
        </ul>
    `);
});

app.get('/health/alive', (req, res) => {
    res.status(200).send('OK');
});

app.get('/health/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).send('OK');
    } catch (error) {
        res.status(500).send('Помилка: Немає підключення до бази даних');
    }
});

app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, title, status, created_at FROM tasks ORDER BY id ASC');
        const tasks = result.rows;
        
        let htmlTemplate = '<h1>Список задач</h1><table border="1"><tr><th>ID</th><th>Title</th><th>Status</th><th>Created At</th></tr>';
        tasks.forEach(task => {
            htmlTemplate += `<tr><td>${task.id}</td><td>${task.title}</td><td>${task.status}</td><td>${task.created_at}</td></tr>`;
        });
        htmlTemplate += '</table>';

        sendResponse(req, res, tasks, htmlTemplate);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/tasks', async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).send('Title is required');

    try {
        const result = await pool.query(
            'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, status, created_at',
            [title]
        );
        const newTask = result.rows[0];
        
        const htmlTemplate = `<p>Задачу створено!</p><ul><li>ID: ${newTask.id}</li><li>Title: ${newTask.title}</li></ul><a href="/tasks">Назад до списку</a>`;
        
        sendResponse(req, res, newTask, htmlTemplate);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/tasks/:id/done', async (req, res) => {
    const taskId = req.params.id;
    try {
        const result = await pool.query(
            "UPDATE tasks SET status = 'done' WHERE id = $1 RETURNING id, title, status",
            [taskId]
        );
        
        if (result.rowCount === 0) return res.status(404).send('Task not found');
        
        const updatedTask = result.rows[0];
        const htmlTemplate = `<p>Статус задачі оновлено на 'done'!</p><p>ID: ${updatedTask.id}</p><a href="/tasks">Назад до списку</a>`;
        
        sendResponse(req, res, updatedTask, htmlTemplate);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

const PORT = config.app.port || 3000;

app.listen(PORT, async () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
    await runMigrations();
});