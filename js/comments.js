// AIET IN STEM Comment System
// Uses Supabase for persistent storage

// Supabase client reference
let commentsSupabase = null;

// Initialize comments system with Supabase
async function initCommentsSupabase() {
  if (commentsSupabase) return commentsSupabase;

  // Load Supabase library if not already loaded
  if (typeof supabase === 'undefined') {
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
  }

  const SUPABASE_URL = 'https://uvslysbkatpszsrzbsui.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c2x5c2JrYXRwc3pzcnpic3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNzI3MjAsImV4cCI6MjA3ODc0ODcyMH0.Secuf3CUvw3u7x0dC_b5ZwhVJvtFS_jT68nwv801U2o';

  commentsSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return commentsSupabase;
}

// Load external script
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Get comments for a specific post from Supabase
async function getComments(postId) {
  try {
    const client = await initCommentsSupabase();

    // Get parent comments (no parent_id)
    const { data: comments, error } = await client
      .from('aiet_comments')
      .select('*')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return getCommentsFromLocalStorage(postId);
    }

    // Get replies for each comment
    for (let comment of comments) {
      const { data: replies, error: repliesError } = await client
        .from('aiet_comments')
        .select('*')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      if (!repliesError) {
        comment.replies = replies.map(r => ({
          id: r.id,
          author: r.author_name,
          email: r.author_email,
          role: r.author_role,
          content: r.content,
          timestamp: r.created_at
        }));
      } else {
        comment.replies = [];
      }
    }

    // Transform to match expected format
    return comments.map(c => ({
      id: c.id,
      postId: c.post_id,
      author: c.author_name,
      email: c.author_email,
      role: c.author_role,
      affiliation: c.author_affiliation,
      content: c.content,
      timestamp: c.created_at,
      replies: c.replies || []
    }));
  } catch (e) {
    console.error('Supabase error, falling back to localStorage:', e);
    return getCommentsFromLocalStorage(postId);
  }
}

// Fallback: Get comments from localStorage
function getCommentsFromLocalStorage(postId) {
  const comments = localStorage.getItem(`aiet_comments_${postId}`);
  return comments ? JSON.parse(comments) : [];
}

// Save comments to localStorage (fallback)
function saveCommentsToLocalStorage(postId, comments) {
  localStorage.setItem(`aiet_comments_${postId}`, JSON.stringify(comments));
}

