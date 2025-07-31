document.addEventListener('DOMContentLoaded', async function() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  let allJobs = []; // Store all jobs for filtering

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

  // Function to load available jobs
  async function loadAvailableJobs() {
    const jobsDiv = document.getElementById('availableJobsList');
    try {
      const res = await fetch('/api/v1/jobs', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const jobs = await res.json();
      
      // Filter only active jobs and sort by newest first
      allJobs = jobs.filter(job => job.status === 'active')
                   .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      displayJobs(allJobs);
    } catch (error) {
      jobsDiv.innerHTML = '<p>Error loading jobs.</p>';
    }
  }

  // Function to display jobs with filtering
  function displayJobs(jobs) {
    const jobsDiv = document.getElementById('availableJobsList');
    
    if (jobs.length === 0) {
      jobsDiv.innerHTML = '<p>No jobs available.</p>';
      return;
    }

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
            <button onclick="applyToJob('${job._id}')" style="background: #28a745;">
              Apply Now
            </button>
          </div>
        </div>
        <p>${job.description}</p>
        ${job.requirements && job.requirements.length > 0 ? 
          `<strong>Requirements:</strong> ${job.requirements.join(', ')}` : ''}
      </div>
    `).join('');
  }

  // Function to load applied jobs
  async function loadAppliedJobs() {
    const jobsDiv = document.getElementById('appliedJobsList');
    try {
      const res = await fetch('/api/v1/jobs/applied', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const appliedJobs = await res.json();
      
      if (appliedJobs.length === 0) {
        jobsDiv.innerHTML = '<p>No applied jobs yet.</p>';
        return;
      }

      // Sort by application date (newest first)
      appliedJobs.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

      jobsDiv.innerHTML = appliedJobs.map(job => `
        <div class="applied-job">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <strong>${job.title}</strong> at ${job.company}, ${job.location}<br>
              <span class="job-category">${job.jobCategory}</span>
              <span class="job-position">${job.position}</span><br>
              <small>${job.jobType} | ${job.salary}</small><br>
              <div class="job-date">Applied: ${formatDate(job.appliedAt)}</div>
              <div style="margin-top: 0.5em;">
                <span class="application-status status-${job.status}">${job.status}</span>
              </div>
            </div>
          </div>
          <p>${job.description}</p>
        </div>
      `).join('');
    } catch (error) {
      jobsDiv.innerHTML = '<p>Error loading applied jobs.</p>';
    }
  }

  // Function to filter jobs
  window.filterJobs = function() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const positionFilter = document.getElementById('positionFilter').value;
    
    let filteredJobs = allJobs;
    
    if (categoryFilter) {
      filteredJobs = filteredJobs.filter(job => job.jobCategory === categoryFilter);
    }
    
    if (positionFilter) {
      filteredJobs = filteredJobs.filter(job => job.position === positionFilter);
    }
    
    displayJobs(filteredJobs);
  };

  // Function to clear filters
  window.clearFilters = function() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('positionFilter').value = '';
    displayJobs(allJobs);
  };

  // Function to apply to a job
  window.applyToJob = async function(jobId) {
    // Create application modal
    const modalContainer = document.getElementById('applicationModalContainer');
    modalContainer.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 2em; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
          <h3>Apply for Job</h3>
          <form id="applicationForm">
            <label>Cover Letter: <textarea name="coverLetter" rows="5" placeholder="Tell us why you're interested in this position..."></textarea></label>
            <label>Resume: <input type="file" name="resume" accept=".pdf,.doc,.docx" required></label>
            <div style="margin-top: 1em;">
              <button type="submit" style="background: #28a745;">Submit Application</button>
              <button type="button" onclick="closeApplicationModal()" style="background: #6c757d; margin-left: 1em;">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    modalContainer.style.display = 'block';

    // Handle form submission
    const form = document.getElementById('applicationForm');
    form.onsubmit = async function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      formData.append('coverLetter', formData.get('coverLetter'));

      try {
        const res = await fetch(`/api/v1/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token
          },
          body: formData
        });

        if (res.ok) {
          alert('Application submitted successfully!');
          closeApplicationModal();
          // Refresh the jobs list
          loadAvailableJobs();
          loadAppliedJobs();
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to submit application');
        }
      } catch (error) {
        alert('Error submitting application');
      }
    };
  };

  // Function to close application modal
  window.closeApplicationModal = function() {
    document.getElementById('applicationModalContainer').style.display = 'none';
  };

  // Make functions globally available
  window.loadAvailableJobs = loadAvailableJobs;
  window.loadAppliedJobs = loadAppliedJobs;
  window.showTab = showTab;

  // Initial load of available jobs
  loadAvailableJobs();
}); 