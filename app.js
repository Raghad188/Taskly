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
const totalTasksCount = document.querySelector("#totalTasksCount");
const pendingTasksCount = document.querySelector("#pendingTasksCount");
const completedTasksCount = document.querySelector("#completedTasksCount");
const highPriorityTasksCount = document.querySelector("#highPriorityTasksCount");
const completionRate = document.querySelector("#completionRate");
const completionBar = document.querySelector("#completionBar");
const visibleTasksCount = document.querySelector("#visibleTasksCount");
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
    title: title.slice(0, 80),
    description: taskDescription.value.trim().slice(0, 240),
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
    const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

    if (!Array.isArray(parsedTasks)) {
      return [];
    }

    return parsedTasks.map(normalizeTask).filter(Boolean);
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

function normalizeTask(task) {
  if (!task || typeof task !== "object" || typeof task.title !== "string") {
    return null;
  }

  const title = task.title.trim().slice(0, 80);

  if (!title) {
    return null;
  }

  const allowedPriorities = ["high", "medium", "low"];
  const priority = allowedPriorities.includes(task.priority) ? task.priority : "medium";

  return {
    id: typeof task.id === "string" ? task.id : createTaskId(),
    title,
    description: typeof task.description === "string" ? task.description.trim().slice(0, 240) : "",
    priority,
    reminderAt: typeof task.reminderAt === "string" ? task.reminderAt : null,
    completed: Boolean(task.completed),
    reminded: Boolean(task.reminded),
    createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString(),
  };
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

  renderStats(visibleTasks.length);
  taskList.replaceChildren(...visibleTasks.map(createTaskElement));

  emptyState.textContent = getEmptyStateMessage();
  emptyState.classList.toggle("visible", visibleTasks.length === 0);
}

function createTaskElement(task) {
  const taskItem = document.createElement("li");
  taskItem.className = `task-item ${task.completed ? "completed" : ""}`;
  taskItem.dataset.taskId = task.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.dataset.action = "toggle";
  checkbox.setAttribute("aria-label", "تغيير حالة المهمة");

  const taskContent = document.createElement("div");

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;
  taskContent.append(title);

  if (task.description) {
    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = task.description;
    taskContent.append(description);
  }

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const priority = document.createElement("span");
  const priorityValue = task.priority || "medium";
  priority.className = `priority-badge priority-${priorityValue}`;
  priority.textContent = formatPriority(priorityValue);

  const reminderTime = document.createElement("p");
  reminderTime.className = "task-time";
  reminderTime.textContent = formatReminder(task.reminderAt);

  meta.append(priority, reminderTime);
  taskContent.append(meta);

  const taskActions = document.createElement("div");
  taskActions.className = "task-actions";

  const editButton = document.createElement("button");
  editButton.className = "edit-button";
  editButton.dataset.action = "edit";
  editButton.type = "button";
  editButton.textContent = "تعديل";

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.dataset.action = "delete";
  deleteButton.type = "button";
  deleteButton.textContent = "حذف";

  taskActions.append(editButton, deleteButton);
  taskItem.append(checkbox, taskContent, taskActions);

  return taskItem;
}

function renderStats(visibleCount) {
  const totalCount = tasks.length;
  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = totalCount - completedCount;
  const completionPercentage = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  totalTasksCount.textContent = totalCount;
  pendingTasksCount.textContent = pendingCount;
  completedTasksCount.textContent = completedCount;
  highPriorityTasksCount.textContent = tasks.filter(
    (task) => (task.priority || "medium") === "high"
  ).length;
  completionRate.textContent = `${completionPercentage}%`;
  completionBar.style.width = `${completionPercentage}%`;
  visibleTasksCount.textContent = `${visibleCount} ${visibleCount === 1 ? "مهمة ظاهرة" : "مهام ظاهرة"}`;
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
          title: title.slice(0, 80),
          description: taskDescription.value.trim().slice(0, 240),
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
