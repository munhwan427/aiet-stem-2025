// AIET IN STEM Submission System
// Uses Supabase for persistent storage

// Supabase client reference
let submissionsSupabase = null;

// Admin email (can view all submissions)
const ADMIN_EMAIL = 'ahn@anarchy.io';

// Initialize submissions system with Supabase
async function initSubmissionsSupabase() {
  if (submissionsSupabase) return submissionsSupabase;

  // Load Supabase library if not already loaded
  if (typeof supabase === 'undefined') {
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
  }

  const SUPABASE_URL = 'https://uvslysbkatpszsrzbsui.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c2x5c2JrYXRwc3pzcnpic3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNzI3MjAsImV4cCI6MjA3ODc0ODcyMH0.Secuf3CUvw3u7x0dC_b5ZwhVJvtFS_jT68nwv801U2o';

  submissionsSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return submissionsSupabase;
}

// Load external script (if not already defined)
if (typeof loadScript === 'undefined') {
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
}

// Check if user is admin
function isAdmin() {
  const user = getCurrentUser();
  return user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Upload file to Supabase Storage
async function uploadAttachment(file, submissionId) {
  if (!file) return null;

  try {
    const client = await initSubmissionsSupabase();

    // Create unique filename
    const ext = file.name.split('.').pop();
    const fileName = `${submissionId}_${Date.now()}.${ext}`;
    const filePath = `submissions/${fileName}`;

    const { data, error } = await client.storage
      .from('aiet-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from('aiet-attachments')
      .getPublicUrl(filePath);

    return {
      name: file.name,
      path: filePath,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type
    };
  } catch (e) {
    console.error('Upload error:', e);
    return null;
  }
}

// Delete attachment from storage
async function deleteAttachment(filePath) {
  if (!filePath) return;

  try {
    const client = await initSubmissionsSupabase();
    await client.storage.from('aiet-attachments').remove([filePath]);
  } catch (e) {
    console.error('Delete attachment error:', e);
  }
}

// Submit new content
async function handleSubmission(event) {
  event.preventDefault();

  const user = getCurrentUser();
  if (!user) {
    showToast('Please sign in to submit content.');
    openLoginModal();
    return false;
  }

  const type = document.getElementById('submit-type').value;
  const title = document.getElementById('submit-title').value.trim();
  const content = document.getElementById('submit-content').value.trim();
  const tags = document.getElementById('submit-tags').value.trim();

  // Get file if selected (from global variable set by handleFileSelect)
  const fileInput = document.getElementById('submit-attachment');
  const file = fileInput && fileInput.files[0] ? fileInput.files[0] : (typeof selectedFile !== 'undefined' ? selectedFile : null);

  const errorEl = document.getElementById('submit-error');
  const successEl = document.getElementById('submit-success');
  const submitBtn = document.getElementById('submit-btn');

  // Clear previous messages
  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  if (!type || !title || !content) {
    errorEl.textContent = 'Please fill in all required fields.';
    errorEl.style.display = 'block';
    return false;
  }

  // Disable button while submitting
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

  try {
    const client = await initSubmissionsSupabase();

    // First create the submission record
    const { data, error } = await client
      .from('aiet_submissions')
      .insert({
        type: type,
        title: title,
        content: content,
        tags: tags,
        author_name: user.name,
        author_email: user.email,
        author_affiliation: user.affiliation,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      errorEl.textContent = 'Failed to submit. Please try again.';
      errorEl.style.display = 'block';
    } else {
      // Upload attachment if present
      if (file) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading file...';
        const attachment = await uploadAttachment(file, data.id);

        if (attachment) {
          // Update submission with attachment info
          await client
            .from('aiet_submissions')
            .update({
              attachment_name: attachment.name,
              attachment_url: attachment.url,
              attachment_path: attachment.path
            })
            .eq('id', data.id);
        }
      }

      // Success - show message and redirect to home
      showToast('Submission received! Pending review.');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
      return;
    }
  } catch (e) {
    console.error('Submission error:', e);
    errorEl.textContent = 'An error occurred. Please try again later.';
    errorEl.style.display = 'block';
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit for Review';
}

// Get all submissions (admin only)
async function getAllSubmissions(status = null) {
  if (!isAdmin()) {
    console.error('Unauthorized: Admin access required');
    return [];
  }

  try {
    const client = await initSubmissionsSupabase();

    let query = client
      .from('aiet_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Supabase error:', e);
    return [];
  }
}

// Get user's own submissions
async function getMySubmissions() {
  const user = getCurrentUser();
  if (!user) return [];

  try {
    const client = await initSubmissionsSupabase();

    const { data, error } = await client
      .from('aiet_submissions')
      .select('*')
      .eq('author_email', user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Supabase error:', e);
    return [];
  }
}

// Get approved submissions for member board
async function getApprovedSubmissions(type = null) {
  try {
    const client = await initSubmissionsSupabase();

    let query = client
      .from('aiet_submissions')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Supabase error:', e);
    return [];
  }
}

// Update submission status (admin only)
async function updateSubmissionStatus(submissionId, newStatus) {
  if (!isAdmin()) {
    console.error('Unauthorized: Admin access required');
    return false;
  }

  try {
    const client = await initSubmissionsSupabase();

    const { error } = await client
      .from('aiet_submissions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Error updating submission:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Supabase error:', e);
    return false;
  }
}

// Delete submission (admin only or own submission)
async function deleteSubmission(submissionId) {
  const user = getCurrentUser();
  if (!user) return false;

  try {
    const client = await initSubmissionsSupabase();

    // Check ownership or admin status
    if (!isAdmin()) {
      const { data: submission } = await client
        .from('aiet_submissions')
        .select('author_email')
        .eq('id', submissionId)
        .single();

      if (!submission || submission.author_email !== user.email) {
        console.error('Unauthorized: Cannot delete this submission');
        return false;
      }
    }

    const { error } = await client
      .from('aiet_submissions')
      .delete()
      .eq('id', submissionId);

    if (error) {
      console.error('Error deleting submission:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Supabase error:', e);
    return false;
  }
}

// Format submission type for display
function formatSubmissionType(type) {
  switch (type) {
    case 'essay': return 'Essay';
    case 'research': return 'Research Note';
    case 'discussion': return 'Discussion';
    default: return type;
  }
}

// Get type badge class
function getTypeBadgeClass(type) {
  switch (type) {
    case 'essay': return 'type-essay';
    case 'research': return 'type-research';
    case 'discussion': return 'type-discussion';
    default: return '';
  }
}

// Get status badge class
function getStatusBadgeClass(status) {
  switch (status) {
    case 'pending': return 'status-pending';
    case 'approved': return 'status-approved';
    case 'rejected': return 'status-rejected';
    default: return '';
  }
}

// Format date for display
function formatSubmissionDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
