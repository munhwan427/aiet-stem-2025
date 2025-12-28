// AIET IN STEM Authentication System
// Member Database with Speaker Emails

const MEMBERS = [
  { email: 'krajcik@msu.edu', name: 'Joseph Krajcik', role: 'Steering Board', affiliation: 'Michigan State University' },
  { email: 'uramnarain@uj.ac.za', name: 'Umesh Ramnarain', role: 'Steering Board', affiliation: 'University of Johannesburg' },
  { email: 'neumann@leibniz-ipn.de', name: 'Knut Neumann', role: 'Steering Board', affiliation: 'IPN Leibniz Institute' },
  { email: 'namsoo@msu.edu', name: 'Namsoo Shin', role: 'Co-Organizer', affiliation: 'Michigan State University' },
  { email: 'tangjili@msu.edu', name: 'Jiliang Tang', role: 'Steering Board', affiliation: 'Michigan State University' },
  { email: 'janice.gobert@gse.rutgers.edu', name: 'Janice Gobert', role: 'Steering Board', affiliation: 'Rutgers University' },
  { email: 'mhchiu@gapps.ntnu.edu.tw', name: 'Mei-Hung Chiu', role: 'Steering Board', affiliation: 'National Taiwan Normal University' },
  { email: 'copurgen@usc.edu', name: 'Yasemin Copur-Gencturk', role: 'Steering Board', affiliation: 'University of Southern California' },
  { email: 'quintana@umich.edu', name: 'Chris Quintana', role: 'Steering Board', affiliation: 'University of Michigan' },
  { email: 'edsona@msu.edu', name: 'Alden Jack Edson', role: 'Steering Board', affiliation: 'Michigan State University' },
  { email: 'ethelcormier@aol.com', name: 'Ethel Cormier', role: 'Steering Board', affiliation: 'Education Consultant' },
  { email: 'belzebut@jejutp.or.kr', name: 'Cheolwoong Kang', role: 'Steering Board', affiliation: 'Jeju National University / RISE Initiative' },
  { email: '87dooly@naver.com', name: 'Chungjae Lim', role: 'Steering Board', affiliation: 'Keimyung University' },
  { email: 'ahn@anarchy.io', name: 'Ahn Munhwan', role: 'Co-Organizer', affiliation: 'Anarchy Inc.' }
];

const DEFAULT_PASSWORD = 'stem2025';

// Session duration: 6 months in milliseconds
const SESSION_DURATION_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~6 months

// Auth State
let currentUser = null;

// Initialize auth system
function initAuth() {
  // Check for existing session with expiration
  const savedSession = localStorage.getItem('aiet_session');
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      // Check if session is still valid (within 6 months)
      if (session.expiresAt && new Date(session.expiresAt) > new Date()) {
        currentUser = session.user;
      } else {
        // Session expired, clear it
        localStorage.removeItem('aiet_session');
        console.log('Session expired, please login again');
      }
    } catch (e) {
      localStorage.removeItem('aiet_session');
    }
  }

  // Create login modal if it doesn't exist
  createLoginModal();

  // Update UI
  updateAuthUI();
}

// Create login modal HTML
function createLoginModal() {
  if (document.getElementById('login-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'login-modal';
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-modal-content">
      <button class="auth-modal-close" onclick="closeLoginModal()">&times;</button>
      <div class="auth-modal-header">
        <h2>Member Login</h2>
        <p>Sign in with your registered email</p>
      </div>
      <form id="login-form" onsubmit="handleLogin(event)">
        <div class="auth-form-group">
          <label for="login-email">Email</label>
          <input type="email" id="login-email" placeholder="your@email.com" required>
        </div>
        <div class="auth-form-group">
          <label for="login-password">Password</label>
          <input type="password" id="login-password" placeholder="Password" required>
        </div>
        <div id="login-error" class="auth-error"></div>
        <button type="submit" class="auth-submit-btn">Sign In</button>
      </form>
      <div class="auth-modal-footer">
        <p>Contact <a href="mailto:ahn@anarchy.io">ahn@anarchy.io</a> for access</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLoginModal();
  });
}

// Handle login
function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('login-email').value.toLowerCase().trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  // Find member
  const member = MEMBERS.find(m => m.email.toLowerCase() === email);

  if (!member) {
    errorEl.textContent = 'Email not registered. Contact organizers for access.';
    errorEl.style.display = 'block';
    return;
  }

  if (password !== DEFAULT_PASSWORD) {
    errorEl.textContent = 'Incorrect password.';
    errorEl.style.display = 'block';
    return;
  }

  // Success - save user with 6-month session
  currentUser = {
    email: member.email,
    name: member.name,
    role: member.role,
    affiliation: member.affiliation,
    loginTime: new Date().toISOString()
  };

  // Save session with expiration (6 months)
  const session = {
    user: currentUser,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString()
  };
  localStorage.setItem('aiet_session', JSON.stringify(session));

  closeLoginModal();
  updateAuthUI();

  // Show welcome message
  showToast(`Welcome, ${member.name}!`);
}

// Logout
function handleLogout() {
  currentUser = null;
  localStorage.removeItem('aiet_session');
  updateAuthUI();
  showToast('You have been logged out.');
}

// Update UI based on auth state
function updateAuthUI() {
  const authContainer = document.getElementById('auth-container');
  if (!authContainer) return;

  if (currentUser) {
    const isAdminUser = currentUser.email.toLowerCase() === 'ahn@anarchy.io';
    authContainer.innerHTML = `
      <div class="auth-user-info">
        <span class="auth-user-name">${currentUser.name}</span>
        <div class="auth-dropdown">
          <button class="auth-dropdown-btn" onclick="toggleAuthDropdown()">
            <span class="auth-avatar">${getInitials(currentUser.name)}</span>
          </button>
          <div class="auth-dropdown-menu" id="auth-dropdown-menu">
            <div class="auth-dropdown-header">
              <strong>${currentUser.name}</strong>
              <span>${currentUser.role}</span>
            </div>
            <a href="board.html">Member Board</a>
            <a href="submit.html">Submit Content</a>
            ${isAdminUser ? '<a href="admin.html" class="admin-link"><i class="fas fa-shield-alt"></i> Admin Dashboard</a>' : ''}
            <a href="speakers.html">Network</a>
            <a href="blog.html">Blog</a>
            <button onclick="handleLogout()">Sign Out</button>
          </div>
        </div>
      </div>
    `;
  } else {
    authContainer.innerHTML = `
      <button class="auth-login-btn" onclick="openLoginModal()">
        <span>Sign In</span>
      </button>
    `;
  }
}

// Get user initials
function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Modal controls
function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('login-email').focus();
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // Clear form
    document.getElementById('login-form').reset();
    document.getElementById('login-error').style.display = 'none';
  }
}

// Dropdown toggle
function toggleAuthDropdown() {
  const menu = document.getElementById('auth-dropdown-menu');
  if (menu) {
    menu.classList.toggle('active');
  }
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('auth-dropdown-menu');
  const btn = document.querySelector('.auth-dropdown-btn');
  if (dropdown && !dropdown.contains(e.target) && !btn?.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

// Toast notification
function showToast(message) {
  // Remove existing toast
  const existingToast = document.querySelector('.auth-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'auth-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('active'), 10);
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Check if user is logged in
function isLoggedIn() {
  return currentUser !== null;
}

// Get current user
function getCurrentUser() {
  return currentUser;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initAuth);
