const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paths = {
  home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
  jobs: '<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6V3h8v3M3 12h18M10 12v3h4v-3"/>',
  profile:
    '<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
  applications:
    '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  settings:
    '<path d="M3 7h18M3 17h18"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  pin: '<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 0 1 14 0Z"/><circle cx="12" cy="9" r="2"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  shield:
    '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  logout: '<path d="M9 4H4v16h5M10 12h11m-5-5 5 5-5 5"/>',
  bell: '<path d="M5 17h14l-2-4V8a5 5 0 0 0-10 0v5ZM10 21h4"/>',
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[n] || paths.jobs}</svg>`;
const brand = `<a class="brand" href="/"><img src="/images/nca-logo.png" alt=""><div><strong>NAUTI CREW</strong><small>Agency · Daywork</small></div></a>`;
const page = location.pathname.split("/").pop() || "index.html";
let me,
  options = { positions: [], tags: {} },
  jobs = [];
async function api(path, config = {}) {
  const headers = { ...config.headers };
  if (localStorage.token)
    headers.Authorization = `Bearer ${localStorage.token}`;
  if (config.body && !(config.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }
  const r = await fetch(`/api/v1${path}`, { ...config, headers });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && !path.startsWith("/auth/login")) {
      localStorage.removeItem("token");
      location.href = "/login.html";
    }
    throw new Error(
      data.message ||
        data.error ||
        "Unable to complete this request. Please try again.",
    );
  }
  return data;
}
function toast(message) {
  $(".toast")?.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.role = "status";
  t.textContent = message;
  document.body.append(t);
  setTimeout(() => t.remove(), 4500);
}
function error(message, root = $("#message")) {
  if (root) {
    root.className = "alert error";
    root.textContent = message;
    root.scrollIntoView({ block: "nearest" });
  } else toast(message);
}
function busy(form, on) {
  form
    .querySelectorAll("button[type=submit]")
    .forEach((b) => (b.disabled = on));
}
function bindForm(selector, fn) {
  const form = $(selector);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    busy(form, true);
    $("#message")?.replaceChildren();
    try {
      await fn(form);
    } catch (e) {
      error(e.message);
    } finally {
      busy(form, false);
    }
  });
}
function date(v) {
  if (!v) return "Dates to be confirmed";
  return new Date(String(v).slice(0, 10) + "T12:00:00").toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );
}
const range = (j) => `${date(j.startDate)} – ${date(j.endDate)}`;
const badge = (s) => `<span class="badge ${esc(s)}">${esc(s)}</span>`;
function empty(title, text, href, label) {
  return `<div class="empty">${icon("jobs")}<h3>${esc(title)}</h3><p>${esc(text)}</p>${href ? `<a class="btn primary" href="${href}">${label}</a>` : ""}</div>`;
}
function field(name, label, type = "text", value = "", extra = "") {
  return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
}
function select(name, label, values, current = "", extra = "") {
  return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}" ${extra}><option value="">Select ${label.toLowerCase().replace(" *", "")}</option>${values
    .map((v) => {
      const [k, l] = Array.isArray(v) ? v : [v, v];
      return `<option value="${esc(k)}" ${String(k) === String(current) ? "selected" : ""}>${esc(l)}</option>`;
    })
    .join("")}</select></div>`;
}
function checks(name, label, values, selected = []) {
  return `<fieldset><legend>${label}</legend><div class="checks">${values
    .map((v) => {
      const [k, l] = Array.isArray(v) ? v : [v, v];
      return `<label class="check"><input type="checkbox" name="${name}" value="${esc(k)}" ${selected.map(String).includes(String(k)) ? "checked" : ""}>${esc(l)}</label>`;
    })
    .join("")}</div></fieldset>`;
}
const values = (f, n) => new FormData(f).getAll(n);
function header() {
  return `<header class="site-header">${brand}<nav><a href="/pricing.html">For employers</a><a href="/login.html">Sign in</a><a class="btn primary" href="/signup.html">Get started ${icon("arrow")}</a></nav></header>`;
}
function footer() {
  return `<footer class="site-footer"><span>© ${new Date().getFullYear()} Nauti Crew Agency</span><div class="actions"><a href="/terms.html?role=jobseeker">Crew terms</a><a href="/terms.html?role=employer">Employer terms</a><a href="/privacy.html">Privacy</a></div></footer>`;
}
function heading(title, subtitle, action = "") {
  return `<div class="page-heading"><div><div class="eyebrow">Daywork by NCA</div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div><div id="message" role="alert"></div>`;
}
function shell(content) {
  const employer = me.userType === "employer";
  const nav = employer
    ? [
        ["employer.html", "Overview", "home"],
        ["post-job.html", "Post a job", "plus"],
        ["manage-jobs.html", "My jobs & matches", "jobs"],
        ["employer-applications.html", "Applications", "applications"],
      ]
    : [
        ["jobseeker.html", "Overview", "home"],
        ["jobseeker-jobs.html", "Find daywork", "jobs"],
        ["jobseeker-applications.html", "My applications", "applications"],
        ["crew-profile.html", "My profile", "profile"],
      ];
  const title =
    nav.find((n) => n[0] === page)?.[1] ||
    {
      "matches.html": "Matched crew",
      "change-password.html": "Account settings",
      "report-issue.html": "Support",
    }[page] ||
    "Daywork";
  document.body.innerHTML = `<a href="#main" class="skip">Skip to content</a><div class="shell"><aside class="sidebar">${brand}<div class="nav-label">${employer ? "Vessel workspace" : "Crew workspace"}</div><nav class="nav-links" aria-label="Main navigation">${nav.map(([url, label, i]) => `<a href="/${url}" class="${page === url ? "active" : ""}" ${page === url ? 'aria-current="page"' : ""}>${icon(i)}${label}</a>`).join("")}</nav><div class="sidebar-footer"><div class="sidebar-note">${icon("shield")}<strong>${employer ? "Your vessel. Your privacy." : "Your next day starts here."}</strong>${employer ? "Vessel identity stays private on the crew job board." : "Keep your availability current to appear in relevant matches."}</div><nav class="nav-links"><a href="/report-issue.html">${icon("help")}Help & report an issue</a><a href="/change-password.html">${icon("settings")}Account settings</a></nav><button id="logout">${icon("logout")}Sign out</button></div></aside><div class="workspace"><header class="topbar"><button class="mobile-menu" aria-label="Open navigation" aria-expanded="false">${icon("menu")}</button><span class="breadcrumb">${employer ? "Employer" : "Crew"} workspace <span aria-hidden="true"> / </span> <strong>${title}</strong></span><div class="user-block"><small>${employer ? esc(me.vessel?.name || "Complete vessel details") : esc(me.name)}</small><span class="avatar">${esc(me.name?.[0] || "N")}</span></div></header><main id="main" class="content">${content}</main></div></div>`;
  $("#logout").onclick = () => {
    localStorage.clear();
    location.href = "/login.html";
  };
  $(".mobile-menu").onclick = () => {
    const open = $(".sidebar").classList.toggle("is-open");
    $(".mobile-menu").setAttribute("aria-expanded", open);
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $(".sidebar")?.classList.remove("is-open");
  });
  document.addEventListener("click", (e) => {
    if (
      $(".sidebar")?.classList.contains("is-open") &&
      !e.target.closest(".sidebar,.mobile-menu")
    )
      $(".sidebar").classList.remove("is-open");
  });
}
function landing() {
  document.body.className = "landing";
  document.body.innerHTML = `${header()}<main><section class="landing-hero"><div><div class="eyebrow">Yacht daywork, thoughtfully connected</div><h1>The right crew.<br>The right place.<br>A great day’s work.</h1><p>Short-term yacht work starts with the right connection. Find available crew or your next opportunity with Nauti Crew Agency.</p><div class="actions"><a class="btn primary" href="/signup.html?role=jobseeker">Find daywork ${icon("arrow")}</a><a class="btn" href="/signup.html?role=employer">I’m hiring crew</a></div><small>Free for crew. Built around real availability.</small></div><aside class="hero-aside"><div class="eyebrow">A better way to get on board</div><h2>Less searching.<br>More certainty.</h2><p>From a washdown to a busy charter turnaround, bring the right people together.</p><div class="hero-step"><span>01</span><div><strong>Start with the details</strong><small>Position, port, skills and dates.</small></div></div><div class="hero-step"><span>02</span><div><strong>Find a relevant match</strong><small>Crew profiles built around availability.</small></div></div><div class="hero-step"><span>03</span><div><strong>Connect with confidence</strong><small>Controlled contact access. Private vessel details.</small></div></div></aside></section><div class="landing-strip"><span>Deck & exterior</span><span>Interior & service</span><span>Galley</span><span>Engineering</span></div><section class="landing-section"><div class="eyebrow">One platform. Two clear paths.</div><h2>Made for the way yachts work.</h2><div class="grid"><article class="panel"><h3>For crew, opportunity starts with you.</h3><p>Keep your experience, documents and available dates in one place. Browse daywork and hear from hiring parties looking for your skills.</p><a href="/signup.html?role=jobseeker">Create your free crew profile →</a></article><article class="panel"><h3>For employers, the details make the match.</h3><p>Post what you need, review crew who fit, and unlock approved contact details for a focused shortlist tied to your job.</p><a href="/pricing.html">Explore vessel access →</a></article></div></section></main>${footer()}`;
}
function authLayout(title, subtitle, form) {
  document.body.innerHTML = `<div class="auth-page"><aside class="auth-aside">${brand}<div class="eyebrow">Daywork by NCA</div><h2>Your next connection starts here.</h2><p>A dedicated space for yacht crew and the people who hire them. Built around location, availability and trust.</p><div class="auth-foot">Nauti Crew Agency · A personal approach to daywork</div></aside><main class="auth-main"><div class="auth-form"><h1>${title}</h1><p>${subtitle}</p><div id="message" role="alert"></div>${form}</div></main></div>`;
}
function storeUser(data) {
  localStorage.token = data.token;
  localStorage.userType = data.userType;
  localStorage.name = data.name;
  location.href =
    data.userType === "employer"
      ? "/employer.html"
      : data.profileComplete
        ? "/jobseeker.html"
        : "/crew-profile.html";
}
function auth() {
  if (page === "login.html") {
    authLayout(
      "Welcome back",
      "Sign in to your NCA Daywork account.",
      `<form id="auth">${field("email", "Email address", "email", "", 'required autocomplete="email"')}${field("password", "Password", "password", "", 'required autocomplete="current-password"')}<div style="text-align:right"><a class="small" href="/forgot-password.html">Forgot password?</a></div><button type="submit" class="btn primary">Sign in ${icon("arrow")}</button></form><p class="auth-links">New to NCA Daywork? <a href="/signup.html">Create an account</a></p>`,
    );
    bindForm("#auth", async (f) => {
      try {
        storeUser(
          await api("/auth/login", {
            method: "POST",
            body: Object.fromEntries(new FormData(f)),
          }),
        );
      } catch (e) {
        if (e.message.includes("verify your email")) {
          localStorage.pendingVerifyEmail = f.email.value;
          location.href = "/verify-email.html";
        } else throw e;
      }
    });
  } else if (page === "signup.html") {
    const role =
      new URLSearchParams(location.search).get("role") === "employer"
        ? "employer"
        : "jobseeker";
    authLayout(
      "Find your place on board",
      "Create your account. We’ll verify your email before you continue.",
      `<form id="auth"><div class="checks"><label class="check"><input type="radio" name="userType" value="jobseeker" ${role === "jobseeker" ? "checked" : ""}>I’m crew</label><label class="check"><input type="radio" name="userType" value="employer" ${role === "employer" ? "checked" : ""}>I’m hiring</label></div><div class="form-grid">${field("firstName", "First name", "text", "", 'required autocomplete="given-name"')}${field("lastName", "Last name", "text", "", 'required autocomplete="family-name"')}</div>${field("email", "Email address", "email", "", 'required autocomplete="email"')}${field("phone", "Phone number", "tel", "", 'required autocomplete="tel"')}${field("password", "Password", "password", "", 'required minlength="8" autocomplete="new-password"')}<small>Use at least 8 characters.</small><div id="vessel-fields" class="panel" style="margin-top:20px">${field("vesselName", "Vessel name")}${field("callSign", "Call sign")}${field("mmsi", "MMSI (alternative to call sign)", "text", "", 'pattern="[0-9]{9}"')}${field("imo", "IMO (optional)")}<small>Vessel identity is kept private from crew.</small></div><label class="check" style="margin:20px 0"><input type="checkbox" name="termsAccepted" value="true" required><span>I accept the <a id="terms-link" href="/terms.html?role=${role}" target="_blank">terms for my account</a>.</span></label><button type="submit" class="btn primary">Create account ${icon("arrow")}</button></form><p class="auth-links">Already registered? <a href="/login.html">Sign in</a></p>`,
    );
    const toggle = () => {
      const employer = $("input[name=userType]:checked").value === "employer";
      $("#vessel-fields").hidden = !employer;
      $("#vesselName").required = employer;
      $("#terms-link").href =
        `/terms.html?role=${employer ? "employer" : "jobseeker"}`;
    };
    $$("input[name=userType]").forEach((x) => (x.onchange = toggle));
    toggle();
    bindForm("#auth", async (f) => {
      await api("/auth/register", { method: "POST", body: new FormData(f) });
      localStorage.pendingVerifyEmail = f.email.value;
      location.href = "/verify-email.html";
    });
  } else if (page === "verify-email.html") {
    authLayout(
      "Check your inbox",
      "Enter the six-digit verification code. Codes expire after 10 minutes.",
      `<form id="auth">${field("email", "Email address", "email", localStorage.pendingVerifyEmail || "", "required")}${field("code", "Verification code", "text", "", 'required inputmode="numeric" pattern="[0-9]{6}" autocomplete="one-time-code"')}<button type="submit" class="btn primary">Verify email</button><button type="button" id="resend" class="btn">Send a new code</button></form><p class="auth-links"><a href="/login.html">Back to sign in</a></p>`,
    );
    bindForm("#auth", async (f) => {
      await api("/auth/verify-email", {
        method: "POST",
        body: Object.fromEntries(new FormData(f)),
      });
      location.href = "/login.html";
    });
    $("#resend").onclick = async () => {
      const b = $("#resend");
      b.disabled = true;
      try {
        await api("/auth/resend-verification-email", {
          method: "POST",
          body: { email: $("#email").value },
        });
        toast("A new verification code has been sent.");
      } catch (e) {
        error(e.message);
      } finally {
        b.disabled = false;
      }
    };
  } else {
    const reset = page === "reset-password.html";
    authLayout(
      reset ? "Set a new password" : "Reset your password",
      reset
        ? "Enter your reset code and choose a new password."
        : "We’ll send a reset code to your email address.",
      `<form id="auth">${field("email", "Email address", "email", localStorage.pendingVerifyEmail || "", "required")}${reset ? field("code", "Reset code", "text", "", 'required pattern="[0-9]{6}" inputmode="numeric"') + field("newPassword", "New password", "password", "", 'required minlength="8" autocomplete="new-password"') : ""}<button type="submit" class="btn primary">${reset ? "Save password" : "Send reset code"}</button></form><p class="auth-links"><a href="/login.html">Back to sign in</a></p>`,
    );
    bindForm("#auth", async (f) => {
      await api(`/auth/${reset ? "reset" : "forgot"}-password-email`, {
        method: "POST",
        body: Object.fromEntries(new FormData(f)),
      });
      localStorage.pendingVerifyEmail = f.email.value;
      location.href = reset ? "/login.html" : "/reset-password.html";
    });
  }
}
function jobCard(j, employer = false) {
  return `<article class="job-card"><div class="job-top"><div class="dept">${icon("jobs")}</div>${badge(employer ? (!j.endDate || new Date(j.endDate) < new Date(new Date().toISOString().slice(0, 10)) ? "expired" : j.status) : j.jobType)}</div><div><div class="eyebrow" style="margin-bottom:7px">${esc(j.department || "Yacht crew")}</div><h3>${esc(j.title)}</h3></div><div class="meta"><span>${icon("pin")}${esc(j.location?.city)}, ${esc(j.location?.country)}</span></div><div class="meta"><span>${icon("calendar")}${range(j)}</span><span>${icon("profile")}${j.crewNeeded || "—"} crew</span></div><div>${(
    j.tags || []
  )
    .slice(0, 4)
    .map((t) => `<span class="tag">${esc(t)}</span>`)
    .join(
      "",
    )}</div><div class="job-bottom"><strong>${esc(j.salary)}</strong>${employer ? `<a class="btn" href="/matches.html?job=${j._id}">View crew ${icon("arrow")}</a>` : `<button class="btn" data-job="${j._id}">View opportunity ${icon("arrow")}</button>`}</div></article>`;
}
async function dashboard() {
  const employer = me.userType === "employer";
  const [list, notifications] = await Promise.all([
    api(employer ? "/jobs/posted" : "/jobs/applied"),
    api("/portal/notifications"),
  ]);
  const active = list.filter(
    (j) =>
      j.status === "active" &&
      j.endDate &&
      new Date(j.endDate) >= new Date(new Date().toISOString().slice(0, 10)),
  ).length;
  shell(
    heading(
      employer
        ? "Your hiring, at a glance."
        : `Welcome aboard, ${esc(me.name.split(" ")[0])}.`,
      employer
        ? "Post your next requirement and connect with crew who fit."
        : "Keep your availability fresh. Your next opportunity could be just around the port.",
      `<a class="btn primary" href="/${employer ? "post-job" : "jobseeker-jobs"}.html">${icon(employer ? "plus" : "jobs")}${employer ? "Post a job" : "Find daywork"}</a>`,
    ) +
      `<div class="banner"><div><div class="eyebrow">${employer ? "A clear route to your next hire" : "Your availability matters"}</div><h2>${employer ? "Great crew starts with a clear brief." : me.profileStatus === "active" ? "Ready for your next day on board?" : "Let hiring parties know when you’re ready."}</h2><p>${employer ? "Add your port, dates and required skills. We’ll match against crew profiles so you can build a focused contact list." : "Update your location and dates to stay visible for relevant daywork. Availability is reconfirmed every 30 days."}</p></div><a class="btn" href="/${employer ? "post-job" : "crew-profile"}.html">${employer ? "Create a job" : "Update availability"} ${icon("arrow")}</a></div>` +
      `<div class="stats"><div class="stat">${icon("jobs")}<span>${employer ? "Active jobs" : "Applications"}</span><strong>${employer ? active : list.length}</strong><small>${employer ? "Open opportunities" : "Your submitted applications"}</small></div><div class="stat">${icon("applications")}<span>${employer ? "Applications" : "Awaiting review"}</span><strong>${employer ? list.reduce((n, j) => n + (j.applications?.length || 0), 0) : list.filter((j) => j.status === "pending").length}</strong><small>${employer ? "Across your job postings" : "Updates appear here"}</small></div><div class="stat">${icon("shield")}<span>${employer ? "Crew selected" : "Profile status"}</span><strong style="text-transform:capitalize">${employer ? list.reduce((n, j) => n + (j.contacts?.length || 0), 0) : esc(me.profileStatus || "Inactive")}</strong><small>${employer ? "Job-specific introductions" : "Manage in My profile"}</small></div></div>` +
      `<div class="main-grid"><section><div class="panel-heading"><h2>${employer ? "Recent job postings" : "Your applications"}</h2><a class="small" href="/${employer ? "manage-jobs" : "jobseeker-applications"}.html">View all →</a></div>${
        list.length
          ? `<div class="grid">${list
              .slice(0, 4)
              .map((j) => jobCard(j, employer))
              .join("")}</div>`
          : empty(
              employer
                ? "Your next hire starts here"
                : "A fresh start, a new opportunity",
              employer
                ? "Post your first daywork job to see matching crew."
                : "Browse current opportunities and apply when the details fit.",
              employer ? "/post-job.html" : "/jobseeker-jobs.html",
              employer ? "Post your first job" : "Explore daywork",
            )
      }</section><aside><section class="panel"><h2>Latest updates</h2>${
        notifications.length
          ? `<ul class="timeline">${notifications
              .slice(0, 5)
              .map(
                (n) =>
                  `<li><strong>${date(n.createdAt)}</strong>${esc(n.message)}</li>`,
              )
              .join("")}</ul>`
          : '<p class="small">Your introductions and activity updates will appear here.</p>'
      }</section><section class="panel"><div class="eyebrow">NCA is here to help</div><h3>A personal connection.</h3><p class="small">Questions about a job or an introduction? Send our team a private report.</p><a class="small" href="/report-issue.html">Contact support →</a></section></aside></div>`,
  );
  bindJobButtons();
}
function bindJobButtons() {
  $$("[data-job]").forEach((b) => (b.onclick = () => showJob(b.dataset.job)));
}
async function browse() {
  shell(
    heading(
      "Find your next daywork.",
      "Opportunities matched to life on the water. Vessel identities stay private.",
    ) +
      `<form id="filters" class="filters"><input name="search" aria-label="Search jobs" placeholder="Search position, skill or port…"><input name="city" aria-label="City" placeholder="City or port area">${select("position", "Position", options.positions).replace('class="field"', 'class="field" style="min-width:180px"')}<button type="submit" class="primary">Search jobs</button></form><div class="panel-heading"><h2>Available opportunities</h2><span id="count" class="small"></span></div><div id="jobs" class="grid"><div class="loading">Loading opportunities…</div></div>`,
  );
  const load = async () => {
    const q = new URLSearchParams(new FormData($("#filters")));
    jobs = await api("/jobs?" + q);
    $("#count").textContent = `${jobs.length} opportunities`;
    $("#jobs").innerHTML = jobs.length
      ? jobs.map((j) => jobCard(j)).join("")
      : empty(
          "No opportunities found",
          "Try a different position or location. New work may be posted later.",
        );
    bindJobButtons();
  };
  bindForm("#filters", load);
  await load();
}
async function download(path) {
  const r = await fetch("/api/v1" + path, {
    headers: { Authorization: `Bearer ${localStorage.token}` },
  });
  if (!r.ok) {
    const d = await r.json();
    throw new Error(d.message || "Document unavailable");
  }
  const blob = await r.blob(),
    url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = decodeURIComponent(
    r.headers.get("Content-Disposition")?.split("UTF-8''")[1] || "document.pdf",
  );
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function dialog(content) {
  $("dialog")?.remove();
  const d = document.createElement("dialog");
  d.innerHTML = `<div class="actions" style="margin-bottom:16px"><button id="close-dialog" aria-label="Close dialog">Close ×</button></div>${content}`;
  document.body.append(d);
  $("#close-dialog").onclick = () => d.close();
  d.showModal();
  return d;
}
async function showJob(id) {
  try {
    const j = await api("/jobs/" + id);
    const d = dialog(
      `<div class="eyebrow">${esc(j.jobType)} · ${esc(j.position)}</div><h2>${esc(j.title)}</h2><p>${esc(j.location?.displayName)}<br>${range(j)} · ${j.crewNeeded} crew<br><strong>${esc(j.salary)}</strong></p><p class="preline">${esc(j.description)}</p><div class="alert">Vessel identity is shared by the hiring party through private communication.</div><div id="apply-error" role="alert"></div><form id="apply-form">${field("resume", "Attach your CV (PDF, up to 5 MB)", "file", "", 'accept="application/pdf" required')}<div class="field" style="margin-top:16px"><label for="coverLetter">A short introduction</label><textarea id="coverLetter" name="coverLetter" maxlength="5000" placeholder="Tell the hiring party why this work is a good fit."></textarea></div><div class="actions" style="margin-top:20px"><button type="submit" class="primary">Submit application</button></div></form>`,
    );
    $("#apply-form").onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      busy(f, true);
      try {
        const fd = new FormData(f);
        fd.set("email", me.email);
        fd.set("phone", me.phone);
        await api(`/jobs/${id}/apply`, { method: "POST", body: fd });
        d.close();
        toast("Application submitted. Track it in My applications.");
      } catch (e) {
        error(e.message, $("#apply-error"));
      } finally {
        busy(f, false);
      }
    };
  } catch (e) {
    error(e.message);
  }
}
async function manage() {
  jobs = await api("/jobs/posted");
  shell(
    heading(
      "Your jobs. Your crew.",
      "Manage opportunities and build a focused shortlist for each job.",
      `<a class="btn primary" href="/post-job.html">${icon("plus")}Post a job</a>`,
    ) +
      (!me.vessel?.name
        ? '<div class="alert">Complete your vessel identity in <a href="/change-password.html">Account settings</a> before posting.</div>'
        : "") +
      `<div class="grid">${jobs.length ? jobs.map((j) => `<div>${jobCard(j, true)}<div class="actions" style="padding:12px 0 24px"><span class="small">${j.applications?.length || 0} applications · ${j.contacts?.length || 0} contacts</span>${!j.applications?.length && !j.contacts?.length ? `<a class="small" href="/post-job.html?edit=${j._id}">Edit job</a>` : ""}<select aria-label="Status for ${esc(j.title)}" data-status="${j._id}" style="width:auto;margin-left:auto">${["active", "closed", "filled", "cancelled"].map((s) => `<option ${s === j.status ? "selected" : ""}>${s}</option>`).join("")}</select></div></div>`).join("") : empty("No jobs posted yet", "Tell us the position, port and dates you need.", "/post-job.html", "Post a job")}</div>`,
  );
  $$("[data-status]").forEach(
    (s) =>
      (s.onchange = async () => {
        s.disabled = true;
        try {
          await api("/jobs/" + s.dataset.status, {
            method: "PUT",
            body: { status: s.value },
          });
          toast("Job status updated.");
          await manage();
        } catch (e) {
          error(e.message);
          s.value = jobs.find((j) => j._id === s.dataset.status).status;
        } finally {
          s.disabled = false;
        }
      }),
  );
}
async function postJob() {
  shell(
    heading(
      "Let’s find your next crew.",
      "A detailed brief helps us find people with the right skills and availability.",
    ) +
      `<form id="post-form"><section class="panel"><h2><span class="section-number">01</span>The opportunity</h2><div class="form-grid">${field("title", "Job title *", "text", "", 'required maxlength="120" placeholder="e.g. Deckhand for a three-day turnaround"')}${select("position", "Position *", options.positions, "", "required")}${select("jobType", "Work type *", ["Daywork", "Freelance", "Delivery"], "Daywork", "required")}${select("department", "Department *", Object.keys(options.tags), "", "required")}${field("startDate", "Start date *", "date", "", 'required min="' + new Date().toISOString().slice(0, 10) + '"')}${field("endDate", "End date *", "date", "", "required")}${field("crewNeeded", "Number of crew *", "number", "1", 'required min="1" max="100"')}${field("salary", "Rate & currency *", "text", "", 'required placeholder="e.g. USD 180 / day, or DOE"')}<div class="full"><label for="description">Job description *</label><textarea id="description" name="description" required maxlength="10000" placeholder="Duties, hours, experience and anything the crew should know. Keep vessel-identifying details out of this description."></textarea></div></div></section><section class="panel"><h2><span class="section-number">02</span>Location & requirements</h2><div class="form-grid">${field("country", "Country *", "text", "", 'required placeholder="e.g. United States"')}${field("city", "City *", "text", "", 'required placeholder="e.g. Fort Lauderdale"')}${field("port", "Port / marina *", "text", "", "required")}${select("vesselFlag", "Vessel flag *", ["US flagged", "Foreign Flagged"], "", "required")}<div class="full" id="job-tags"></div><div class="full">${checks("requiredCertificates", "Mandatory certificates", ["stcw", "eng1"], ["stcw", "eng1"])}</div></div></section><div class="alert" id="limit-note">For 1 crew member, you can select up to 5 contacts. Contact access is limited to this job.</div><div class="form-footer"><small>Vessel name and call sign remain private. Don’t include them in the public description.</small><button type="submit" class="primary">Post job & find crew ${icon("arrow")}</button></div></form>`,
  );
  $("#department").onchange = () =>
    ($("#job-tags").innerHTML = checks(
      "tags",
      "Skills needed",
      options.tags[$("#department").value] || [],
    ));
  $("#crewNeeded").oninput = () => {
    const n = Number($("#crewNeeded").value);
    $("#limit-note").textContent =
      n > 5
        ? "For more than 5 crew, contact NCA to arrange contact access."
        : `You can select up to ${n === 1 ? 5 : n === 2 ? 8 : 12} crew contacts for this job.`;
  };
  $("#startDate").onchange = () => ($("#endDate").min = $("#startDate").value);
  locationHints("country", "city", "port");
  const edit = new URLSearchParams(location.search).get("edit");
  if (edit) {
    const existing = (await api("/jobs/posted")).find((j) => j._id === edit);
    if (!existing) throw new Error("Job not found");
    for (const key of [
      "title",
      "position",
      "jobType",
      "department",
      "crewNeeded",
      "salary",
      "description",
      "vesselFlag",
    ])
      $("#" + key).value = existing[key] || "";
    for (const key of ["country", "city", "port"])
      $("#" + key).value = existing.location[key] || "";
    for (const key of ["startDate", "endDate"])
      $("#" + key).value = String(existing[key] || "").slice(0, 10);
    $("#department").onchange();
    $$("input[name=tags]").forEach(
      (x) => (x.checked = existing.tags.includes(x.value)),
    );
    $$("input[name=requiredCertificates]").forEach(
      (x) => (x.checked = existing.requiredCertificates.includes(x.value)),
    );
    $("#post-form button[type=submit]").textContent = "Save job";
  }

  bindForm("#post-form", async (f) => {
    const b = Object.fromEntries(new FormData(f));
    b.crewNeeded = Number(b.crewNeeded);
    b.tags = values(f, "tags");
    b.requiredCertificates = values(f, "requiredCertificates");
    b.location = {
      country: b.country,
      city: b.city,
      port: b.port,
      displayName: [b.city, b.country, b.port].join(", "),
    };
    const edit = new URLSearchParams(location.search).get("edit");
    if (edit) {
      delete b.country;
      delete b.city;
      delete b.port;
    }
    const j = await api(edit ? "/jobs/" + edit : "/jobs", {
      method: edit ? "PUT" : "POST",
      body: b,
    });
    location.href = "/matches.html?job=" + j._id;
  });
}
async function matches() {
  const id = new URLSearchParams(location.search).get("job");
  if (!id) {
    location.href = "/manage-jobs.html";
    return;
  }
  const [owned, data, contacts] = await Promise.all([
    api("/jobs/posted"),
    api(`/jobs/${id}/matches`),
    api(`/jobs/${id}/contacts`),
  ]);
  const j = owned.find((j) => j._id === id);
  if (!j) throw new Error("Job not found");
  shell(
    heading(
      "Find the right people.",
      `${esc(j.title)} · ${esc(j.location.city)} · ${range(j)}`,
      `<a class="btn" href="/manage-jobs.html">Back to jobs</a>`,
    ) +
      `<div class="banner"><div><div class="eyebrow">Job-specific contact access</div><h2>${data.closed ? "This job is closed" : `${data.unlocked.length} of ${data.contactLimit} contacts selected`}</h2><p>${data.closed ? "Only names remain in your contact history. CV and contact access has ended." : data.contactLimit ? "Review profile summaries below. Select Contact Crew to view a CV and approved contact methods." : "This job needs more than five crew. Contact NCA to arrange access."}</p></div>${!data.contactLimit && !data.closed ? '<a class="btn" href="/report-issue.html">Contact NCA</a>' : ""}</div><section class="panel"><h2>Your contact list</h2><div id="contacts">${contacts.length ? contacts.map((c) => `<div class="list-row"><div><h3>${esc(c.name)}</h3>${c.closed ? '<span class="small">Contact access closed</span>' : `<div class="actions">${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ""}${c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : ""}${c.whatsapp ? `<a href="https://wa.me/${esc(c.whatsapp.replace(/\D/g, ""))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}${(c.documents || []).map((t) => `<button class="quiet small" data-document="/jobs/${id}/contacts/${c._id}/documents/${t}">${esc(t.toUpperCase())} ↓</button>`).join("")}</div>`}</div>${select("outcome-" + c._id, "Hiring outcome", ["Yes", "No", "Waiting for a response", "Crew was unavailable", "Job was cancelled"], c.employerOutcome || "", 'data-outcome="' + c._id + '"')}</div>`).join("") : '<p class="small">Crew you select will appear here.</p>'}</div></section><div class="panel-heading"><h2>${data.crew.length} matched crew</h2><span class="small">Ranked by profile fit</span></div><div class="grid">${data.crew.length ? data.crew.map((c) => `<article class="job-card crew-card"><div class="crew-header">${c.hasPhoto ? `<img class="crew-photo" data-photo="/jobs/${id}/matches/${c._id}/photo" alt="${esc(c.name)}">` : `<div class="avatar crew-photo">${esc(c.name[0])}</div>`}<div><h3>${esc(c.name)}</h3><p>${esc(c.primaryPosition)}</p></div><span class="badge good" style="margin-left:auto">${c.score} fit</span></div><div class="meta"><p>${esc(c.location?.city)}, ${esc(c.location?.country)}</p><p>${esc((c.experience || []).join(", "))} · ${esc(c.yachtSize)}</p><p>${esc(c.dayRate)}</p></div><div>${c.keywords.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div><p class="small">${c.reasons.map(esc).join(" · ")}</p><p class="small">Certificates uploaded: ${c.certificates.map(esc).join(", ") || "None"}<br>Availability confirmed ${date(c.profileLastActive)}</p><div class="job-bottom"><span class="small">CV & contact details protected</span><button data-unlock="${c._id}" class="primary" ${data.unlocked.includes(c._id) || data.unlocked.length >= data.contactLimit ? "disabled" : ""}>${data.unlocked.includes(c._id) ? "Selected" : "Contact crew"}</button></div></article>`).join("") : empty(data.closed ? "Matching is closed" : "No eligible crew yet", data.closed ? "Post a new job for your next requirement." : "Crew must meet the position, location, dates and work requirements. Check again as profiles are updated.")}</div>`,
  );
  $$("[data-unlock]").forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        try {
          await api(`/jobs/${id}/contacts/${b.dataset.unlock}`, {
            method: "POST",
          });
          await matches();
          toast("Crew notified. Contact details unlocked.");
        } catch (e) {
          error(e.message);
          b.disabled = false;
        }
      }),
  );
  bindDocuments();
  $$("[data-outcome]").forEach(
    (s) =>
      (s.onchange = async () => {
        try {
          await api(`/jobs/${id}/outcomes/${s.dataset.outcome}`, {
            method: "POST",
            body: { outcome: s.value },
          });
          toast("Outcome recorded.");
        } catch (e) {
          error(e.message);
        }
      }),
  );
  for (const img of $$("[data-photo]")) {
    fetch("/api/v1" + img.dataset.photo, {
      headers: { Authorization: `Bearer ${localStorage.token}` },
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (b) {
          const u = URL.createObjectURL(b);
          img.src = u;
          img.onload = () => URL.revokeObjectURL(u);
        }
      })
      .catch(() => {});
  }
}
function bindDocuments() {
  $$("[data-document]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await download(b.dataset.document);
        } catch (e) {
          error(e.message);
        }
      }),
  );
}
async function profile() {
  const cp = await api("/profile"),
    loc = cp.currentLocation || {},
    av = cp.availability || {};
  const docs = [
    ["photo", "Profile photo", "image/jpeg,image/png,image/webp"],
    ["cv", "CV", "application/pdf"],
    ["stcw", "STCW certificate", "application/pdf,image/*"],
    ["eng1", "ENG1 certificate", "application/pdf,image/*"],
    ["references", "Written references", "application/pdf,image/*"],
    ["passport", "Passport (private)", "application/pdf,image/*"],
    [
      "driversLicense",
      "Driver’s licence (optional)",
      "application/pdf,image/*",
    ],
  ];
  shell(
    heading(
      "Your profile. Your next opportunity.",
      "The more detailed your profile is, the more likely you are to be selected for positions.",
      badge(cp.profileStatus),
    ) +
      (!cp.profileComplete
        ? '<div class="alert">Complete all required sections to unlock the crew portal and appear in relevant matches.</div>'
        : "") +
      `<form id="profile-form"><section class="panel"><h2><span class="section-number">01</span>Crew member details</h2><div class="form-grid">${field("firstName", "First name *", "text", cp.firstName || me.name.split(" ")[0], "required")}${field("lastName", "Last name *", "text", cp.lastName, "required")}${field("email", "Verified email", "email", cp.email, "readonly required")}${field("confirmEmail", "Confirm email *", "email", cp.email, "required")}${field("phone", "Phone number *", "tel", cp.phone, "required")}${field("alternatePhone", "Alternate phone (optional)", "tel", cp.alternatePhone)}<div>${checks("phoneWhatsApp", "WhatsApp", [["true", "Main number is available on WhatsApp"]], cp.phoneWhatsApp ? ["true"] : [])}</div><div>${checks("alternatePhoneWhatsApp", "Alternate number", [["true", "Available on WhatsApp"]], cp.alternatePhoneWhatsApp ? ["true"] : [])}</div>${select("nationality", "Nationality *", ["US", "Non-US"], cp.nationality, "required")}${select("usWorkAuthorization", "Visa / residency status", ["B1/B2", "Green Card", "Other", "Not applicable"], cp.usWorkAuthorization)}<div class="full">${field("eligibleCountries", "Countries where you are authorized to work *", "text", cp.workEligibilityCountries.join(", "), 'required placeholder="e.g. United States, France"')}<small>Enter comma-separated country names. Only include countries where you have permission for the work you accept. A visa upload alone does not establish eligibility.</small></div></div></section><section class="panel"><h2><span class="section-number">02</span>Position & experience</h2><div class="form-grid">${select("primaryPosition", "Primary position *", options.positions, cp.primaryPosition, "required")}<div>${checks("positions", "Positions you will accept (up to 3 total) *", options.positions, cp.positions)}</div>${select("experience", "Experience *", ["Green", "6 months - 1 year", "1 year +"], cp.experience[0], "required")}${field("yachtSize", "Yacht-size experience *", "text", cp.yachtSize, 'required placeholder="e.g. 30–50 m, or new to yachting"')}${field("dayRate", "Day rate preference *", "text", cp.dayRate, 'required placeholder="e.g. USD 180 / day, negotiable or DOE"')}${select("duration", "Preferred duration *", ["1 day", "2 days", "3 days", "4 days", "5 days", "6 days", "7 days"], cp.duration, "required")}<div class="full">${checks("workTypes", "Work types *", ["Daywork", "Freelance", "Delivery"], cp.workTypes)}</div><div class="full"><h3>Skills & departments</h3>${Object.entries(
        options.tags,
      )
        .map(
          ([dept, tags]) =>
            `<div style="margin-bottom:18px">${checks("keywords", dept, tags, cp.keywords)}</div>`,
        )
        .join(
          "",
        )}</div></div></section><section class="panel"><h2><span class="section-number">03</span>Where & when you’re available</h2><div class="form-grid">${field("locationCountry", "Country *", "text", loc.country, "required")}${field("locationCity", "City *", "text", loc.city, "required")}${field("locationState", "State / region", "text", loc.state)}${field("locationPort", "Port / marina *", "text", loc.port, "required")}${field("travelKm", "Travel distance (km) *", "number", cp.travelKm, 'required min="0" max="2000"')}${select(
        "availabilityMode",
        "Availability *",
        [
          ["now", "Available now"],
          ["dates", "Between selected dates"],
          ["weekdays", "Certain weekdays"],
          ["unavailable", "Currently unavailable"],
        ],
        av.mode,
        "required",
      )}<div class="full form-grid" id="available-dates">${field("availableStart", "Available from", "date", String(av.start || "").slice(0, 10))}${field("availableEnd", "Available until", "date", String(av.end || "").slice(0, 10))}</div><div class="full" id="available-weekdays">${checks(
        "weekdays",
        "Available weekdays",
        [
          [1, "Mon"],
          [2, "Tue"],
          [3, "Wed"],
          [4, "Thu"],
          [5, "Fri"],
          [6, "Sat"],
          [0, "Sun"],
        ],
        av.weekdays || [],
      )}</div>${select(
        "profileStatus",
        "Profile status *",
        [
          ["active", "Active — available for work"],
          ["inactive", "Inactive — not looking"],
        ],
        cp.profileStatus,
        "required",
      )}<div class="field"><label>Keep your availability current</label><small>We send a reminder after 23 days and set your profile inactive after 30 days without confirmation.</small></div></div></section><section class="panel"><h2><span class="section-number">04</span>Documents, ready when you are</h2><p class="small">Up to 5 MB per file. Your passport stays private. CVs and approved documents become available after a hiring party selects Contact Crew for an open job.</p><div class="form-grid">${docs.map(([key, label, accept]) => `<div class="document-row"><label for="${key}">${label}${key === "driversLicense" ? "" : " *"}</label><span class="small">${cp.documents[key] ? esc(cp.documents[key].originalName) : "No file uploaded"}</span>${cp.documents[key] ? `<button type="button" class="quiet small" data-document="/profile/documents/${key}">Download current file ↓</button>` : ""}<input id="${key}" name="${key}" type="file" accept="${accept}" ${!cp.documents[key] && key !== "driversLicense" ? "required" : ""}></div>`).join("")}<div class="document-row"><label for="additionalCertificates">Additional certificates (optional)</label><span class="small">Add named certificates. Existing certificates are preserved.</span>${field("certificateName", "Certificate name")}<input id="additionalCertificates" name="additionalCertificates" type="file" accept="application/pdf,image/jpeg,image/png,image/webp">${cp.documents.additionalCertificates.map((c, i) => `<div class="small">${esc(c.name)} <button type="button" class="quiet small" data-document="/profile/documents/additional/${i}">Download ↓</button></div>`).join("")}</div></div></section><section class="panel"><h2><span class="section-number">05</span>How you’d like to be contacted</h2>${checks(
        "contactPreferences",
        "Approved contact methods *",
        [
          ["phone", "Phone call"],
          ["text", "Text message"],
          ["whatsapp", "WhatsApp"],
          ["email", "Email"],
        ],
        cp.contactPreferences,
      )}<p class="small" style="margin-top:18px">Hiring parties can only access the contact methods you select, for jobs where they’ve selected you.</p></section><div class="form-footer"><small>Saving confirms that your information and availability are current.</small><button type="submit" class="primary">Save profile & continue ${icon("arrow")}</button></div></form>`,
  );
  const toggle = () => {
    const mode = $("#availabilityMode").value;
    $("#available-dates").hidden = mode !== "dates";
    $("#available-weekdays").hidden = mode !== "weekdays";
    $("#availableStart").required = mode === "dates";
    $("#availableEnd").required = mode === "dates";
    if (mode === "unavailable") $("#profileStatus").value = "inactive";
  };
  $("#availabilityMode").onchange = toggle;
  toggle();
  bindDocuments();
  locationHints("locationCountry", "locationCity", "locationPort");
  bindForm("#profile-form", async (f) => {
    const fd = new FormData(f);
    const pos = [
      ...new Set([fd.get("primaryPosition"), ...fd.getAll("positions")]),
    ];
    if (pos.length > 3)
      throw new Error(
        "Choose a primary position and at most two additional positions.",
      );
    fd.set("positions", JSON.stringify(pos));
    fd.set("experience", JSON.stringify([fd.get("experience")]));
    for (const key of ["workTypes", "contactPreferences", "keywords"])
      fd.set(key, JSON.stringify([...new Set(fd.getAll(key))]));
    fd.set(
      "workEligibilityCountries",
      JSON.stringify(
        fd
          .get("eligibleCountries")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );
    fd.set(
      "availability",
      JSON.stringify({
        mode: fd.get("availabilityMode"),
        start: fd.get("availableStart") || undefined,
        end: fd.get("availableEnd") || undefined,
        weekdays: fd.getAll("weekdays").map(Number),
      }),
    );
    fd.set(
      "keepAdditionalIndices",
      JSON.stringify(cp.documents.additionalCertificates.map((_, i) => i)),
    );
    fd.set(
      "additionalCertificateNames",
      JSON.stringify([fd.get("certificateName")]),
    );
    for (const [k, v] of [...fd])
      if (v instanceof File && !v.size) fd.delete(k);
    await api("/profile", { method: "POST", body: fd });
    location.href = "/jobseeker.html";
  });
}
async function applications() {
  if (me.userType === "jobseeker") {
    const [apps, intros] = await Promise.all([
      api("/jobs/applied"),
      api("/portal/introductions"),
    ]);
    shell(
      heading(
        "Every opportunity, in one place.",
        "Track applications and share the outcome of your introductions.",
      ) +
        `<section class="panel"><h2>Your applications</h2>${apps.length ? apps.map((j) => `<div class="list-row"><div><h3>${esc(j.title)}</h3><p>${esc(j.location?.city)} · ${range(j)}</p><small>Applied ${date(j.appliedAt)}</small></div><div>${badge(j.status)}</div></div>`).join("") : empty("No applications yet", "When you apply to a job, you can track its status here.", "/jobseeker-jobs.html", "Find daywork")}</section><section class="panel"><h2>Your introductions</h2><p class="small">Let NCA know whether an introduction resulted in work.</p>${intros.length ? intros.map((j) => `<div class="list-row"><div><h3>${esc(j.position)} · ${esc(j.location?.city)}</h3><p>${range(j)}</p></div>${select("intro-" + j._id, "Were you hired?", ["Yes", "No", "Contacted but not hired", "No response"], j.outcome, 'data-intro="' + j._id + '"')}</div>`).join("") : '<p class="small">You’ll see an introduction when a hiring party selects you for contact.</p>'}</section>`,
    );
    $$("[data-intro]").forEach(
      (s) =>
        (s.onchange = async () => {
          try {
            await api(`/jobs/${s.dataset.intro}/outcomes/${me._id}`, {
              method: "POST",
              body: { outcome: s.value },
            });
            toast("Thank you. Your outcome is recorded.");
          } catch (e) {
            error(e.message);
          }
        }),
    );
  } else {
    jobs = await api("/jobs/posted");
    shell(
      heading(
        "Meet your applicants.",
        "Review applications and keep crew informed with a clear status update.",
      ) +
        `<div class="panel">${select(
          "applicationJob",
          "Choose a job",
          jobs.map((j) => [j._id, j.title]),
        )}</div><div id="application-list">${empty("Choose a job to review", "Applications are grouped by the opportunity they were submitted for.")}</div>`,
    );
    $("#applicationJob").onchange = async () => {
      try {
        const id = $("#applicationJob").value;
        if (!id) return;
        const apps = await api(`/jobs/${id}/applications`);
        $("#application-list").innerHTML = apps.length
          ? apps
              .map(
                (a) =>
                  `<section class="panel"><div class="panel-heading"><h2>${esc(a.applicant?.name || "Crew member")}</h2>${badge(a.status)}</div><p class="preline">${esc(a.coverLetter || "No introduction provided.")}</p><div class="actions">${a.email ? `<a href="mailto:${esc(a.email)}">Email applicant</a>` : ""}${a.phone ? `<a href="tel:${esc(a.phone)}">${esc(a.phone)}</a>` : ""}${a.hasResume ? `<button data-document="/jobs/applications/${a._id}/resume">Download CV ↓</button>` : '<span class="small">Document access closed</span>'}${select("status-" + a._id, "Application status", ["pending", "reviewed", "accepted", "rejected"], a.status, 'data-application="' + a._id + '"')}</div></section>`,
              )
              .join("")
          : empty(
              "No applications yet",
              "Interested crew will appear here after they apply.",
            );
        bindDocuments();
        $$("[data-application]").forEach(
          (s) =>
            (s.onchange = async () => {
              try {
                await api(
                  `/jobs/applications/${s.dataset.application}/status`,
                  { method: "PUT", body: { status: s.value } },
                );
                toast("Application updated.");
              } catch (e) {
                error(e.message);
              }
            }),
        );
      } catch (e) {
        error(e.message);
      }
    };
    if (jobs.length) {
      $("#applicationJob").value = jobs[0]._id;
      await $("#applicationJob").onchange();
    }
  }
}
function settings() {
  shell(
    heading(
      "Account settings.",
      "Keep your account secure and your details up to date.",
    ) +
      `<section class="panel"><h2>Change password</h2><form id="password-form"><div class="form-grid">${field("currentPassword", "Current password", "password", "", 'required autocomplete="current-password"')}${field("newPassword", "New password", "password", "", 'required minlength="8" autocomplete="new-password"')}</div><button type="submit" class="primary" style="margin-top:20px">Update password</button></form></section>${me.userType === "employer" ? `<section class="panel"><h2>Vessel identity</h2><p class="small">These details are private. Each account represents one vessel.</p><form id="vessel-form"><div class="form-grid">${field("name", "Vessel name", "text", me.vessel?.name, "required")}${field("callSign", "Call sign", "text", me.vessel?.callSign)}${field("mmsi", "MMSI", "text", me.vessel?.mmsi, 'pattern="[0-9]{9}"')}${field("imo", "IMO (optional)", "text", me.vessel?.imo)}</div><button type="submit" class="primary" style="margin-top:20px">Save vessel details</button></form></section>` : ""}`,
  );
  bindForm("#password-form", async (f) => {
    await api("/auth/change-password", {
      method: "POST",
      body: Object.fromEntries(new FormData(f)),
    });
    localStorage.removeItem("token");
    location.href = "/login.html";
  });
  if ($("#vessel-form"))
    bindForm("#vessel-form", async (f) => {
      await api("/auth/vessel", {
        method: "PUT",
        body: Object.fromEntries(new FormData(f)),
      });
      toast("Vessel details saved.");
    });
}
function support() {
  shell(
    heading(
      "We’re here to help.",
      "Report an issue privately to the NCA team.",
    ) +
      `<section class="panel" style="max-width:800px"><h2>Send a report</h2><p>Include the job, dates and details that will help us understand what happened.</p><form id="issue-form">${field("subject", "Subject", "text", "", 'required minlength="3" maxlength="160"')}<div class="field" style="margin-top:20px"><label for="report-message">Your message</label><textarea id="report-message" name="message" required minlength="10" maxlength="5000"></textarea></div><button type="submit" class="primary" style="margin-top:20px">Submit report ${icon("arrow")}</button></form></section>`,
  );
  bindForm("#issue-form", async (f) => {
    const result = await api("/portal/issues", {
      method: "POST",
      body: Object.fromEntries(new FormData(f)),
    });
    f.reset();
    $("#message").className = "alert success";
    $("#message").textContent =
      `Your report has been recorded. Reference: ${result.reference}`;
  });
}
function pricing() {
  document.body.className = "landing";
  document.body.innerHTML =
    header() +
    `<main class="landing-section"><div class="eyebrow">Vessel access</div><h1>A plan for your season.</h1><p>Crew access is always free. Each employer subscription covers one named vessel.</p><div class="alert">Vessel subscriptions are arranged through NCA. Online checkout is not yet available.</div><div class="pricing-grid">${[
      [
        "30-Day Access",
        "99",
        "For a busy month, yard stay or charter turnaround.",
        "",
      ],
      [
        "90-Day Season Pass",
        "249",
        "For a Mediterranean, Caribbean or US season.",
        "Most popular",
      ],
      [
        "6-Month Access",
        "449",
        "For an extended season, transition or refit.",
        "",
      ],
      [
        "Annual Vessel Membership",
        "699",
        "For yachts hiring throughout the year.",
        "Best value",
      ],
    ]
      .map(
        ([name, price, text, tag]) =>
          `<article class="price-card ${tag === "Most popular" ? "featured" : ""}">${tag ? `<span class="badge good">${tag}</span>` : '<span class="small">One vessel</span>'}<h3 style="margin-top:20px">${name}</h3><div class="price">$${price}</div><p>${text}</p><p>Job posting, crew matching and applications. Per-job contact limits apply.</p><a class="btn ${tag === "Most popular" ? "primary" : ""}" href="/signup.html?role=employer">Create vessel account</a></article>`,
      )
      .join(
        "",
      )}</div><p style="margin-top:30px">Managing daywork requirements for multiple yachts? Contact NCA for multi-vessel access through your account’s Help & report an issue page.</p></main>` +
    footer();
}
async function legal() {
  document.body.className = "landing";
  const employer =
    new URLSearchParams(location.search).get("role") === "employer";
  document.body.innerHTML =
    header() +
    `<main class="landing-section legal"><h1>${page === "privacy.html" ? "Privacy information" : employer ? "Employer terms" : "Crew terms"}</h1><div class="alert">Draft documentation. NCA’s legal entity, effective date and final privacy policy have not yet been supplied.</div><div id="legal-copy"></div></main>` +
    footer();
  if (page === "privacy.html")
    $("#legal-copy").innerHTML =
      "<p>Profiles hold personal details, availability and uploaded documents. Hiring parties see limited profile summaries until they select Contact Crew for an open job. Contact and document access is tied to that job. Passport documents are private to the crew account.</p><p>The source documentation reserves the final privacy policy for NCA. Contact the team through your account for questions about retention, access or deletion.</p>";
  else {
    const r = await fetch(`/terms-${employer ? "employer" : "crew"}.txt`);
    $("#legal-copy").textContent = await r.text();
    $("#legal-copy").className = "preline";
  }
}
async function init() {
  if (page === "index.html") return landing();
  if (
    [
      "login.html",
      "signup.html",
      "verify-email.html",
      "forgot-password.html",
      "reset-password.html",
    ].includes(page)
  )
    return auth();
  if (page === "pricing.html") return pricing();
  if (["terms.html", "privacy.html"].includes(page)) return legal();
  if (!localStorage.token) {
    location.href = "/login.html";
    return;
  }
  try {
    [me, options] = await Promise.all([
      api("/auth/me"),
      api("/portal/options"),
    ]);
    const crewPages = [
        "jobseeker.html",
        "jobseeker-jobs.html",
        "jobseeker-applications.html",
        "crew-profile.html",
      ],
      employerPages = [
        "employer.html",
        "post-job.html",
        "manage-jobs.html",
        "employer-applications.html",
        "matches.html",
      ];
    if (
      (me.userType === "jobseeker" && employerPages.includes(page)) ||
      (me.userType === "employer" && crewPages.includes(page))
    ) {
      location.href =
        me.userType === "employer" ? "/employer.html" : "/jobseeker.html";
      return;
    }
    if (
      me.userType === "jobseeker" &&
      !me.profileComplete &&
      ![
        "crew-profile.html",
        "change-password.html",
        "report-issue.html",
      ].includes(page)
    ) {
      location.href = "/crew-profile.html";
      return;
    }
    const handlers = {
      "employer.html": dashboard,
      "jobseeker.html": dashboard,
      "jobseeker-jobs.html": browse,
      "manage-jobs.html": manage,
      "post-job.html": postJob,
      "matches.html": matches,
      "crew-profile.html": profile,
      "jobseeker-applications.html": applications,
      "employer-applications.html": applications,
      "change-password.html": settings,
      "report-issue.html": support,
    };
    shell(
      '<div class="loading" role="status">Getting your workspace ready…</div>',
    );
    await (handlers[page] || dashboard)();
  } catch (e) {
    if (me)
      shell(
        heading(
          "We couldn’t load this page.",
          "Your information is safe. Please try again.",
        ) +
          `<div class="alert error">${esc(e.message)}</div><button id="retry" class="primary">Try again</button>`,
      );
    else
      document.body.innerHTML =
        header() +
        `<main class="landing-section"><div class="alert error">${esc(e.message)}</div><a class="btn primary" href="/login.html">Sign in again</a></main>`;
    if ($("#retry")) $("#retry").onclick = () => location.reload();
  }
}
init();

async function locationHints(countryId, cityId, portId) {
  const country = $("#" + countryId),
    city = $("#" + cityId),
    port = $("#" + portId);
  function attach(input, list) {
    let d = $("#" + input.id + "-options");
    if (!d) {
      d = document.createElement("datalist");
      d.id = input.id + "-options";
      input.after(d);
      input.setAttribute("list", d.id);
    }
    d.innerHTML = list.map((v) => `<option value="${esc(v)}">`).join("");
  }
  try {
    attach(country, await api("/locations/countries"));
  } catch {}
  country.addEventListener("change", async () => {
    try {
      attach(
        city,
        await api("/locations/cities/" + encodeURIComponent(country.value)),
      );
    } catch {}
  });
  city.addEventListener("change", async () => {
    try {
      attach(
        port,
        await api(
          "/locations/ports/" +
            encodeURIComponent(country.value) +
            "/" +
            encodeURIComponent(city.value),
        ),
      );
    } catch {}
  });
}
