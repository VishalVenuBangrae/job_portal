document.addEventListener('DOMContentLoaded', async function() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  const jobsDiv = document.querySelector('.jobs');
  // Fetch posted jobs
  const res = await fetch('/api/v1/jobs/posted', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const jobs = await res.json();
  jobsDiv.innerHTML = '<h2>Your Posted Jobs</h2>' + jobs.map(job => `
    <div class="job">
      <strong>${job.title}</strong> at ${job.company}, ${job.location}<br>
      <small>${job.jobType} | ${job.salary}</small>
      <p>${job.description}</p>
      <button class="view-applications" data-jobid="${job._id}">View Applications</button>
      <div class="applications hidden"></div>
    </div>
  `).join('');

  // Add event listeners for view applications
  document.querySelectorAll('.view-applications').forEach(btn => {
    btn.addEventListener('click', async function() {
      const jobId = this.dataset.jobid;
      const appDiv = this.nextElementSibling;
      if (!appDiv.classList.contains('hidden')) {
        appDiv.classList.add('hidden');
        appDiv.innerHTML = '';
        return;
      }
      // Fetch applications
      const res = await fetch(`/api/v1/jobs/${jobId}/applications`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const apps = await res.json();
      if (!Array.isArray(apps) || apps.length === 0) {
        appDiv.innerHTML = '<em>No applications yet.</em>';
      } else {
        appDiv.innerHTML = apps.map(app => `
          <div class="application">
            <strong>${app.applicant?.name || 'Unknown'}</strong> (${app.applicant?.email || ''})<br>
            <a href="/api/v1/users/${app.applicant?._id}/resume" target="_blank">Download Resume</a>
            <div>Status: ${app.status}</div>
          </div>
        `).join('');
      }
      appDiv.classList.remove('hidden');
    });
  });
}); 