// Shared onboarding, profile, notification and staff experiences.
async function signupFlow() {
  const initial =
    new URLSearchParams(location.search).get("role") === "employer"
      ? "employer"
      : "jobseeker";
  authLayout(
    "Welcome to your next chapter.",
    "A few details now. Better connections ahead.",
    `
    <form id="signup-flow" novalidate>
      <div class="role-choice"><label><input type="radio" name="userType" value="jobseeker" ${initial === "jobseeker" ? "checked" : ""}><span>I’m crew<small>Find your next daywork</small></span></label><label><input type="radio" name="userType" value="employer" ${initial === "employer" ? "checked" : ""}><span>I’m hiring<small>Build your vessel’s crew</small></span></label></div>
      <ol class="stepper" id="signup-steps" aria-label="Signup progress"></ol>
      <section class="signup-card" data-signup-step="account"><div class="eyebrow">Let’s start with you</div><h2>Your account</h2><p>Your contact details keep your account secure.</p><div class="form-grid">${field("firstName", "First name", "text", "", 'required autocomplete="given-name"')}${field("lastName", "Last name", "text", "", 'required autocomplete="family-name"')}</div>${field("email", "Email address", "email", "", 'required autocomplete="email"')}${field("phone", "Phone number", "tel", "", 'required autocomplete="tel"')}${field("password", "Password", "password", "", 'required minlength="8" autocomplete="new-password"')}<small>Use at least 8 characters. We’ll verify your email next.</small></section>
      <section class="signup-card" data-signup-step="vessel" hidden><div class="eyebrow">One vessel. One workspace.</div><h2>Tell us about your vessel</h2><p>NCA uses these details to review employer accounts. They stay private from the crew job board.</p>${field("vesselName", "Vessel name", "text", "", 'required placeholder="Registered vessel name"')}${field("callSign", "Call sign", "text", "", 'placeholder="e.g. WXYZ"')}<div class="form-grid">${field("mmsi", "MMSI (if no call sign)", "text", "", 'pattern="[0-9]{9}" inputmode="numeric" placeholder="9 digits"')}${field("imo", "IMO (optional)", "text", "", 'placeholder="If applicable"')}</div><div class="alert">Provide a call sign or a nine-digit MMSI so the team can identify the vessel.</div></section>
      <section class="signup-card" data-signup-step="review" hidden><div class="eyebrow">Nearly on board</div><h2>Review your details</h2><dl class="review-grid" id="signup-review"></dl><p class="small" id="approval-explainer"></p><label class="check"><input type="checkbox" name="termsAccepted" value="true" required><span>I accept the <a id="signup-terms" target="_blank" rel="noopener">terms for my account</a> and have read the <a href="/privacy.html" target="_blank" rel="noopener">privacy information</a>.</span></label></section>
      <div class="wizard-actions"><button type="button" id="signup-back" class="btn">Back</button><small id="signup-progress" aria-live="polite"></small><button type="button" id="signup-next" class="btn primary">Continue ${icon("arrow")}</button><button type="submit" id="signup-submit" class="btn primary" hidden>Create account ${icon("arrow")}</button></div>
    </form><p class="auth-links">Already have an account? <a href="/login.html">Sign in</a></p>`,
  );
  $(".auth-foot").insertAdjacentHTML(
    "beforebegin",
    `<div class="hero-step"><span>01</span><div><strong>A clear start</strong><small>Create your account and verify your email.</small></div></div><div class="hero-step"><span>02</span><div><strong>A personal connection</strong><small>Make your profile or vessel workspace your own.</small></div></div>`,
  );
  const f = $("#signup-flow");
  let index = 0,
    mode = "auto";
  try {
    mode = (await api("/portal/options")).employerApprovalMode || "auto";
  } catch {}
  const role = () => f.querySelector("input[name=userType]:checked").value;
  const stages = () =>
    role() === "employer"
      ? ["account", "vessel", "review"]
      : ["account", "review"];
  function validate(section) {
    for (const input of section.querySelectorAll("input,select,textarea"))
      if (!input.disabled && !input.checkValidity()) {
        input.reportValidity();
        return false;
      }
    if (
      section.dataset.signupStep === "vessel" &&
      !f.callSign.value.trim() &&
      !/^\d{9}$/.test(f.mmsi.value)
    ) {
      error("Add your vessel’s call sign or a nine-digit MMSI.");
      f.callSign.focus();
      return false;
    }
    return true;
  }
  function show() {
    const list = stages(),
      current = list[index];
    f.querySelectorAll("[data-signup-step]").forEach(
      (s) => (s.hidden = s.dataset.signupStep !== current),
    );
    f.querySelectorAll("[data-signup-step=vessel] input").forEach(
      (input) => (input.disabled = role() !== "employer"),
    );
    $("#signup-steps").innerHTML = list
      .map(
        (s, i) =>
          `<li class="${i === index ? "current" : i < index ? "done" : ""}" ${i === index ? 'aria-current="step"' : ""}><span>${i + 1}</span>${{ account: "Your account", vessel: "Your vessel", review: "Review & join" }[s]}</li>`,
      )
      .join("");
    $("#signup-progress").textContent = `Step ${index + 1} of ${list.length}`;
    $("#signup-back").hidden = index === 0;
    $("#signup-next").hidden = current === "review";
    $("#signup-submit").hidden = current !== "review";
    $("#signup-terms").href = `/terms.html?role=${role()}`;
    $("#signup-terms").textContent =
      role() === "employer" ? "Employer Terms of Use" : "Crew Terms of Use";
    $("#approval-explainer").textContent =
      role() === "employer"
        ? mode === "auto"
          ? "After email verification, your vessel account is automatically approved and ready to use."
          : "After email verification, NCA will review your vessel name and call sign/MMSI. We’ll notify you when your account is approved."
        : "After email verification, complete your crew profile to discover daywork.";
    const rows = [
      ["Name", `${f.firstName.value} ${f.lastName.value}`],
      ["Email", f.email.value],
      ["Phone", f.phone.value],
      ...(role() === "employer"
        ? [
            ["Vessel", f.vesselName.value],
            ["Call sign / MMSI", f.callSign.value || f.mmsi.value],
          ]
        : []),
    ];
    $("#signup-review").innerHTML = rows
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
      .join("");
  }
  $("#signup-next").onclick = () => {
    if (validate(f.querySelector(`[data-signup-step=${stages()[index]}]`))) {
      index++;
      show();
    }
  };
  $("#signup-back").onclick = () => {
    index--;
    show();
  };
  f.querySelectorAll("[name=userType]").forEach(
    (r) =>
      (r.onchange = () => {
        index = 0;
        show();
      }),
  );
  show();
  f.onsubmit = async (e) => {
    e.preventDefault();
    if (stages()[index] !== "review") {
      $("#signup-next").click();
      return;
    }
    for (const [i, stage] of stages().entries()) {
      const section = f.querySelector(`[data-signup-step=${stage}]`);
      if (
        [...section.querySelectorAll("input")].some(
          (x) => !x.disabled && !x.checkValidity(),
        )
      ) {
        index = i;
        show();
        validate(section);
        return;
      }
    }
    busy(f, true);
    try {
      await api("/auth/register", { method: "POST", body: new FormData(f) });
      localStorage.pendingVerifyEmail = f.email.value;
      location.href = "/verify-email.html";
    } catch (e) {
      error(e.message);
    } finally {
      busy(f, false);
    }
  };
}

