document.addEventListener('DOMContentLoaded', async function() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  // Fetch available jobs
  const jobsRes = await fetch('/api/v1/jobs');
  const jobs = await jobsRes.json();
  const jobsDiv = document.querySelector('.jobs');
  jobsDiv.innerHTML = '<h2>Available Jobs</h2>' + jobs.map(job => `
    <div class="job">
      <strong>${job.title}</strong> at ${job.company}, ${job.location}<br>
      <small>${job.jobType} | ${job.salary}</small>
      <p>${job.description}</p>
      <button class="apply-btn" data-jobid="${job._id}">Apply</button>
    </div>
  `).join('');
  // Apply button logic
  document.querySelectorAll('.apply-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const jobId = this.dataset.jobid;
      const res = await fetch(`/api/v1/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        alert('Applied successfully!');
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to apply');
      }
    });
  });
  // Fetch applied jobs
  const appliedRes = await fetch('/api/v1/jobs/applied', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const appliedJobs = await appliedRes.json();
  const appliedDiv = document.querySelector('.applied');
  appliedDiv.innerHTML = '<h2>Applied Jobs</h2>' + appliedJobs.map(job => `
    <div class="applied-job">
      <strong>${job.title}</strong> at ${job.company}, ${job.location}<br>
      <small>Application Status: Pending</small>
    </div>
  `).join('');
}); 