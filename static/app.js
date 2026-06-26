// Terminal Elements
const terminalInput = document.getElementById('terminalInput');
const terminalLog = document.getElementById('terminalLog');
const terminalBody = document.getElementById('terminalBody');

// Focus terminal input on load & click
window.addEventListener('load', () => {
  if (terminalInput) terminalInput.focus();
  pollSystemStats();
  setInterval(pollSystemStats, 2000);
  loadGuestbookMessages();
  loadBlogPosts();
});

document.addEventListener('click', (e) => {
  // Only focus terminal if clicking inside terminal viewport or panel
  if (e.target.closest('.terminal-panel') && terminalInput) {
    terminalInput.focus();
  }
});

// Terminal Command List
const COMMANDS = {
  help: 'Show list of available commands',
  about: 'Learn who I am',
  skills: 'View my core technical competencies',
  projects: 'Browse my developer projects portfolio',
  socials: 'View links to my GitHub, LinkedIn, Leetcode, and Resume',
  blog: 'List developer blog articles',
  'blog view <slug>': 'Read a specific blog post in the terminal',
  guestbook: 'Show recent visitor guestbook signatures',
  'guestbook sign "<name>" "<msg>"': 'Write a message directly to SQLite from terminal',
  'admin login <password>': 'Log in as administrator to manage entries',
  'admin delete <id>': 'Delete a guestbook entry by its Database ID',
  'admin logout': 'Log out from admin session',
  clear: 'Clear terminal screen log'
};

// Handle Terminal Inputs
if (terminalInput) {
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const commandText = terminalInput.value.trim();
      terminalInput.value = '';
      if (commandText) {
        processCommand(commandText);
      }
    }
  });
}

