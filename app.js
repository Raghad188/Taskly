const storageKey = "dailyTasks";

const taskForm = document.querySelector("#taskForm");
const taskTitle = document.querySelector("#taskTitle");
const taskDescription = document.querySelector("#taskDescription");
const taskPriority = document.querySelector("#taskPriority");
const taskReminder = document.querySelector("#taskReminder");
const taskSearch = document.querySelector("#taskSearch");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const notificationButton = document.querySelector("#notificationButton");
const filterButtons = document.querySelectorAll(".filter-button");
const priorityFilterButtons = document.querySelectorAll(".priority-filter-button");

let tasks = loadTasks();
let activeFilter = "all";
let activePriorityFilter = "all";
let searchQuery = "";
let editingTaskId = null;

renderTasks();
updateNotificationButton();
scheduleReminderChecks();

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskTitle.value.trim();

  if (!title) {
    return;
  }

  if (editingTaskId) {
    updateTask(title);
    return;
  }

  tasks.unshift({
    id: createTaskId(),
    title,
    description: taskDescription.value.trim(),
    priority: taskPriority.value,
    reminderAt: taskReminder.value || null,
    completed: false,
    reminded: false,
    createdAt: new Date().toISOString(),
  });

  saveTasks();
  renderTasks();
  resetForm();
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

  if (event.target.matches("[data-action='edit']")) {
    startEditingTask(taskId);
    return;
  }

  if (event.target.matches("[data-action='delete']")) {
    tasks = tasks.filter((task) => task.id !== taskId);

    if (editingTaskId === taskId) {
      resetForm();
    }
  }

  saveTasks();
  renderTasks();
});

cancelEditButton.addEventListener("click", resetForm);

taskSearch.addEventListener("input", () => {
  searchQuery = taskSearch.value.trim().toLowerCase();
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

priorityFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activePriorityFilter = button.dataset.priorityFilter;
    priorityFilterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderTasks();
  });
});

notificationButton.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    showNotificationStatus("المتصفح لا يدعم الإشعارات.", true);
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      showNotificationStatus("الإشعارات مفعلة. سأذكّرك بالمهام طالما الصفحة مفتوحة.");
      sendNotification("تم تفعيل التذكيرات", "سأذكّرك بالمهام عند وقتها طالما الصفحة مفتوحة.");
      updateNotificationButton();
      return;
    }

    if (permission === "denied") {
      showNotificationStatus("الإشعارات مرفوضة من إعدادات المتصفح.", true);
      updateNotificationButton();
      return;
    }

    showNotificationStatus("لم يتم تفعيل الإشعارات بعد.", true);
  } catch (error) {
    console.warn("Could not request notification permission.", error);
    showNotificationStatus("تعذر تفعيل الإشعارات من هذا المتصفح.", true);
  }
});

function loadTasks() {
  try {
    if (typeof localStorage === "undefined") {
      return [];
    }

    const savedTasks = localStorage.getItem(storageKey);
    return savedTasks ? JSON.parse(savedTasks) : [];
  } catch (error) {
    console.warn("Could not load saved tasks.", error);
    return [];
  }
}

function saveTasks() {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(tasks));
  } catch (error) {
    console.warn("Could not save tasks.", error);
  }
}

function createTaskId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function updateNotificationButton() {
  if (!("Notification" in window)) {
    notificationButton.textContent = "🔕";
    notificationButton.title = "المتصفح لا يدعم الإشعارات";
    showNotificationStatus("المتصفح لا يدعم الإشعارات.", true);
    return;
  }

  if (Notification.permission === "granted") {
    notificationButton.textContent = "🔔";
    notificationButton.title = "الإشعارات مفعلة";
    showNotificationStatus("الإشعارات مفعلة");
    return;
  }

  if (Notification.permission === "denied") {
    notificationButton.textContent = "🔕";
    notificationButton.title = "الإشعارات مرفوضة من إعدادات المتصفح";
    showNotificationStatus("الإشعارات مرفوضة من إعدادات المتصفح.", true);
    return;
  }

  notificationButton.textContent = "🔔";
  notificationButton.title = "تفعيل التذكيرات";
  showNotificationStatus("الإشعارات غير مفعلة");
}

