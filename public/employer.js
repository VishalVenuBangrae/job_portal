document.addEventListener('DOMContentLoaded', async function() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Job posting form functionality
  const postJobForm = document.getElementById('postJobForm');
  if (postJobForm) {
    postJobForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const jobData = {
        title: formData.get('title'),
        company: formData.get('company'),
        location: formData.get('location'),
        jobCategory: formData.get('jobCategory'),
        position: formData.get('position'),
        description: formData.get('description'),
        requirements: formData.get('requirements').split(',').map(req => req.trim()).filter(req => req),
        salary: formData.get('salary'),
        jobType: formData.get('jobType')
      };

      try {
        const res = await fetch('/api/v1/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(jobData)
        });

        if (res.ok) {
          alert('Job posted successfully!');
          this.reset();
          // Switch to manage jobs tab and refresh
          showTab('manage-jobs');
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to post job');
        }
      } catch (error) {
        alert('Error posting job');
      }
    });
  }

  // Function to format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Function to load posted jobs
  async function loadPostedJobs() {
    const jobsDiv = document.getElementById('postedJobsList');
    try {
      const res = await fetch('/api/v1/jobs/posted', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const jobs = await res.json();
      
      if (jobs.length === 0) {
        jobsDiv.innerHTML = '<p>No jobs posted yet.</p>';
        return;
      }

      // Sort jobs by newest first
      jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      jobsDiv.innerHTML = jobs.map(job => `
        <div class="job">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <strong>${job.title}</strong> at ${job.company}, ${job.location}<br>
              <span class="job-category">${job.jobCategory}</span>
              <span class="job-position">${job.position}</span><br>
              <small>${job.jobType} | ${job.salary}</small><br>
              <div class="job-date">Posted: ${formatDate(job.createdAt)}</div>
            </div>
            <div>
              <button onclick="toggleJobStatus('${job._id}', '${job.status}')" style="background: ${job.status === 'active' ? '#dc3545' : '#28a745'};">
                ${job.status === 'active' ? 'Close Job' : 'Reopen Job'}
              </button>
            </div>
          </div>
          <p>${job.description}</p>
          <button onclick="viewJobApplications('${job._id}')" style="background: #17a2b8;">
            View Applications (${job.applications ? job.applications.length : 0})
          </button>
          <div id="applications-${job._id}" class="applications hidden"></div>
        </div>
      `).join('');
    } catch (error) {
      jobsDiv.innerHTML = '<p>Error loading jobs.</p>';
    }
  }

  // Function to load all applications
  async function loadAllApplications() {
    const applicationsDiv = document.getElementById('allApplicationsList');
    try {
      const res = await fetch('/api/v1/jobs/posted', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const jobs = await res.json();
      
      if (jobs.length === 0) {
        applicationsDiv.innerHTML = '<p>No jobs posted yet.</p>';
        return;
      }

      let allApplications = [];
      
      // Collect all applications from all jobs
      for (const job of jobs) {
        if (job.applications && job.applications.length > 0) {
          job.applications.forEach(app => {
            app.jobTitle = job.title;
            app.jobCompany = job.company;
            app.jobCategory = job.jobCategory;
            app.jobPosition = job.position;
            allApplications.push(app);
          });
        }
      }

      if (allApplications.length === 0) {
        applicationsDiv.innerHTML = '<p>No applications received yet.</p>';
        return;
      }

      // Sort applications by newest first
      allApplications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

      applicationsDiv.innerHTML = allApplications.map(app => `
        <div class="application">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <strong>${app.applicant?.name || 'Unknown'}</strong><br>
              <strong>Job:</strong> ${app.jobTitle} at ${app.jobCompany}<br>
              <span class="job-category">${app.jobCategory}</span>
              <span class="job-position">${app.jobPosition}</span><br>
              <b>Email:</b> ${app.email || app.applicant?.email || ''}<br>
              <b>Phone:</b> ${app.phone || app.applicant?.phone || ''}<br>
              <b>Applied:</b> ${formatDate(app.appliedAt)}<br>
              <span class="application-status status-${app.status}">${app.status}</span>
            </div>
            <div>
              <select onchange="updateApplicationStatus('${app._id}', this.value)">
                <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="reviewed" ${app.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                <option value="accepted" ${app.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
              </select>
            </div>
          </div>
          ${app.resume ? `<b>Resume:</b> <a href="/uploads/${app.resume.filename}" target="_blank" download="${app.resume.originalName || 'resume'}">Download Resume (${app.resume.originalName || 'resume'})</a><br>` : ''}
          ${app.coverLetter ? `<b>Cover Letter:</b> <pre style="white-space:pre-wrap;background:#f4f4f4;padding:0.5em;border-radius:4px;">${app.coverLetter}</pre>` : ''}
        </div>
      `).join('');
    } catch (error) {
      applicationsDiv.innerHTML = '<p>Error loading applications.</p>';
    }
  }

  // Make functions globally available
  window.loadPostedJobs = loadPostedJobs;
  window.loadAllApplications = loadAllApplications;
  window.showTab = showTab;

  // Function to view job applications
  window.viewJobApplications = async function(jobId) {
    const appDiv = document.getElementById(`applications-${jobId}`);
    if (!appDiv.classList.contains('hidden')) {
      appDiv.classList.add('hidden');
      appDiv.innerHTML = '';
      return;
    }
    
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/applications`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const apps = await res.json();
      
      if (!Array.isArray(apps) || apps.length === 0) {
        appDiv.innerHTML = '<em>No applications yet.</em>';
      } else {
        appDiv.innerHTML = apps.map(app => `
          <div class="application">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong>${app.applicant?.name || 'Unknown'}</strong><br>
                <b>Email:</b> ${app.email || app.applicant?.email || ''}<br>
                <b>Phone:</b> ${app.phone || app.applicant?.phone || ''}<br>
                <b>Applied:</b> ${formatDate(app.appliedAt)}<br>
                <span class="application-status status-${app.status}">${app.status}</span>
              </div>
              <div>
                <select onchange="updateApplicationStatus('${app._id}', this.value)">
                  <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="reviewed" ${app.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                  <option value="accepted" ${app.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                  <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
              </div>
            </div>
            ${app.resume ? `<b>Resume:</b> <a href="/uploads/${app.resume.filename}" target="_blank" download="${app.resume.originalName || 'resume'}">Download Resume (${app.resume.originalName || 'resume'})</a><br>` : ''}
            ${app.coverLetter ? `<b>Cover Letter:</b> <pre style="white-space:pre-wrap;background:#f4f4f4;padding:0.5em;border-radius:4px;">${app.coverLetter}</pre>` : ''}
          </div>
        `).join('');
      }
      appDiv.classList.remove('hidden');
    } catch (error) {
      appDiv.innerHTML = '<em>Error loading applications.</em>';
    }
  };

  // Function to update application status
  window.updateApplicationStatus = async function(applicationId, status) {
    try {
      const res = await fetch(`/api/v1/jobs/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        // Refresh the applications view
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab.textContent.includes('Applications')) {
          loadAllApplications();
        }
      } else {
        alert('Failed to update application status');
      }
    } catch (error) {
      alert('Error updating application status');
    }
  };

  // Function to toggle job status
  window.toggleJobStatus = async function(jobId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        loadPostedJobs(); // Refresh the job list
      } else {
        alert('Failed to update job status');
      }
    } catch (error) {
      alert('Error updating job status');
    }
  };

  // Initial load of posted jobs
  loadPostedJobs();
}); 