let ownPhotoURL, ownPhotoRequest;
async function loadOwnPhotos() {
  const images = $$("[data-own-photo]");
  if (!images.length) return;
  if (!ownPhotoRequest)
    ownPhotoRequest = fetch("/api/v1/profile/photo", {
      headers: { Authorization: `Bearer ${localStorage.token}` },
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b ? URL.createObjectURL(b) : null))
      .catch(() => null);
  ownPhotoURL = await ownPhotoRequest;
  for (const img of images) {
    if (ownPhotoURL) img.src = ownPhotoURL;
    else img.hidden = true;
  }
}
async function refreshNotificationCount() {
  try {
    const notices = await api("/portal/notifications");
    const count = notices.filter((n) => !n.read).length,
      b = $("#notification-count");
    if (b) {
      b.hidden = !count;
      b.textContent = count > 99 ? "99+" : count;
      b.parentElement.setAttribute(
        "aria-label",
        `Notifications${count ? `, ${count} unread` : ""}`,
      );
    }
  } catch {}
}
function enhanceCrewProfile(cp) {
  const form = $("#profile-form");
  form.insertAdjacentHTML(
    "beforebegin",
    `<section class="profile-identity"><div class="photo-frame">${cp.documents.photo ? '<img data-own-photo id="profile-photo-preview" alt="Your crew profile photo">' : `<span id="photo-initial">${esc((cp.firstName || me.name)[0])}</span><img id="profile-photo-preview" alt="Selected profile photo" hidden>`}</div><div><div class="eyebrow">Your crew profile</div><h2>${esc(cp.firstName || me.name)} ${esc(cp.lastName)}</h2><p>Your photo appears here, in your account header and on matched-crew cards.</p><button type="button" class="btn" id="choose-photo">${cp.documents.photo ? "Change photo" : "Add your photo"}</button><small id="photo-preview-status" role="status"></small></div></section>`,
  );
  loadOwnPhotos();
  $("#choose-photo").onclick = () => $("#photo").click();
  let selectedURL;
  $("#photo").addEventListener("change", () => {
    const file = $("#photo").files[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      error("Choose a JPG, PNG or WebP photo up to 5 MB.");
      $("#photo").value = "";
      return;
    }
    if (selectedURL) URL.revokeObjectURL(selectedURL);
    selectedURL = URL.createObjectURL(file);
    $("#profile-photo-preview").src = selectedURL;
    $("#profile-photo-preview").hidden = false;
    $("#photo-initial")?.remove();
    $("#photo-preview-status").textContent =
      "Photo selected. Save your profile to publish it.";
  });
  profileWizard(form);
}
function profileWizard(form) {
  const sections = [...form.querySelectorAll(":scope > section.panel")],
    labels = [
      "About you",
      "Experience",
      "Availability",
      "Documents",
      "Contact",
    ];
  let index = 0;
  form.noValidate = true;
  form.insertAdjacentHTML(
    "afterbegin",
    '<nav class="profile-wizard" aria-label="Profile sections"><ol class="stepper" id="profile-steps"></ol></nav>',
  );
  const footer = form.querySelector(".form-footer");
  footer.insertAdjacentHTML(
    "beforebegin",
    '<div class="wizard-actions" id="profile-navigation"><button type="button" id="profile-back">Back</button><small id="profile-progress" aria-live="polite"></small><button type="button" class="primary" id="profile-next">Continue →</button></div>',
  );
  function show(focus = false) {
    sections.forEach((s, i) => {
      s.hidden = i !== index;
      s.classList.add("wizard-panel");
    });
    $("#profile-steps").innerHTML = labels
      .map(
        (l, i) =>
          `<li class="${i === index ? "current" : i < index ? "done" : ""}" ${i === index ? 'aria-current="step"' : ""}><button type="button" data-profile-step="${i}" aria-label="${l}"><span>${i + 1}</span>${l}</button></li>`,
      )
      .join("");
    $$("[data-profile-step]").forEach(
      (b) =>
        (b.onclick = () => {
          index = Number(b.dataset.profileStep);
          show(true);
        }),
    );
    $("#profile-progress").textContent =
      `Step ${index + 1} of ${sections.length}`;
    $("#profile-back").hidden = index === 0;
    $("#profile-next").hidden = index === sections.length - 1;
    footer.hidden = index !== sections.length - 1;
    if (focus) {
      const h = sections[index].querySelector("h2");
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
      h.scrollIntoView({ block: "center" });
    }
  }
  const invalid = (s) =>
    [...s.querySelectorAll("input,select,textarea")].find(
      (x) => !x.disabled && !x.closest("[hidden]") && !x.checkValidity(),
    );
  $("#profile-next").onclick = () => {
    const bad = invalid(sections[index]);
    if (bad) {
      bad.reportValidity();
      return;
    }
    index++;
    show(true);
  };
  $("#profile-back").onclick = () => {
    index--;
    show(true);
  };
  // Validate every section before the existing save handler can send the form.
  form.addEventListener(
    "submit",
    (e) => {
      for (let i = 0; i < sections.length; i++) {
        const wasHidden = sections[i].hidden;
        sections[i].hidden = false;
        const bad = invalid(sections[i]);
        sections[i].hidden = wasHidden;
        if (bad) {
          e.preventDefault();
          e.stopImmediatePropagation();
          index = i;
          show(true);
          bad.reportValidity();
          return;
        }
      }
    },
    true,
  );
  show();
}
async function formattedTerms(employer) {
  const role = employer ? "employer" : "crew";
  const [indexResponse, contentResponse] = await Promise.all([
    fetch("/legal/index.json"),
    fetch(`/legal/${role}.html`),
  ]);
  if (!indexResponse.ok || !contentResponse.ok)
    throw new Error("Terms could not be loaded. Please try again.");
  const info = (await indexResponse.json())[role],
    content = await contentResponse.text();
  document.querySelector("main.legal").innerHTML =
    `<div class="eyebrow">NCA Daywork App · Terms of use</div><h1>${esc(info.title)}</h1><nav class="legal-tabs" aria-label="Choose terms"><a class="btn ${employer ? "" : "active"}" href="/terms.html?role=jobseeker" ${!employer ? 'aria-current="page"' : ""}>Crew members</a><a class="btn ${employer ? "active" : ""}" href="/terms.html?role=employer" ${employer ? 'aria-current="page"' : ""}>Employers & captains</a></nav><div class="alert">Draft legal details remain in brackets pending NCA’s final information.</div><div class="legal-layout"><nav class="legal-contents" aria-label="Contents"><h2>On this page</h2>${info.sections.map((s) => `<a href="#${s.id}">${esc(s.title)}</a>`).join("")}</nav><article class="legal-document">${content}</article></div>`;
}
async function notificationsPage() {
  const notices = await api("/portal/notifications");
  shell(
    heading(
      "Your NCA updates.",
      "Introductions, availability reminders and account updates, all in one place.",
    ) +
      `<div class="notification-page">${notices.length ? notices.map((n) => `<article class="panel notification-card ${n.read ? "" : "unread"}"><div class="panel-heading"><h3>${n.kind === "preselection" ? "You’ve been preselected" : n.kind === "availability-reminder" ? "Keep your profile active" : n.kind === "inactive" ? "Availability update" : "NCA update"}</h3>${n.read ? "" : badge("New")}</div><p>${esc(n.message)}</p><small>${date(n.createdAt)}</small><div class="actions">${n.kind === "preselection" ? '<a class="btn" href="/jobseeker-applications.html">View your introductions</a>' : n.kind === "availability-reminder" || n.kind === "inactive" ? '<a class="btn" href="/crew-profile.html">Update my profile</a>' : ""}${n.read ? "" : `<button type="button" class="quiet" data-read="${n._id}">Mark as read</button>`}</div></article>`).join("") : empty("You’re all caught up", "Your notifications will appear here when there is something new.")}</div>`,
  );
  $$("[data-read]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await api(`/portal/notifications/${b.dataset.read}`, {
            method: "PATCH",
          });
          await notificationsPage();
        } catch (e) {
          error(e.message);
        }
      }),
  );
}
function pendingEmployer() {
  shell(
    heading("Your vessel account.", "A clear start to your next hire.") +
      `<section class="panel onboarding-status"><div class="dept">${icon("shield")}</div><h2>${me.employerApproval === "rejected" ? "Your account needs NCA’s attention" : "Your vessel is awaiting approval"}</h2><p>${me.employerApproval === "rejected" ? "NCA has not approved this vessel account. Contact the team if you need help." : "NCA will review your vessel name and call sign or MMSI. You can post jobs and contact crew after approval."}</p><div class="actions" style="justify-content:center"><a class="btn" href="/change-password.html">Review vessel details</a><a class="btn primary" href="/report-issue.html">Contact NCA</a></div></section>`,
  );
}
async function adminApprovals() {
  if (!me.isStaff) {
    shell(
      heading(
        "NCA staff only.",
        "This page is available to authorized NCA staff.",
      ),
    );
    return;
  }
  const data = await api("/admin/employers");
  shell(
    heading(
      "Employer approvals.",
      "Review vessel identity and decide who can hire through NCA.",
    ) +
      `<section class="panel"><h2>How employers join</h2><div class="approval-controls">${select(
        "approval-mode",
        "Approval mode",
        [
          ["auto", "Automatic approval — enabled now"],
          ["manual", "Manual NCA review"],
        ],
        data.mode,
      )}<p class="approval-note">Automatic mode approves new employer accounts after email verification. Manual mode sends new accounts for review. Existing decisions are preserved; you can change them below.</p></div><div id="mode-confirmation" hidden class="alert">New employers will need NCA approval before posting jobs or contacting crew. <button type="button" id="confirm-manual" class="primary">Enable manual review</button><button type="button" id="cancel-manual">Cancel</button></div></section><div class="filters">${select("approval-filter", "Show accounts", ["all", "pending", "approved", "rejected"], "all")}</div><div id="approval-list"></div>`,
  );
  const render = () => {
    const status = $("#approval-filter").value;
    const users = data.employers.filter(
      (u) => status === "all" || u.approvalStatus === status,
    );
    $("#approval-list").innerHTML = users.length
      ? users
          .map(
            (u) =>
              `<article class="panel approval-card"><div class="panel-heading"><h2>${esc(u.vessel?.name || "Vessel details missing")}</h2>${badge(u.approvalStatus)}</div><dl class="review-grid">${[
                ["Account holder", u.name],
                ["Email", u.email],
                ["Phone", u.phone],
                ["Call sign", u.vessel?.callSign],
                ["MMSI", u.vessel?.mmsi],
                ["IMO", u.vessel?.imo],
              ]
                .map(
                  ([k, v]) =>
                    `<div><dt>${k}</dt><dd>${esc(v || "Not provided")}</dd></div>`,
                )
                .join(
                  "",
                )}</dl><p class="small">Email ${u.emailVerified ? "verified" : "not yet verified"} · Decision: ${esc(u.employerApproval?.source || "legacy account")}</p><div class="actions"><button class="primary" data-decision="approved" data-user="${u._id}" ${u.approvalStatus === "approved" ? "disabled" : ""}>Approve employer</button><button data-decision="pending" data-user="${u._id}" ${u.approvalStatus === "pending" ? "disabled" : ""}>Keep pending</button><button class="danger" data-decision="rejected" data-user="${u._id}" ${u.approvalStatus === "rejected" ? "disabled" : ""}>Reject</button></div></article>`,
          )
          .join("")
      : empty(
          "No accounts in this group",
          "Choose another status to review employer accounts.",
        );
    $$("[data-decision]").forEach(
      (b) =>
        (b.onclick = async () => {
          b.disabled = true;
          try {
            await api(`/admin/employers/${b.dataset.user}`, {
              method: "PATCH",
              body: { status: b.dataset.decision },
            });
            await adminApprovals();
            toast("Employer decision saved.");
          } catch (e) {
            error(e.message);
            b.disabled = false;
          }
        }),
    );
  };
  render();
  $("#approval-filter").onchange = render;
  const saveMode = async (mode) => {
    try {
      await api("/admin/approval-mode", { method: "PATCH", body: { mode } });
      await adminApprovals();
      toast("Approval mode updated.");
    } catch (e) {
      error(e.message);
    }
  };
  $("#approval-mode").onchange = () => {
    if ($("#approval-mode").value === "manual")
      $("#mode-confirmation").hidden = false;
    else saveMode("auto");
  };
  $("#confirm-manual").onclick = () => saveMode("manual");
  $("#cancel-manual").onclick = () => {
    $("#approval-mode").value = data.mode;
    $("#mode-confirmation").hidden = true;
  };
}