function printToTerminal(text, className = 'output-msg') {
  const line = document.createElement('div');
  line.className = `terminal-line ${className}`;
  line.innerHTML = text;
  terminalLog.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

async function processCommand(cmdLine) {
  // Print Command Echo
  printToTerminal(`visitor@swanand-dev:~$ ${cmdLine}`, 'command-echo');

  const tokens = cmdLine.split(' ');
  const primaryCmd = tokens[0].toLowerCase();

  switch (primaryCmd) {
    case 'clear':
      terminalLog.innerHTML = '';
      break;

    case 'help':
      let helpStr = 'Available Commands:<br><table style="width:100%; border-collapse:collapse; margin-top:5px; font-family:inherit; font-size:0.85rem;">';
      for (const [cmd, desc] of Object.entries(COMMANDS)) {
        helpStr += `<tr>
          <td style="width:35%; min-width:140px; color:var(--terminal-magenta); font-weight:bold; padding:3px 0; vertical-align:top;">${cmd}</td>
          <td style="color:var(--text-muted); padding:3px 0; vertical-align:top;">- ${desc}</td>
        </tr>`;
      }
      helpStr += '</table>';
      printToTerminal(helpStr);
      break;

    case 'about':
      printToTerminal(
        'Enthusiastic fresher with a Bachelor’s degree in Computer Science (Honors in Artificial Intelligence and Machine Learning), eager to build a fast-growing career in software development. Skilled in Python, SQL, data analysis, and full-stack development, with a passion for learning, developing efficient and scalable solutions.'
      );
      break;

    case 'socials':
      printToTerminal(
        'My Social Profiles & Contact Channels:<br>' +
        '  * <span class="highlight">GitHub:</span> <a href="https://github.com/swanandjoshi30" target="_blank" style="color:var(--terminal-blue); text-decoration:none;">github.com/swanandjoshi30</a><br>' +
        '  * <span class="highlight">LinkedIn:</span> <a href="https://www.linkedin.com/in/swanand-joshi1212" target="_blank" style="color:var(--terminal-blue); text-decoration:none;">linkedin.com/in/swanand-joshi1212</a><br>' +
        '  * <span class="highlight">LeetCode:</span> <a href="https://leetcode.com/u/Swanand_Joshi/" target="_blank" style="color:var(--terminal-blue); text-decoration:none;">leetcode.com/u/Swanand_Joshi</a><br>' +
        '  * <span class="highlight">Email:</span> <a href="mailto:swanandofficial@gmail.com" style="color:var(--terminal-blue); text-decoration:none;">swanandofficial@gmail.com</a><br>' +
        '  * <span class="highlight">Resume:</span> <a href="/download-resume" target="_blank" style="color:var(--terminal-green); font-weight:bold; text-decoration:none;">Download PDF Resume</a>'
      );
      break;

    case 'skills':
      const skills = {
        Python: 90,
        Flask: 85,
        JavaScript: 80,
        SQLAlchemy: 85,
        Docker: 70,
        Git: 80
      };
      let skillStr = 'Technical Competencies:<br>';
      for (const [skill, val] of Object.entries(skills)) {
        const barWidth = Math.round(val / 5);
        const bar = '='.repeat(barWidth) + ' '.repeat(20 - barWidth);
        skillStr += `  <span class="accent-col">${skill.padEnd(12)}</span> [${bar}] ${val}%<br>`;
      }
      printToTerminal(skillStr);
      break;

    case 'projects':
      printToTerminal(
        'Key Projects Portfolio:<br>' +
        '1. <span class="highlight">Titan Voice Assistant:</span> Interactive assistant with fuzzy NLP parsing. (Run `open titan` to view)<br>' +
        '2. <span class="highlight">Version Guard:</span> Real-time configuration tracker CLI featuring colored side-by-side diffs.'
      );
      break;

    case 'open':
      if (tokens[1] === 'titan') {
        printToTerminal('Redirecting to Titan Assistant...');
        setTimeout(() => { window.open('http://127.0.0.1:5000', '_blank'); }, 1000);
      } else {
        printToTerminal('Usage: open titan', 'error-msg');
      }
      break;

    case 'blog':
      if (tokens[1] === 'view') {
        const slug = tokens[2];
        if (!slug) {
          printToTerminal('Error: Specify a slug (e.g. blog view welcome)', 'error-msg');
          return;
        }
        try {
          const response = await fetch(`/api/blog/${slug}`);
          if (response.ok) {
            const data = await response.json();
            // Convert HTML to simple readable plain text/markdown style for terminal
            const cleanText = data.content
              .replace(/<h[1-6]>/g, '\n# ')
              .replace(/<\/h[1-6]>/g, '\n')
              .replace(/<p>/g, '\n')
              .replace(/<\/p>/g, '\n')
              .replace(/<br\s*\/?>/g, '\n')
              .replace(/<pre><code>/g, '\n---\n')
              .replace(/<\/code><\/pre>/g, '\n---\n')
              .replace(/<[^>]+>/g, '');
            printToTerminal(`<h3>${data.title}</h3>` + cleanText);
          } else {
            printToTerminal(`Post '${slug}' not found. Use 'blog' to list posts.`, 'error-msg');
          }
        } catch (e) {
          printToTerminal('Connection error. Failed to read blog.', 'error-msg');
        }
      } else {
        // Just list blogs
        try {
          const response = await fetch('/api/blog');
          const posts = await response.json();
          if (posts.length === 0) {
            printToTerminal('No blog posts found.');
          } else {
            let listStr = 'Available Articles:<br>';
            posts.forEach(p => {
              listStr += `  * <span class="highlight">${p.slug}</span> - ${p.title} (Type: blog view ${p.slug})<br>`;
            });
            printToTerminal(listStr);
          }
        } catch (e) {
          printToTerminal('Connection error. Failed to load posts.', 'error-msg');
        }
      }
      break;

    case 'guestbook':
      if (tokens[1] === 'sign') {
        // Extract quotes name & msg using regex: guestbook sign "Name" "Message"
        const matches = cmdLine.match(/guestbook\s+sign\s+"([^"]+)"\s+"([^"]+)"/i);
        if (!matches || matches.length < 3) {
          printToTerminal('Error: Invalid format. Use: guestbook sign "Name" "Your Message"', 'error-msg');
          return;
        }
        const name = matches[1];
        const message = matches[2];
        try {
          const response = await fetch('/api/guestbook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, message })
          });
          if (response.ok) {
            printToTerminal('Success: Guestbook signed successfully! [SQLite Updated]', 'highlight');
            loadGuestbookMessages(); // Refresh GUI
          } else {
            const data = await response.json();
            printToTerminal(`Error: ${data.error || 'Failed to sign.'}`, 'error-msg');
          }
        } catch (e) {
          printToTerminal('Connection error. Failed to post entry.', 'error-msg');
        }
      } else {
        // Read recent guestbook entries
        try {
          const response = await fetch('/api/guestbook');
          const entries = await response.json();
          if (entries.length === 0) {
            printToTerminal('Guestbook is currently empty. Be the first to sign! (Use: guestbook sign "Name" "Msg")');
          } else {
            let entriesStr = 'Recent Guestbook Signatures:<br>';
            
            // Check admin status to decide if we append entry Database IDs
            let isAdmin = false;
            try {
              const statusRes = await fetch('/api/admin/status');
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                isAdmin = statusData.is_admin;
              }
            } catch (err) {}

            entries.forEach(e => {
              const idPrefix = isAdmin ? `<span style="color:var(--terminal-magenta)">[ID: ${e.id}]</span> ` : '';
              entriesStr += `  ${idPrefix}[${e.created_at}] <span class="accent-col">${e.name}</span>: ${e.message}<br>`;
            });
            printToTerminal(entriesStr);
          }
        } catch (e) {
          printToTerminal('Connection error. Failed to read guestbook.', 'error-msg');
        }
      }
      break;

    case 'admin':
      const subAdminCmd = tokens[1] ? tokens[1].toLowerCase() : '';
      if (subAdminCmd === 'login') {
        const password = tokens[2];
        if (!password) {
          printToTerminal('Error: Specify password. Usage: admin login <password>', 'error-msg');
          return;
        }
        try {
          const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
          });
          if (response.ok) {
            printToTerminal('Access Granted: Logged in as Administrator.', 'highlight');
            loadGuestbookMessages(); // Refresh GUI to show delete buttons
          } else {
            const data = await response.json();
            printToTerminal(`Access Denied: ${data.error || 'Invalid password.'}`, 'error-msg');
          }
        } catch (e) {
          printToTerminal('Connection error. Failed to login.', 'error-msg');
        }
      } else if (subAdminCmd === 'logout') {
        try {
          const response = await fetch('/api/admin/logout', { method: 'POST' });
          if (response.ok) {
            printToTerminal('Logged out successfully from administrator session.', 'system-msg');
            loadGuestbookMessages(); // Hide delete buttons
          }
        } catch (e) {
          printToTerminal('Connection error. Failed to logout.', 'error-msg');
        }
      } else if (subAdminCmd === 'delete') {
        const id = tokens[2];
        if (!id) {
          printToTerminal('Error: Specify the entry ID to delete. Usage: admin delete <id>', 'error-msg');
          return;
        }
        try {
          const response = await fetch(`/api/admin/delete/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            printToTerminal(`Success: Entry ${id} deleted successfully.`, 'highlight');
            loadGuestbookMessages(); // Refresh GUI
          } else {
            const data = await response.json();
            printToTerminal(`Error: ${data.error || 'Failed to delete.'}`, 'error-msg');
          }
        } catch (e) {
          printToTerminal('Connection error. Failed to delete entry.', 'error-msg');
        }
      } else {
        printToTerminal('Usage: admin login <password> | admin delete <id> | admin logout', 'error-msg');
      }
      break;

    default:
      printToTerminal(`Unknown command: '${primaryCmd}'. Type <span class="highlight">help</span> for usage.`, 'error-msg');
      break;
  }
}

// ------------------------------------------------------------------
// SYSTEM STATS POLLING
// ------------------------------------------------------------------
async function pollSystemStats() {
  try {
    const response = await fetch('/api/system-stats');
    if (response.ok) {
      const data = await response.json();
      
      // Update Texts
      document.getElementById('cpuValue').innerText = `${data.cpu}%`;
      document.getElementById('memValue').innerText = `${data.memory}%`;
      document.getElementById('latencyValue').innerText = `${data.db_latency} ms`;
      
      // Calculate Uptime string
      const hrs = Math.floor(data.uptime / 3600);
      const mins = Math.floor((data.uptime % 3600) / 60);
      const secs = data.uptime % 60;
      let uptimeStr = `${secs}s`;
      if (mins > 0 || hrs > 0) uptimeStr = `${mins}m ${secs}s`;
      if (hrs > 0) uptimeStr = `${hrs}h ${mins}m`;
      document.getElementById('uptimeValue').innerText = uptimeStr;

      // Update progress bars
      document.getElementById('cpuBar').style.width = `${data.cpu}%`;
      document.getElementById('memBar').style.width = `${data.memory}%`;
      // Map latency (0-10ms) to progress width
      const latWidth = Math.min((data.db_latency / 10) * 100, 100);
      document.getElementById('latencyBar').style.width = `${latWidth}%`;
    }
  } catch (e) {
    console.error('Failed to fetch system stats:', e);
  }
}

// ------------------------------------------------------------------
// GUI TAB SWITCHING
// ------------------------------------------------------------------
function switchTab(tabId) {
  // Hide all tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  // Deactivate all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Activate target
  document.getElementById(`tab-${tabId}`).classList.add('active');
  
  // Find button based on function argument
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick').includes(tabId)) {
      btn.classList.add('active');
    }
  });

  // Load contextual dynamic elements
  if (tabId === 'guestbook') {
    loadGuestbookMessages();
  } else if (tabId === 'blog') {
    loadBlogPosts();
  }
}

// ------------------------------------------------------------------
// GUESTBOOK FORM & LOADERS
// ------------------------------------------------------------------
async function loadGuestbookMessages() {
  const container = document.getElementById('messagesList');
  if (!container) return;

  try {
    // Check if current user is logged in as admin to show delete options
    let isAdmin = false;
    try {
      const statusRes = await fetch('/api/admin/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        isAdmin = statusData.is_admin;
      }
    } catch (err) {}

    const response = await fetch('/api/guestbook');
    if (response.ok) {
      const data = await response.json();
      if (data.length === 0) {
        container.innerHTML = '<p class="loading">No messages yet. Be the first to sign!</p>';
        return;
      }
      
      container.innerHTML = '';
      data.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'guestbook-msg';
        
        let deleteBtn = '';
        if (isAdmin) {
          deleteBtn = `<button onclick="deleteEntry(${entry.id})" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer; font-size:0.75rem; margin-left:8px; padding:0;">[Delete]</button>`;
        }

        item.innerHTML = `
          <div class="msg-header">
            <div>
              <span class="msg-author">${entry.name}</span>
              ${deleteBtn}
            </div>
            <span class="msg-date">${entry.created_at}</span>
          </div>
          <div class="msg-text">${entry.message}</div>
        `;
        container.appendChild(item);
      });
    } else {
      container.innerHTML = '<p class="loading">Error loading signatures.</p>';
    }
  } catch (e) {
    container.innerHTML = '<p class="loading">Server offline.</p>';
  }
}

