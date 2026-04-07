const API_URL = 'http://localhost:3000';
let currentFilter = 'all';
let allTasks = [];

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { 'Accept': 'application/json' }
        });
        allTasks = await response.json();
        renderTasks(); 
    } catch (error) {
        console.error("Error:", error);
    }
}

function renderTasks() {
    let filteredTasks = allTasks;

    if (currentFilter === 'active') {
        filteredTasks = allTasks.filter(t => t.status !== 'done');
    } else if (currentFilter === 'done') {
        filteredTasks = allTasks.filter(t => t.status === 'done');
    }

    document.getElementById('taskCounter').innerText = `Задач: ${filteredTasks.length}`;

    taskList.innerHTML = filteredTasks.map(t => {
        const priorityClass = t.is_priority ? 'priority-star' : '';

        let metaHtml = `<span class="badge">${t.category || 'Особисте'}</span>`;
        if (t.due_date) {
            const dateStr = new Date(t.due_date).toLocaleDateString();
            const isOverdue = new Date(t.due_date) < new Date() && t.status !== 'done';
            metaHtml += `<span class="badge ${isOverdue ? 'overdue' : ''}">${dateStr}</span>`;
        }

        return `
            <div class="task ${t.status === 'done' ? 'done' : ''} ${priorityClass}">
                <div class="task-details">
                    <span>${t.title}</span>
                    <div class="task-meta">${metaHtml}</div>
                </div>
                <div class="task-actions">
                    ${t.status !== 'done' 
                        ? `<button class="btn-done" onclick="completeTask(${t.id})">OK</button>
                           <button class="btn-edit" onclick="editTask(${t.id}, '${t.title}')">Ред</button>`
                        : '<span class="status-done">Done</span>'}
                    <button class="btn-delete" onclick="deleteTask(${t.id})">Видалити</button>
                </div>
            </div>
        `;
    }).join('');
}

async function addTask() {
    const title = taskInput.value.trim();
    if (!title) return;
    
    const category = document.getElementById('categoryInput').value;
    const due_date = document.getElementById('dateInput').value;
    const is_priority = document.getElementById('priorityInput').checked;

    await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ title, category, due_date, is_priority })
    });
    
    taskInput.value = '';
    document.getElementById('dateInput').value = '';
    document.getElementById('priorityInput').checked = false;
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

async function editTask(id, currentTitle) {
    const newTitle = prompt('Відредагуйте задачу:', currentTitle);
    if (!newTitle || newTitle.trim() === currentTitle) return;
    
    await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ title: newTitle.trim() })
    });
    fetchTasks();
}

function setFilter(filterType, btnElement) {
    currentFilter = filterType;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    renderTasks();
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') addTask();
});

fetchTasks();