function showNotificationStatus(message, isWarning = false) {
  const notificationStatus = document.querySelector("#notificationStatus");
  notificationStatus.textContent = message;
  notificationStatus.classList.toggle("warning", isWarning);
}

function sendNotification(title, body) {
  try {
    new Notification(title, { body });
  } catch (error) {
    console.warn("Could not send notification.", error);
    alert(`${title}\n${body}`);
  }
}

function renderTasks() {
  const visibleTasks = tasks.filter(shouldShowTask);

  taskList.innerHTML = visibleTasks
    .map(
      (task) => `
        <li class="task-item ${task.completed ? "completed" : ""}" data-task-id="${task.id}">
          <input data-action="toggle" type="checkbox" ${task.completed ? "checked" : ""} aria-label="تغيير حالة المهمة" />
          <div>
            <p class="task-title">${escapeHtml(task.title)}</p>
            ${renderDescription(task.description)}
            <div class="task-meta">
              <span class="priority-badge priority-${task.priority || "medium"}">
                ${formatPriority(task.priority)}
              </span>
              <p class="task-time">${formatReminder(task.reminderAt)}</p>
            </div>
          </div>
          <div class="task-actions">
            <button class="edit-button" data-action="edit" type="button">تعديل</button>
            <button class="delete-button" data-action="delete" type="button">حذف</button>
          </div>
        </li>
      `
    )
    .join("");

  emptyState.textContent = getEmptyStateMessage();
  emptyState.classList.toggle("visible", visibleTasks.length === 0);
}

function getEmptyStateMessage() {
  if (searchQuery) {
    return "لا توجد مهام مطابقة للبحث الحالي.";
  }

  if (activePriorityFilter !== "all") {
    return `لا توجد مهام بأولوية ${formatPriority(activePriorityFilter)} ضمن هذا الفلتر.`;
  }

  if (activeFilter === "pending") {
    return "لا توجد مهام غير مكتملة حاليًا.";
  }

  if (activeFilter === "completed") {
    return "لا توجد مهام مكتملة بعد.";
  }

  return "لا توجد مهام بعد. أضف أول مهمة وخلينا نبدأ.";
}

function shouldShowTask(task) {
  const matchesStatus =
    activeFilter === "all" ||
    (activeFilter === "pending" && !task.completed) ||
    (activeFilter === "completed" && task.completed);

  const matchesPriority =
    activePriorityFilter === "all" || (task.priority || "medium") === activePriorityFilter;

  const searchableText = `${task.title} ${task.description || ""}`.toLowerCase();
  const matchesSearch = !searchQuery || searchableText.includes(searchQuery);

  return matchesStatus && matchesPriority && matchesSearch;
}

function updateTask(title) {
  tasks = tasks.map((task) =>
    task.id === editingTaskId
      ? {
          ...task,
          title,
          description: taskDescription.value.trim(),
          priority: taskPriority.value,
          reminderAt: taskReminder.value || null,
          reminded: task.reminderAt === taskReminder.value ? task.reminded : false,
        }
      : task
  );

  saveTasks();
  renderTasks();
  resetForm();
}

function startEditingTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  editingTaskId = taskId;
  taskTitle.value = task.title;
  taskDescription.value = task.description || "";
  taskPriority.value = task.priority || "medium";
  taskReminder.value = task.reminderAt || "";
  submitButton.textContent = "حفظ التعديل";
  cancelEditButton.classList.remove("hidden");
  taskTitle.focus();
}

function resetForm() {
  editingTaskId = null;
  taskForm.reset();
  taskPriority.value = "medium";
  submitButton.textContent = "إضافة المهمة";
  cancelEditButton.classList.add("hidden");
}

function renderDescription(description) {
  if (!description) {
    return "";
  }

  return `<p class="task-description">${escapeHtml(description)}</p>`;
}

function formatPriority(priority) {
  const priorities = {
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
  };

  return priorities[priority] || priorities.medium;
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
        sendNotification("تذكير بمهمة", task.title);

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
