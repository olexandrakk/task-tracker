const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const configPath = fs.existsSync('/etc/mywebapp/config.json') 
    ? '/etc/mywebapp/config.json' 
    : path.join(__dirname, 'config.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const pool = new Pool(config.db);

app.get('/health/alive', (req, res) => res.status(200).send('OK'));
app.get('/health/ready', async (req, res) => {
    try { await pool.query('SELECT 1'); res.status(200).send('OK'); } 
    catch (error) { res.status(500).send('DB Error'); }
});

app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY is_priority DESC, id ASC');
        res.json(result.rows);
    } catch (error) { res.status(500).send(error.message); }
});

app.post('/tasks', async (req, res) => {
    const { title, category, due_date, is_priority } = req.body;
    if (!title) return res.status(400).send('Title is required');
    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, category, due_date, is_priority) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, category || 'Особисте', due_date || null, is_priority || false]
        );
        res.json(result.rows[0]);
    } catch (error) { res.status(500).send(error.message); }
});

app.put('/tasks/:id', async (req, res) => {
    const { title } = req.body;
    try {
        await pool.query('UPDATE tasks SET title = $1 WHERE id = $2', [title, req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).send(error.message); }
});

app.post('/tasks/:id/done', async (req, res) => {
    try {
        const result = await pool.query("UPDATE tasks SET status = 'done' WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rowCount === 0) return res.status(404).send('Task not found');
        res.json(result.rows[0]);
    } catch (error) { res.status(500).send(error.message); }
});

app.delete('/tasks/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).send('Task not found');
        res.status(200).json({ message: 'Deleted' });
    } catch (error) { res.status(500).send(error.message); }
});

const PORT = config.app.port || 3000;
app.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));