// Add a new comment
async function addComment(postId, content) {
  const user = getCurrentUser();
  if (!user) {
    showToast('Please sign in to comment.');
    openLoginModal();
    return false;
  }

  try {
    const client = await initCommentsSupabase();

    const { data, error } = await client
      .from('aiet_comments')
      .insert({
        post_id: postId,
        author_name: user.name,
        author_email: user.email,
        author_role: user.role,
        author_affiliation: user.affiliation,
        content: content.trim(),
        parent_id: null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return addCommentToLocalStorage(postId, content, user);
    }

    return {
      id: data.id,
      postId: data.post_id,
      author: data.author_name,
      email: data.author_email,
      role: data.author_role,
      affiliation: data.author_affiliation,
      content: data.content,
      timestamp: data.created_at,
      replies: []
    };
  } catch (e) {
    console.error('Supabase error, falling back to localStorage:', e);
    return addCommentToLocalStorage(postId, content, user);
  }
}

// Fallback: Add comment to localStorage
function addCommentToLocalStorage(postId, content, user) {
  const comments = getCommentsFromLocalStorage(postId);
  const newComment = {
    id: Date.now().toString(),
    postId: postId,
    author: user.name,
    email: user.email,
    role: user.role,
    affiliation: user.affiliation,
    content: content.trim(),
    timestamp: new Date().toISOString(),
    replies: []
  };

  comments.push(newComment);
  saveCommentsToLocalStorage(postId, comments);
  return newComment;
}

// Add a reply to a comment
async function addReply(postId, commentId, content) {
  const user = getCurrentUser();
  if (!user) {
    showToast('Please sign in to reply.');
    openLoginModal();
    return false;
  }

  try {
    const client = await initCommentsSupabase();

    const { data, error } = await client
      .from('aiet_comments')
      .insert({
        post_id: postId,
        author_name: user.name,
        author_email: user.email,
        author_role: user.role,
        author_affiliation: user.affiliation,
        content: content.trim(),
        parent_id: commentId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding reply:', error);
      return addReplyToLocalStorage(postId, commentId, content, user);
    }

    return {
      id: data.id,
      author: data.author_name,
      email: data.author_email,
      role: data.author_role,
      content: data.content,
      timestamp: data.created_at
    };
  } catch (e) {
    console.error('Supabase error, falling back to localStorage:', e);
    return addReplyToLocalStorage(postId, commentId, content, user);
  }
}

// Fallback: Add reply to localStorage
function addReplyToLocalStorage(postId, commentId, content, user) {
  const comments = getCommentsFromLocalStorage(postId);
  const comment = comments.find(c => c.id === commentId);

  if (comment) {
    const reply = {
      id: Date.now().toString(),
      author: user.name,
      email: user.email,
      role: user.role,
      content: content.trim(),
      timestamp: new Date().toISOString()
    };
    comment.replies.push(reply);
    saveCommentsToLocalStorage(postId, comments);
    return reply;
  }
  return false;
}

// Delete a comment (only by author)
async function deleteComment(postId, commentId) {
  const user = getCurrentUser();
  if (!user) return false;

  try {
    const client = await initCommentsSupabase();

    // First verify the user owns this comment
    const { data: comment, error: fetchError } = await client
      .from('aiet_comments')
      .select('author_email')
      .eq('id', commentId)
      .single();

    if (fetchError || comment.author_email !== user.email) {
      return false;
    }

    // Delete any replies first
    await client
      .from('aiet_comments')
      .delete()
      .eq('parent_id', commentId);

    // Delete the comment
    const { error } = await client
      .from('aiet_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return deleteCommentFromLocalStorage(postId, commentId, user.email);
    }

    return true;
  } catch (e) {
    console.error('Supabase error, falling back to localStorage:', e);
    return deleteCommentFromLocalStorage(postId, commentId, user.email);
  }
}

// Fallback: Delete comment from localStorage
function deleteCommentFromLocalStorage(postId, commentId, userEmail) {
  const comments = getCommentsFromLocalStorage(postId);
  const index = comments.findIndex(c => c.id === commentId && c.email === userEmail);

  if (index > -1) {
    comments.splice(index, 1);
    saveCommentsToLocalStorage(postId, comments);
    return true;
  }
  return false;
}

// Format timestamp
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;

  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return mins <= 1 ? 'Just now' : `${mins} minutes ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }

  // Show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get role badge color
function getRoleBadgeClass(role) {
  switch (role) {
    case 'Co-Organizer': return 'role-organizer';
    case 'Steering Board': return 'role-steering';
    case 'Speaker': return 'role-speaker';
    default: return 'role-member';
  }
}

// Render comments section
async function renderComments(postId) {
  const container = document.getElementById('comments-section');
  if (!container) return;

  // Show loading state
  container.innerHTML = '<div class="comments-loading">Loading comments...</div>';

  const comments = await getComments(postId);
  const user = getCurrentUser();

  let html = `
    <div class="comments-header">
      <h3>Discussion (${comments.length})</h3>
    </div>
  `;

  // Comments list FIRST (above the form)
  html += '<div class="comments-list">';

  if (comments.length === 0) {
    html += `
      <div class="no-comments">
        <p>No comments yet. Be the first to start the discussion!</p>
      </div>
    `;
  } else {
    comments.forEach(comment => {
      html += renderSingleComment(comment, postId, user);
    });
  }

  html += '</div>';

  // Comment form LAST (always at bottom)
  if (user) {
    html += `
      <div class="comment-form">
        <div class="comment-form-header">
          <span class="comment-avatar">${getInitials(user.name)}</span>
          <span class="comment-form-user">${user.name}</span>
        </div>
        <textarea id="new-comment-input" placeholder="Share your thoughts or questions..." rows="2"></textarea>
        <div class="comment-form-actions">
          <button onclick="submitComment('${postId}')" class="comment-submit-btn">Post Comment</button>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="comment-login-prompt">
        <p>Sign in to join the discussion</p>
        <button onclick="openLoginModal()" class="auth-login-btn">Sign In</button>
      </div>
    `;
  }

  container.innerHTML = html;
}

// Render a single comment
function renderSingleComment(comment, postId, currentUser) {
  const isAuthor = currentUser && currentUser.email === comment.email;

  let html = `
    <div class="comment-item" id="comment-${comment.id}">
      <div class="comment-header">
        <span class="comment-avatar">${getInitials(comment.author)}</span>
        <div class="comment-meta">
          <span class="comment-author">${comment.author}</span>
          <span class="comment-role ${getRoleBadgeClass(comment.role)}">${comment.role}</span>
          <span class="comment-time">${formatTimestamp(comment.timestamp)}</span>
        </div>
        ${isAuthor ? `<button class="comment-delete-btn" onclick="handleDeleteComment('${postId}', '${comment.id}')" title="Delete">&times;</button>` : ''}
      </div>
      <div class="comment-content">
        <p>${escapeHtml(comment.content)}</p>
      </div>
      <div class="comment-actions">
        <button class="comment-reply-btn" onclick="toggleReplyForm('${comment.id}')">Reply</button>
      </div>
  `;

  // Reply form (hidden by default)
  if (currentUser) {
    html += `
      <div class="reply-form" id="reply-form-${comment.id}" style="display: none;">
        <textarea id="reply-input-${comment.id}" placeholder="Write a reply..." rows="2"></textarea>
        <div class="reply-form-actions">
          <button onclick="submitReply('${postId}', '${comment.id}')" class="reply-submit-btn">Reply</button>
          <button onclick="toggleReplyForm('${comment.id}')" class="reply-cancel-btn">Cancel</button>
        </div>
      </div>
    `;
  }

  // Replies
  if (comment.replies && comment.replies.length > 0) {
    html += '<div class="comment-replies">';
    comment.replies.forEach(reply => {
      html += `
        <div class="reply-item">
          <div class="comment-header">
            <span class="comment-avatar small">${getInitials(reply.author)}</span>
            <div class="comment-meta">
              <span class="comment-author">${reply.author}</span>
              <span class="comment-role ${getRoleBadgeClass(reply.role)}">${reply.role}</span>
              <span class="comment-time">${formatTimestamp(reply.timestamp)}</span>
            </div>
          </div>
          <div class="comment-content">
            <p>${escapeHtml(reply.content)}</p>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// Toggle reply form
function toggleReplyForm(commentId) {
  const form = document.getElementById(`reply-form-${commentId}`);
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
      form.querySelector('textarea').focus();
    }
  }
}