async function deleteEntry(id) {
  if (!confirm(`Are you sure you want to delete guestbook entry #${id}?`)) return;
  try {
    const response = await fetch(`/api/admin/delete/${id}`, { method: 'DELETE' });
    if (response.ok) {
      printToTerminal(`System: Guestbook entry #${id} deleted via GUI request.`);
      loadGuestbookMessages();
    } else {
      const data = await response.json();
      alert(`Error: ${data.error || 'Failed to delete entry.'}`);
    }
  } catch (e) {
    alert('Server communication error.');
  }
}

async function submitGuestbook(event) {
  event.preventDefault();
  const nameInput = document.getElementById('guestName');
  const messageInput = document.getElementById('guestMessage');
  
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  
  if (!name || !message) return;

  try {
    const response = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message })
    });

    if (response.ok) {
      nameInput.value = '';
      messageInput.value = '';
      
      // Print notification in terminal log too!
      printToTerminal(`System: Guestbook signed visually by '${name}'`);
      
      // Reload messages list
      loadGuestbookMessages();
    } else {
      alert('Failed to submit message.');
    }
  } catch (e) {
    alert('Server communication error.');
  }
}

// ------------------------------------------------------------------
// BLOG LOADERS & READER
// ------------------------------------------------------------------
async function loadBlogPosts() {
  const listContainer = document.getElementById('blogList');
  if (!listContainer) return;

  try {
    const response = await fetch('/api/blog');
    if (response.ok) {
      const data = await response.json();
      if (data.length === 0) {
        listContainer.innerHTML = '<p class="loading">No articles found.</p>';
        return;
      }
      
      listContainer.innerHTML = '';
      data.forEach(post => {
        const item = document.createElement('div');
        item.className = 'blog-item';
        item.onclick = () => readBlogPost(post.slug);
        item.innerHTML = `
          <span class="blog-title">${post.title}</span>
          <span class="read-more">Read Article →</span>
        `;
        listContainer.appendChild(item);
      });
    } else {
      listContainer.innerHTML = '<p class="loading">Error loading logs.</p>';
    }
  } catch (e) {
    listContainer.innerHTML = '<p class="loading">Server offline.</p>';
  }
}

async function readBlogPost(slug) {
  const listContainer = document.getElementById('blogList');
  const readerContainer = document.getElementById('blogReader');
  const contentContainer = document.getElementById('blogContent');

  try {
    const response = await fetch(`/api/blog/${slug}`);
    if (response.ok) {
      const data = await response.json();
      contentContainer.innerHTML = `
        <h2 style="margin-bottom:6px;">${data.title}</h2>
        <div style="font-size:0.75rem; color:gray; margin-bottom:16px;">Source File: posts/${slug}.md</div>
        <div>${data.content}</div>
      `;
      listContainer.style.display = 'none';
      readerContainer.style.display = 'block';
      
      printToTerminal(`System: Opening log '${slug}' in GUI reader.`);
    } else {
      alert('Could not retrieve post.');
    }
  } catch (e) {
    alert('Server communication error.');
  }
}

function closeBlogReader() {
  document.getElementById('blogList').style.display = 'flex';
  document.getElementById('blogReader').style.display = 'none';
}
