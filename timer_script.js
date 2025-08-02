    let timer, isRunning = false, timeLeft = 25 * 60;
    let currentMode = 'pomodoro';
    let sessionStartTime = null;
    let sessionExpectedEnd = null; // NEW: authoritative end time

    const startPauseBtn = document.getElementById('startPauseBtn');
    const continueBtn = document.getElementById('continueBtn');
    const stopBtn = document.getElementById('stopBtn');

    const timeDisplay = document.getElementById('time');
    const startStopBtn = document.getElementById('startStopBtn');

    const taskNameInput = document.getElementById('taskNameInput');
    const taskList = document.getElementById('taskList');
    const taskForm = document.getElementById('addTaskForm');
    let tasksVisible = false;

    function toggleTasksVisibility() {
      const taskList = document.getElementById('taskList');
      taskList.style.display = taskList.style.display === 'none' ? 'block' : 'none';
    }

    function setMode(mode) {
    currentMode = mode;
    timeLeft = mode === 'pomodoro' ? (pomodoroDuration || 25) * 60 :
               mode === 'short' ? (shortBreakDuration || 5) * 60 :
               (longBreakDuration || 15) * 60;
    updateTimeDisplay();
    clearInterval(timer);
    isRunning = false;
    startStopBtn.textContent = 'START';
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tabs button[onclick*="${mode}"]`)?.classList.add('active');
    sessionStartTime = null; // reset any in-progress session
      sessionExpectedEnd = null;
  }

    function updateTimeDisplay() {
      const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
      const s = String(timeLeft % 60).padStart(2, '0');
      timeDisplay.textContent = `${m}:${s}`;
    }

   
function recordSession({ completed }) {
  const records = JSON.parse(localStorage.getItem('pomodoroRecords')) || [];
  const now = new Date();
  const start = sessionStartTime ? new Date(sessionStartTime) : now;
  let end = null;

  if (completed && sessionExpectedEnd) {
    // natural completion: use expected end
    end = new Date(sessionExpectedEnd);
  }
  // if not completed, leave end as null to signal incomplete

  const durationMinutes = completed && end
    ? Math.round((end - start) / 60000)
    : undefined; // undefined for incomplete

  const modeLabel = currentMode === 'pomodoro' ? 'Pomodoro' :
                    currentMode === 'short' ? 'Short Break' : 'Long Break';

  const newRecord = {
    start: start.toISOString(),
    end: end ? end.toISOString() : null,
    mode: modeLabel,
    duration: durationMinutes,
    startLocal: start.toLocaleString(),
    endLocal: end ? end.toLocaleString() : null
  };

  records.push(newRecord);
  localStorage.setItem('pomodoroRecords', JSON.stringify(records));
}

function enableStop() {
  stopBtn.disabled = false;
  stopBtn.style.opacity = '1';
  stopBtn.style.cursor = 'pointer';
}

function disableContinueAndStop() {
  continueBtn.disabled = true;
  continueBtn.style.opacity = '0.5';
  continueBtn.style.cursor = 'not-allowed';
  stopBtn.disabled = true;
  stopBtn.style.opacity = '0.5';
  stopBtn.style.cursor = 'not-allowed';
}

function startOrPause() {
  if (isRunning) {
    // Pause
    clearInterval(timer);
    isRunning = false;
    startPauseBtn.textContent = 'PAUSE'; // you could also show 'PAUSED' if you prefer
    continueBtn.disabled = false; // enable continue
    stopBtn.disabled = false;     // allow stopping the paused session
  } else {
    // Start or resume
    if (!sessionStartTime) {
      sessionStartTime = new Date().toISOString();
    }
    sessionExpectedEnd = new Date(Date.now() + timeLeft * 1000).toISOString();

    timer = setInterval(() => {
      const now = Date.now();
      const expectedEndMs = new Date(sessionExpectedEnd).getTime();
      timeLeft = Math.max(0, Math.round((expectedEndMs - now) / 1000));
      updateTimeDisplay();

      if (timeLeft <= 0) {
        clearInterval(timer);
        isRunning = false;
        startPauseBtn.textContent = 'START';
        continueBtn.disabled = true;
        stopBtn.disabled = true;
        recordSession({ completed: true });
        sessionStartTime = null;
        sessionExpectedEnd = null;
      }
    }, 250);

    isRunning = true;
    startPauseBtn.textContent = 'PAUSE';
    continueBtn.disabled = true; // can’t continue while running
    stopBtn.disabled = false;    // allow abort
  }
}

function continueTimer() {
  if (isRunning || !sessionStartTime) return;

  sessionExpectedEnd = new Date(Date.now() + timeLeft * 1000).toISOString();

  timer = setInterval(() => {
    const now = Date.now();
    const expectedEndMs = new Date(sessionExpectedEnd).getTime();
    timeLeft = Math.max(0, Math.round((expectedEndMs - now) / 1000));
    updateTimeDisplay();

    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      startPauseBtn.textContent = 'START';
      continueBtn.disabled = true;
      stopBtn.disabled = true;
      recordSession({ completed: true });
      sessionStartTime = null;
      sessionExpectedEnd = null;
    }
  }, 250);

  isRunning = true;
  startPauseBtn.textContent = 'PAUSE';
  continueBtn.disabled = true;
  stopBtn.disabled = false;
}

function stopSession() {
  if (!sessionStartTime) return;
  clearInterval(timer);
  recordSession({ completed: false }); // incomplete session
  // reset timer for current mode
  if (currentMode === 'pomodoro') timeLeft = (pomodoroDuration || 25) * 60;
  else if (currentMode === 'short') timeLeft = (shortBreakDuration || 5) * 60;
  else timeLeft = (longBreakDuration || 15) * 60;
  updateTimeDisplay();

  // reset state
  sessionStartTime = null;
  sessionExpectedEnd = null;
  isRunning = false;
  startPauseBtn.textContent = 'START';
  continueBtn.disabled = true;
  stopBtn.disabled = true;
}


// Hook up events
startPauseBtn.addEventListener('click', startOrPause);
continueBtn.addEventListener('click', continueTimer);
stopBtn.addEventListener('click', stopSession);


    function showTaskForm() {
      taskForm.style.display = 'block';
    }

    function clearForm() {
      taskNameInput.value = '';
      document.getElementById('estPomoInput').value = '1';
      taskForm.style.display = 'none';
    }

    function saveTask() {
      const name = taskNameInput.value.trim();
      const estPomos = document.getElementById('estPomoInput').value;
      
      if (!name) return;

      createTaskElement(name, estPomos);
      updateLocalStorage();
      clearForm();
    }

    function startEditing(btn) {
      const taskDiv = btn.closest('.task');
      btn.style.display = 'none';

      const taskNameSpan = taskDiv.querySelector('.task-name');
      taskNameSpan.setAttribute('contenteditable', 'true');
      taskNameSpan.focus();

      let editFooter = taskDiv.querySelector('#editTaskFooter');
      if (!editFooter) {
        editFooter = document.createElement('div');
        editFooter.id = 'editTaskFooter';

        editFooter.innerHTML = `
          <div class="pomodoro-count">
            <label>No. of Pomodoros:</label>
            <input type="number" class="edit-pomo-input" min="1" value="${taskDiv.querySelector('small')?.textContent.match(/\d+/)?.[0] || '1'}">
          </div>
          <div class="edit-actions-container">
            <button class="delete" onclick="deleteTaskFromEdit(this)">Delete</button>
            <button class="cancel" onclick="cancelEdit(this)">Cancel</button>
            <button class="save" onclick="saveEdit(this)">Save</button>
          </div>
        `;

        taskDiv.appendChild(editFooter);
      } else {
        editFooter.style.display = 'flex';
      }
    }

    function deleteTaskFromEdit(btn) {
      const taskDiv = btn.closest('.task');
      taskDiv.remove();
    }

    function cancelEdit(btn) {
      const taskDiv = btn.closest('.task');
      const editFooter = taskDiv.querySelector('#editTaskFooter');
      editFooter.style.display = 'none';

      const taskNameSpan = taskDiv.querySelector('.task-name');
      taskNameSpan.removeAttribute('contenteditable');

      const menuBtn = taskDiv.querySelector('.task-menu-container button');
      menuBtn.style.display = 'block';
    }

    function saveEdit(btn) {
      const taskDiv = btn.closest('.task');
      const taskNameSpan = taskDiv.querySelector('.task-name');
      taskNameSpan.removeAttribute('contenteditable');

      // Update pomodoro count
      const pomoInput = taskDiv.querySelector('.edit-pomo-input');
      const pomoCount = pomoInput ? pomoInput.value : '1';
      const pomoDisplay = taskDiv.querySelector('small');
      if (pomoDisplay) {
        pomoDisplay.textContent = `Est Pomodoros: ${pomoCount}`;
      }

      const editFooter = taskDiv.querySelector('#editTaskFooter');
      editFooter.style.display = 'none';

      const menuBtn = taskDiv.querySelector('.task-menu-container button');
      menuBtn.style.display = 'block';
      
      updateLocalStorage();
    }

    function handleTaskClick(taskDiv) {
      // Remove selection from all tasks
      document.querySelectorAll('.task').forEach(t => {
        t.classList.remove('selected');
      });
      
      // Add selection to clicked task
      taskDiv.classList.add('selected');
    }

    window.onclick = e => {
      if (!e.target.matches('.task-menu-container button') && !e.target.closest('#editTaskFooter')) {
        document.querySelectorAll('#editTaskFooter').forEach(footer => {
          footer.style.display = 'none';
          const taskDiv = footer.closest('.task');
          if (taskDiv) {
            const taskNameSpan = taskDiv.querySelector('.task-name');
            taskNameSpan.removeAttribute('contenteditable');

            const menuBtn = taskDiv.querySelector('.task-menu-container button');
            if (menuBtn) menuBtn.style.display = 'block';
          }
        });
      }
      
      // Handle task selection
      const clickedTask = e.target.closest('.task');
      if (clickedTask) {
        handleTaskClick(clickedTask);
      }
    };

    updateTimeDisplay();

    // Timer durations (default values)
    let pomodoroDuration = 25;
    let shortBreakDuration = 5;
    let longBreakDuration = 15;

    function showSettings() {
      document.getElementById('pomodoroDuration').value = pomodoroDuration;
      document.getElementById('shortBreakDuration').value = shortBreakDuration;
      document.getElementById('longBreakDuration').value = longBreakDuration;
      document.getElementById('settingsModal').style.display = 'flex';
    }

    function hideSettings() {
      document.getElementById('settingsModal').style.display = 'none';
    }

    function saveSettings() {
      pomodoroDuration = parseInt(document.getElementById('pomodoroDuration').value);
      shortBreakDuration = parseInt(document.getElementById('shortBreakDuration').value);
      longBreakDuration = parseInt(document.getElementById('longBreakDuration').value);
      
      // Update current timer if needed
      const activeTab = document.querySelector('.tabs button.active');
      if (activeTab.textContent.includes('Pomodoro')) {
        timeLeft = pomodoroDuration * 60;
      } else if (activeTab.textContent.includes('Short')) {
        timeLeft = shortBreakDuration * 60;
      } else {
        timeLeft = longBreakDuration * 60;
      }
      
      updateTimeDisplay();
      hideSettings();
    }

    function viewReport() {
  // Get all records from localStorage
  const records = JSON.parse(localStorage.getItem('pomodoroRecords')) || [];
  
  // Store the records in sessionStorage temporarily
  sessionStorage.setItem('reportData', JSON.stringify(records));
  
  // Open the report page
  window.open('report.html', '_blank');
}

    // Update setMode function to use the new durations
    const originalSetMode = setMode;
    setMode = function(mode) {
      timeLeft = mode === 'pomodoro' ? pomodoroDuration * 60 : 
                 mode === 'short' ? shortBreakDuration * 60 : 
                 longBreakDuration * 60;
      updateTimeDisplay();
      clearInterval(timer);
      isRunning = false;
      startStopBtn.textContent = 'START';
      document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
      document.querySelector(`.tabs button[onclick*="${mode}"]`).classList.add('active');
    };

    // 🔁 Load tasks from localStorage on startup
    window.addEventListener('DOMContentLoaded', () => {
      const savedTasks = JSON.parse(localStorage.getItem('taskData')) || [];
      savedTasks.forEach(task => {
        createTaskElement(task.name, task.estPomos);
      });
      // Keep task list hidden on load
      document.getElementById('taskList').style.display = 'none';
    });

// 💾 Save tasks to localStorage
function updateLocalStorage() {
 const tasks = [...document.querySelectorAll('.task')].map(task => {
  const name = task.querySelector('.task-name').textContent.trim();
  const estPomos = task.querySelector('small')?.textContent.match(/\d+/)?.[0] || '1';
  return { name, estPomos };
});

  localStorage.setItem('taskData', JSON.stringify(tasks));
}

// 🛠 Modified helper function to create tasks (used by both user + storage)
function createTaskElement(name, estPomos = '1') {
  const taskDiv = document.createElement('div');
  taskDiv.className = 'task';
  taskDiv.innerHTML = `
   <span class="task-name">${name}</span>
  <small>No. of Pomodoros: ${estPomos}</small>
  <div class='task-menu-container'>
    <button onclick='startEditing(this)' title="Task options">⋯</button>
  </div>
  `;
  taskDiv.addEventListener('click', () => handleTaskClick(taskDiv));
  taskList.appendChild(taskDiv);
}

// ⏫ Extend existing saveTask function (WITHOUT removing it)
const originalSaveTask = saveTask;
saveTask = function () {
  const name = taskNameInput.value.trim();
  const estPomos = document.getElementById('estPomoInput').value;

  if (!name) return;

  createTaskElement(name, estPomos);
  updateLocalStorage();
  clearForm();
};


// ⏫ Hook delete + save edit to storage too (non-invasively)
const originalDelete = deleteTaskFromEdit;
deleteTaskFromEdit = function (btn) {
  originalDelete(btn);
  updateLocalStorage(); // 🧠 Save after delete
};

const originalSaveEdit = saveEdit;
saveEdit = function (btn) {
  originalSaveEdit(btn);
  updateLocalStorage(); // 🧠 Save after edit
};

  

function clearAllTasks() {
  if (confirm('Are you sure you want to delete all tasks?')) {
    taskList.innerHTML = '';
    updateLocalStorage();
  }
}