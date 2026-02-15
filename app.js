const USERS_KEY = "bgw_users";
const GIFTS_KEY = "bgw_gifts";
const SESSION_KEY = "bgw_session";

const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authMessage = document.getElementById("auth-message");
const showLoginBtn = document.getElementById("show-login");
const showRegisterBtn = document.getElementById("show-register");
const welcomeText = document.getElementById("welcome-text");
const birthdayDisplay = document.getElementById("birthday-display");
const birthdayForm = document.getElementById("birthday-form");
const birthdayInput = document.getElementById("birthday-input");
const giftForm = document.getElementById("gift-form");
const recipientSelect = document.getElementById("recipient-select");
const giftMessage = document.getElementById("gift-message");
const giftAmount = document.getElementById("gift-amount");
const giftNote = document.getElementById("gift-note");
const unlockStatus = document.getElementById("unlock-status");
const totalGift = document.getElementById("total-gift");
const inboxList = document.getElementById("inbox-list");
const logoutBtn = document.getElementById("logout-btn");
const messageTemplate = document.getElementById("message-template");

function readJSON(key, fallback) {
  const data = localStorage.getItem(key);
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return readJSON(USERS_KEY, []);
}

function getGifts() {
  return readJSON(GIFTS_KEY, []);
}

function getSessionUser() {
  return localStorage.getItem(SESSION_KEY);
}

function setSessionUser(username) {
  localStorage.setItem(SESSION_KEY, username);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function formatBirthday(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "미설정";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function birthdayParts(dateStr) {
  const d = new Date(dateStr);
  return { month: d.getMonth() + 1, day: d.getDate() };
}

function isBirthdayToday(dateStr) {
  const today = new Date();
  const { month, day } = birthdayParts(dateStr);
  return today.getMonth() + 1 === month && today.getDate() === day;
}

function isAfterBirthdayThisYear(dateStr) {
  const today = new Date();
  const { month, day } = birthdayParts(dateStr);
  const bday = new Date(today.getFullYear(), month - 1, day);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return now > bday;
}

function switchAuth(mode) {
  const isLogin = mode === "login";
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  showLoginBtn.classList.toggle("active", isLogin);
  showRegisterBtn.classList.toggle("active", !isLogin);
  authMessage.textContent = "";
}

function renderRecipientOptions(currentUser) {
  const users = getUsers();
  const available = users.filter((u) => u.username !== currentUser.username && isBirthdayToday(u.birthday));

  recipientSelect.innerHTML = "";
  if (!available.length) {
    const op = document.createElement("option");
    op.textContent = "오늘 생일인 친구가 없습니다";
    op.value = "";
    recipientSelect.appendChild(op);
    giftForm.querySelector("button").disabled = true;
    return;
  }

  available.forEach((u) => {
    const op = document.createElement("option");
    op.value = u.username;
    op.textContent = `${u.username} (${formatBirthday(u.birthday)})`;
    recipientSelect.appendChild(op);
  });
  giftForm.querySelector("button").disabled = false;
}

function createReplyForm(gift) {
  const wrap = document.createElement("div");

  if (gift.reply) {
    const reply = document.createElement("p");
    reply.className = "reply-text";
    reply.textContent = `내 답장: ${gift.reply}`;
    wrap.appendChild(reply);
    return wrap;
  }

  const form = document.createElement("form");
  form.className = "form compact";

  const label = document.createElement("label");
  label.textContent = "답장";
  const input = document.createElement("input");
  input.required = true;
  input.maxLength = 200;
  label.appendChild(input);

  const button = document.createElement("button");
  button.textContent = "답장 남기기";
  button.type = "submit";

  form.append(label, button);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const gifts = getGifts();
    const target = gifts.find((g) => g.id === gift.id);
    if (!target) return;
    target.reply = input.value.trim();
    saveJSON(GIFTS_KEY, gifts);
    renderDashboard();
  });

  wrap.appendChild(form);
  return wrap;
}