// Submit new comment
async function submitComment(postId) {
  const input = document.getElementById('new-comment-input');
  const content = input.value.trim();

  if (!content) {
    showToast('Please write something before posting.');
    return;
  }

  // Disable button while submitting
  const btn = document.querySelector('.comment-submit-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Posting...';
  }

  const result = await addComment(postId, content);
  if (result) {
    await renderComments(postId);
    showToast('Comment posted successfully!');
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Post Comment';
  }
}

// Submit reply
async function submitReply(postId, commentId) {
  const input = document.getElementById(`reply-input-${commentId}`);
  const content = input.value.trim();

  if (!content) {
    showToast('Please write something before replying.');
    return;
  }

  const result = await addReply(postId, commentId, content);
  if (result) {
    await renderComments(postId);
    showToast('Reply posted!');
  }
}

// Delete comment
async function handleDeleteComment(postId, commentId) {
  if (confirm('Are you sure you want to delete this comment?')) {
    if (await deleteComment(postId, commentId)) {
      await renderComments(postId);
      showToast('Comment deleted.');
    }
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}

// Initialize comments on page load
function initComments() {
  const container = document.getElementById('comments-section');
  if (container) {
    const postId = container.dataset.postId;
    if (postId) {
      renderComments(postId);
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initComments);
