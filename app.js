const storageKey = "dailyTasks";

const taskForm = document.querySelector("#taskForm");
const taskTitle = document.querySelector("#taskTitle");
const taskReminder = document.querySelector("#taskReminder");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const notificationButton = document.querySelector("#notificationButton");
const filterButtons = document.querySelectorAll(".filter-button");

let tasks = loadTasks();
let activeFilter = "all";

renderTasks();
scheduleReminderChecks();

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskTitle.value.trim();

  if (!title) {
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    reminderAt: taskReminder.value || null,
    completed: false,
    reminded: false,
    createdAt: new Date().toISOString(),
  });

  saveTasks();
  renderTasks();
  taskForm.reset();
});

taskList.addEventListener("click", (event) => {
  const taskItem = event.target.closest("[data-task-id]");

  if (!taskItem) {
    return;
  }

  const taskId = taskItem.dataset.taskId;

  if (event.target.matches("[data-action='toggle']")) {
    tasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
  }

  if (event.target.matches("[data-action='delete']")) {
    tasks = tasks.filter((task) => task.id !== taskId);
  }

  saveTasks();
  renderTasks();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderTasks();
  });
});

notificationButton.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("المتصفح لا يدعم إشعارات التذكير.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    new Notification("تم تفعيل التذكيرات", {
      body: "سأذكّرك بالمهام عند وقتها طالما الصفحة مفتوحة.",
    });
  }
});

function loadTasks() {
  const savedTasks = localStorage.getItem(storageKey);
  return savedTasks ? JSON.parse(savedTasks) : [];
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function renderTasks() {
  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === "pending") {
      return !task.completed;
    }

    if (activeFilter === "completed") {
      return task.completed;
    }

    return true;
  });

  taskList.innerHTML = visibleTasks
    .map(
      (task) => `
        <li class="task-item ${task.completed ? "completed" : ""}" data-task-id="${task.id}">
          <input data-action="toggle" type="checkbox" ${task.completed ? "checked" : ""} aria-label="تغيير حالة المهمة" />
          <div>
            <p class="task-title">${escapeHtml(task.title)}</p>
            <p class="task-time">${formatReminder(task.reminderAt)}</p>
          </div>
          <button class="delete-button" data-action="delete" type="button">حذف</button>
        </li>
      `
    )
    .join("");

  emptyState.classList.toggle("visible", visibleTasks.length === 0);
}

function formatReminder(value) {
  if (!value) {
    return "بدون تذكير";
  }

  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function scheduleReminderChecks() {
  setInterval(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const now = Date.now();
    let changed = false;

    tasks = tasks.map((task) => {
      if (
        !task.completed &&
        !task.reminded &&
        task.reminderAt &&
        new Date(task.reminderAt).getTime() <= now
      ) {
        new Notification("تذكير بمهمة", {
          body: task.title,
        });

        changed = true;
        return { ...task, reminded: true };
      }

      return task;
    });

    if (changed) {
      saveTasks();
      renderTasks();
    }
  }, 30000);
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}