function renderInbox(currentUser) {
  const gifts = getGifts().filter((g) => g.to === currentUser.username);
  inboxList.innerHTML = "";

  if (!isAfterBirthdayThisYear(currentUser.birthday)) {
    unlockStatus.textContent = "메시지는 올해 생일이 지난 뒤에 열람할 수 있습니다.";
    totalGift.textContent = "";
    return;
  }

  unlockStatus.textContent = "생일이 지나 메시지가 열렸습니다 🎉";

  const total = gifts.reduce((sum, g) => sum + Number(g.amount), 0);
  totalGift.textContent = `총 선물 금액: ${total.toLocaleString()}원`;

  if (!gifts.length) {
    inboxList.innerHTML = "<li>아직 받은 메시지가 없습니다.</li>";
    return;
  }

  gifts.forEach((g) => {
    const item = messageTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector(".message-head").textContent = `${g.from}님이 ${Number(g.amount).toLocaleString()}원을 보냈어요`;
    item.querySelector(".message-body").textContent = g.message;
    item.querySelector(".reply-block").appendChild(createReplyForm(g));
    inboxList.appendChild(item);
  });
}

function renderDashboard() {
  const username = getSessionUser();
  const users = getUsers();
  const currentUser = users.find((u) => u.username === username);

  if (!currentUser) {
    clearSession();
    authSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
    return;
  }

  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");

  welcomeText.textContent = `${currentUser.username}님, 환영합니다!`;
  birthdayDisplay.textContent = `내 생일: ${formatBirthday(currentUser.birthday)}`;
  birthdayInput.value = currentUser.birthday;

  renderRecipientOptions(currentUser);
  renderInbox(currentUser);
}

showLoginBtn.addEventListener("click", () => switchAuth("login"));
showRegisterBtn.addEventListener("click", () => switchAuth("register"));

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value;
  const birthday = document.getElementById("register-birthday").value;

  if (!username || !password || !birthday) {
    authMessage.textContent = "모든 항목을 입력하세요.";
    return;
  }

  const users = getUsers();
  if (users.some((u) => u.username === username)) {
    authMessage.textContent = "이미 존재하는 사용자명입니다.";
    return;
  }

  users.push({ username, password, birthday });
  saveJSON(USERS_KEY, users);
  authMessage.textContent = "회원가입 완료! 로그인해주세요.";
  registerForm.reset();
  switchAuth("login");
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const user = getUsers().find((u) => u.username === username && u.password === password);

  if (!user) {
    authMessage.textContent = "로그인 정보가 올바르지 않습니다.";
    return;
  }

  setSessionUser(user.username);
  loginForm.reset();
  renderDashboard();
});

birthdayForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newBirthday = birthdayInput.value;
  const username = getSessionUser();
  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return;

  user.birthday = newBirthday;
  saveJSON(USERS_KEY, users);
  renderDashboard();
});

giftForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const sender = getSessionUser();
  const to = recipientSelect.value;
  const message = giftMessage.value.trim();
  const amount = Number(giftAmount.value);

  if (!to || !message || Number.isNaN(amount) || amount < 0) {
    giftNote.textContent = "받는 사람, 메시지, 금액을 올바르게 입력하세요.";
    return;
  }

  const users = getUsers();
  const recipient = users.find((u) => u.username === to);
  if (!recipient || !isBirthdayToday(recipient.birthday)) {
    giftNote.textContent = "메시지는 받는 사람의 생일 당일에만 남길 수 있습니다.";
    return;
  }

  const gifts = getGifts();
  gifts.push({
    id: crypto.randomUUID(),
    from: sender,
    to,
    message,
    amount,
    createdAt: new Date().toISOString(),
    reply: "",
  });

  saveJSON(GIFTS_KEY, gifts);
  giftForm.reset();
  giftNote.textContent = "메시지와 선물을 전달했어요!";
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  dashboard.classList.add("hidden");
  authSection.classList.remove("hidden");
  switchAuth("login");
});

if (getSessionUser()) {
  renderDashboard();
}
