const API_URL = 'http://localhost:3000';
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { 'Accept': 'application/json' }
        });
        const tasks = await response.json();
        
        taskList.innerHTML = tasks.map(t => `
            <div class="task ${t.status === 'done' ? 'done' : ''}">
                <span>${t.title}</span>
                <div class="task-actions">
                    ${t.status !== 'done' 
                        ? `<button class="btn-done" onclick="completeTask(${t.id})">OK</button>` 
                        : '<span class="status-done">Done</span>'}
                    <button class="btn-delete" onclick="deleteTask(${t.id})">Видалити</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error:", error);
    }
}

async function addTask() {
    const title = taskInput.value.trim();
    if (!title) return;
    
    await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ title })
    });
    
    taskInput.value = '';
    fetchTasks();
}

async function completeTask(id) {
    await fetch(`${API_URL}/tasks/${id}/done`, { 
        method: 'POST',
        headers: { 'Accept': 'application/json' }
    });
    fetchTasks();
}

async function deleteTask(id) {
    if (!confirm('Точно видалити цю задачу?')) return;
    
    await fetch(`${API_URL}/tasks/${id}`, { 
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
    });
    fetchTasks();
}

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

fetchTasks();