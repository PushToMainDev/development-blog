(function () {
  "use strict";

  const config = window.BOARD_CONFIG || {};

  const STATUSES = [
    { id: "todo", label: "To Do" },
    { id: "in_progress", label: "In Progress" },
    { id: "blocked", label: "Blocked" },
    { id: "done", label: "Done" },
  ];
  const STATUS_LABELS = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]));
  const FILTER_STORAGE_KEY = "board-filters";

  // Decorative session typed out on the sign-in screen.
  const TERMINAL_LINES = [
    "$ board status --sprint current",
    "  ▸ KK-12  Recipe import       in progress   8 pts",
    "  ▸ KK-14  Allergen filters    blocked       5 pts",
    "  ✓ KK-9   Cookbook sharing    done         13 pts",
    "$ git push origin main",
    "  ✓ shipped. 21 of 26 pts done this sprint",
    "$ board login",
  ];

  // Public projects come from _products at build time; private ones live only in Supabase.
  const publicProjects = (config.projects || []).map((p) => ({ ...p, isPrivate: false }));

  const state = {
    tickets: [],
    members: [],
    privateProjects: [],
    filters: readFilters(),
    signedIn: false,
    // The ticket open in the dialog: its id (null for a new one) and its parent's id.
    editingId: null,
    editingParentId: null,
    dirty: false,
  };

  const $ = (selector) => document.querySelector(selector);

  const ui = {
    setup: $("#board-setup"),
    auth: $("#board-auth"),
    login: $("#board-login"),
    loginError: $("#login-error"),
    app: $("#board-app"),
    session: $("#board-session"),
    sessionEmail: $("#board-session-email"),
    signOut: $("#board-sign-out"),
    filterProject: $("#board-filter-project"),
    filterAssignee: $("#board-filter-assignee"),
    boardError: $("#board-error"),
    columns: $("#board-columns"),
    stats: $("#board-stats"),
    terminal: $("#dev-terminal"),
    newTicket: $("#board-new"),
    openPeople: $("#board-people"),

    ticketDialog: $("#ticket-dialog"),
    ticketForm: $("#ticket-form"),
    ticketKey: $("#ticket-dialog-key"),
    parentLink: $("#ticket-parent-link"),
    blockedField: $("#ticket-blocked-field"),
    subtasks: $("#ticket-subtasks"),
    subtasksSummary: $("#ticket-subtasks-summary"),
    subtasksHint: $("#ticket-subtasks-hint"),
    pointsRollup: $("#ticket-points-rollup"),
    subtaskList: $("#subtask-list"),
    subtaskAdd: $("#subtask-add"),
    subtaskTitle: $("#subtask-new-title"),
    subtaskPoints: $("#subtask-new-points"),
    subtaskAddButton: $("#subtask-add-button"),
    ticketError: $("#ticket-error"),
    ticketDelete: $("#ticket-delete"),

    peopleDialog: $("#people-dialog"),
    peopleList: $("#people-list"),
    peopleForm: $("#people-form"),
    peopleError: $("#people-error"),

    openProjects: $("#board-projects"),
    projectsDialog: $("#projects-dialog"),
    projectsList: $("#projects-list"),
    projectsForm: $("#projects-form"),
    projectsError: $("#projects-error"),

    openImport: $("#board-import"),
    importDialog: $("#import-dialog"),
    importText: $("#import-text"),
    importFile: $("#import-file"),
    importDefaultProject: $("#import-default-project"),
    importPreview: $("#import-preview"),
    importError: $("#import-error"),
    importCreate: $("#import-create"),
    importCopyPrompt: $("#import-copy-prompt"),
    importCopyStatus: $("#import-copy-status"),
  };

  if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) {
    ui.setup.hidden = false;
    return;
  }

  const db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);


  /* Helpers */

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs || {})) {
      if (value == null || value === false) continue;
      if (key === "class") node.className = value;
      else if (key === "dataset") Object.assign(node.dataset, value);
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : value);
    }

    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      node.append(child instanceof Node ? child : String(child));
    }

    return node;
  }

  function option(value, label, selected) {
    return el("option", { value, selected: selected || null }, label);
  }

  function readFilters() {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY));
      if (saved && typeof saved === "object") return { project: "all", assignee: "all", ...saved };
    } catch (e) { /* storage unavailable */ }
    return { project: "all", assignee: "all" };
  }

  function saveFilters() {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state.filters));
    } catch (e) { /* storage unavailable */ }
  }

  function showError(target, error) {
    if (!error) {
      target.hidden = true;
      target.textContent = "";
      return;
    }

    let message = error.message || String(error);
    if (error.code === "42501") {
      message += " — is your email listed in the board_users table?";
    }
    target.textContent = message;
    target.hidden = false;
  }

  // Runs a Supabase query and reports any error. Resolves to the data, or null on failure.
  async function run(query, errorTarget) {
    const { data, error } = await query;
    showError(errorTarget || ui.boardError, error);
    return error ? null : (data ?? true);
  }

  function findTicket(id) {
    return state.tickets.find((t) => t.id === id) || null;
  }

  function subtasksOf(ticket) {
    return state.tickets.filter((t) => t.parent_id === ticket.id);
  }

  function allProjects() {
    return [...publicProjects, ...state.privateProjects];
  }

  function findProject(id) {
    return allProjects().find((p) => p.id === id) || null;
  }

  function projectTitle(id) {
    const project = findProject(id);
    if (!project) return id;
    return project.isPrivate ? `🔒 ${project.title}` : project.title;
  }

  // Options for a project <select>, grouped once there are private projects.
  function projectChoices(selected) {
    const toOption = (p) => option(p.id, projectTitle(p.id), p.id === selected);
    if (!state.privateProjects.length) return publicProjects.map(toOption);

    return [
      el("optgroup", { label: "Public" }, publicProjects.map(toOption)),
      el("optgroup", { label: "Private" }, state.privateProjects.map(toOption)),
    ];
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function projectPrefix(id) {
    const parts = String(id).split("-").filter(Boolean);
    const prefix = parts.length > 1 ? parts.map((p) => p[0]).join("") : String(id).slice(0, 3);
    return prefix.toUpperCase();
  }

  function ticketKey(ticket) {
    return `${projectPrefix(ticket.project)}-${ticket.id}`;
  }

  function memberName(id) {
    return state.members.find((m) => m.id === id)?.name || null;
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  function points(value) {
    return Math.max(0, Number(value) || 0);
  }

  function formatPoints(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  // A task's total is its own estimate plus the estimates of all its subtasks.
  function pointsFor(ticket, ownOverride) {
    const subs = subtasksOf(ticket);
    const own = ownOverride ?? points(ticket.story_points);
    const fromSubtasks = subs.reduce((sum, s) => sum + points(s.story_points), 0);
    const done = subs.filter((s) => s.status === "done").reduce((sum, s) => sum + points(s.story_points), 0);
    return { own, fromSubtasks, done, total: own + fromSubtasks, count: subs.length };
  }

  function pointsTitle(p) {
    if (!p.count) return `${formatPoints(p.total)} story points`;
    return `${formatPoints(p.own)} on this ticket + ${formatPoints(p.fromSubtasks)} from subtasks`;
  }

  function avatar(name) {
    return name
      ? el("span", { class: "avatar", title: name }, initials(name))
      : el("span", { class: "avatar is-empty", title: "Unassigned" }, "?");
  }

  function defaultProject() {
    if (state.filters.project !== "all") return state.filters.project;
    return allProjects()[0]?.id || "general";
  }

  function plural(n, word) {
    return `${n} ${word}${n === 1 ? "" : "s"}`;
  }


  /* Data */

  async function load() {
    const [tickets, members, privateProjects] = await Promise.all([
      db.from("tickets").select("*").order("id"),
      db.from("ticket_members").select("*").order("name"),
      db.from("board_projects").select("*").order("title"),
    ]);

    const error = tickets.error || members.error;
    showError(ui.boardError, error);
    if (error) return;

    state.tickets = tickets.data;
    state.members = members.data;
    // A missing board_projects table only disables private projects; the rest of the board still works.
    state.privateProjects = (privateProjects.data || []).map((p) => ({ ...p, isPrivate: true }));
    if (privateProjects.error) {
      showError(ui.boardError, { message: `Private projects unavailable: ${privateProjects.error.message}. Run _supabase/board.sql again to add them.` });
    }
    render();
  }

  // Marking a task done also closes its subtasks, after asking. Resolves to false if the user backs out.
  async function closeOpenSubtasks(ticket, errorTarget) {
    const open = subtasksOf(ticket).filter((s) => s.status !== "done");
    if (!open.length) return true;

    const question = open.length === 1
      ? `${ticketKey(ticket)} still has 1 open subtask. Mark it done too?`
      : `${ticketKey(ticket)} still has ${open.length} open subtasks. Mark them done too?`;
    if (!window.confirm(question)) return false;

    const ok = await run(
      db.from("tickets").update({ status: "done", blocked_reason: "" }).in("id", open.map((s) => s.id)),
      errorTarget
    );
    return Boolean(ok);
  }

  async function changeStatus(ticket, status, errorTarget) {
    if (status === "done" && !(await closeOpenSubtasks(ticket, errorTarget))) return false;

    const patch = { status };
    if (status !== "blocked") patch.blocked_reason = "";

    const ok = await run(db.from("tickets").update(patch).eq("id", ticket.id), errorTarget);
    await load();
    return Boolean(ok);
  }


  /* Sign-in terminal */

  let terminalStarted = false;

  function terminalLine(text) {
    let tone = "";
    if (text.startsWith("$")) tone = "is-cmd";
    else if (text.includes("blocked")) tone = "is-bad";
    else if (text.trim().startsWith("✓")) tone = "is-ok";
    return el("span", { class: tone }, text + "\n");
  }

  // Commands type out a character at a time; their output appears a line at a time.
  function startTerminal() {
    if (!ui.terminal || terminalStarted) return;
    terminalStarted = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      ui.terminal.replaceChildren(...TERMINAL_LINES.map(terminalLine));
      return;
    }

    const shown = [];
    let line = 0;
    let char = 0;

    (function tick() {
      if (line >= TERMINAL_LINES.length) return;
      const text = TERMINAL_LINES[line];

      if (text.startsWith("$") && char < text.length) {
        char += 1;
        ui.terminal.replaceChildren(...shown, el("span", { class: "is-cmd" }, text.slice(0, char)));
        setTimeout(tick, 40 + Math.random() * 50);
        return;
      }

      shown.push(terminalLine(text));
      ui.terminal.replaceChildren(...shown);
      line += 1;
      char = 0;
      setTimeout(tick, text.startsWith("$") ? 420 : 160);
    })();
  }


  /* Board */

  function visibleTasks() {
    const { project, assignee } = state.filters;
    const wanted = assignee === "none" ? null : Number(assignee);

    return state.tickets
      .filter((t) => t.parent_id == null)
      .filter((t) => project === "all" || t.project === project)
      .filter((t) => assignee === "all" || [t, ...subtasksOf(t)].some((x) => (x.assignee_id ?? null) === wanted));
  }

  function renderFilters() {
    const knownProject = state.filters.project === "all" || findProject(state.filters.project);
    if (!knownProject) state.filters.project = "all";

    ui.filterProject.replaceChildren(
      option("all", "All projects", state.filters.project === "all"),
      ...projectChoices(state.filters.project)
    );

    const knownAssignee = ["all", "none"].includes(state.filters.assignee)
      || state.members.some((m) => String(m.id) === state.filters.assignee);
    if (!knownAssignee) state.filters.assignee = "all";

    ui.filterAssignee.replaceChildren(
      option("all", "Everyone", state.filters.assignee === "all"),
      option("none", "Unassigned", state.filters.assignee === "none"),
      ...state.members.map((m) => option(String(m.id), m.name, state.filters.assignee === String(m.id)))
    );
  }

  function renderCard(ticket) {
    const p = pointsFor(ticket);
    const subs = subtasksOf(ticket);
    const doneCount = subs.filter((s) => s.status === "done").length;
    const blockedCount = subs.filter((s) => s.status === "blocked").length;
    const name = memberName(ticket.assignee_id);

    return el("article",
      {
        class: "ticket-card",
        draggable: "true",
        tabindex: "0",
        "aria-label": `${ticketKey(ticket)}: ${ticket.title}`,
        onclick: () => openTicket(ticket.id),
        onkeydown: (e) => { if (e.key === "Enter") openTicket(ticket.id); },
        ondragstart: (e) => {
          e.dataTransfer.setData("text/plain", String(ticket.id));
          e.dataTransfer.effectAllowed = "move";
          e.currentTarget.classList.add("is-dragging");
        },
        ondragend: (e) => e.currentTarget.classList.remove("is-dragging"),
      },
      el("div", { class: "ticket-card-top" },
        el("span", { class: "ticket-key" }, ticketKey(ticket)),
        el("span", { class: "ticket-points", title: pointsTitle(p) }, formatPoints(p.total))
      ),
      el("h3", {}, ticket.title),
      state.filters.project === "all" ? el("p", { class: "ticket-project" }, projectTitle(ticket.project)) : null,
      ticket.status === "blocked" && ticket.blocked_reason
        ? el("p", { class: "ticket-blocked-reason" }, ticket.blocked_reason)
        : null,
      subs.length
        ? el("div", { class: "ticket-progress", title: `${doneCount} of ${subs.length} subtasks done` },
            el("span", { style: `width: ${Math.round((doneCount / subs.length) * 100)}%` }))
        : null,
      el("div", { class: "ticket-card-meta" },
        el("span", { class: "ticket-assignee" }, avatar(name), name || "Unassigned"),
        subs.length ? el("span", {}, `${doneCount}/${subs.length} subtasks`) : null,
        blockedCount ? el("span", { class: "ticket-flag" }, `${blockedCount} blocked`) : null
      )
    );
  }

  function renderColumn(status, tasks) {
    const items = tasks.filter((t) => t.status === status.id);
    const total = items.reduce((sum, t) => sum + pointsFor(t).total, 0);

    const column = el("section",
      { class: `board-column is-${status.id.replace("_", "-")}`, "aria-label": status.label },
      el("header", { class: "board-column-head" },
        el("h2", {}, status.label),
        el("span", { class: "board-column-count" }, `${items.length} · ${formatPoints(total)} pts`)
      ),
      el("div", { class: "board-column-list" },
        items.length ? items.map(renderCard) : el("p", { class: "board-column-empty" }, "Nothing here")
      )
    );

    column.addEventListener("dragover", (e) => {
      e.preventDefault();
      column.classList.add("is-drop-target");
    });
    column.addEventListener("dragleave", (e) => {
      if (!column.contains(e.relatedTarget)) column.classList.remove("is-drop-target");
    });
    column.addEventListener("drop", async (e) => {
      e.preventDefault();
      column.classList.remove("is-drop-target");

      const ticket = findTicket(Number(e.dataTransfer.getData("text/plain")));
      if (!ticket || ticket.status === status.id) return;

      const ok = await changeStatus(ticket, status.id);
      // Moving a card to Blocked opens it so the reason can be written down.
      if (ok && status.id === "blocked") openTicket(ticket.id, { focus: "blocked_reason" });
    });

    return column;
  }

  function stat(label, value, tone) {
    return el("div", { class: `board-stat ${tone || ""}` },
      el("span", { class: "board-stat-label" }, label),
      el("strong", {}, value)
    );
  }

  function renderStats(tasks) {
    const everything = tasks.flatMap((t) => [t, ...subtasksOf(t)]);
    const blocked = everything.filter((t) => t.status === "blocked").length;
    const total = everything.reduce((sum, t) => sum + points(t.story_points), 0);
    const done = everything.filter((t) => t.status === "done").reduce((sum, t) => sum + points(t.story_points), 0);
    const percent = total ? Math.round((done / total) * 100) : 0;

    ui.stats.replaceChildren(
      stat("Open", tasks.filter((t) => t.status !== "done").length),
      stat("In progress", tasks.filter((t) => t.status === "in_progress").length, "is-progress"),
      stat("Blocked", blocked, blocked ? "is-blocked" : ""),
      el("div", { class: "board-stat is-points" },
        el("span", { class: "board-stat-label" }, `Points shipped · ${percent}%`),
        el("strong", {}, formatPoints(done), el("small", {}, ` / ${formatPoints(total)}`)),
        el("div", { class: "board-stat-bar" }, el("span", { style: `width: ${percent}%` }))
      )
    );
  }

  function render() {
    renderFilters();
    const tasks = visibleTasks();
    renderStats(tasks);
    ui.columns.replaceChildren(...STATUSES.map((status) => renderColumn(status, tasks)));

    if (ui.ticketDialog.open) renderSubtasks();
    if (ui.peopleDialog.open) renderPeople();
    if (ui.projectsDialog.open) renderProjects();
  }


  /* Ticket dialog */

  const form = ui.ticketForm;

  function editingTicket() {
    return state.editingId == null ? null : findTicket(state.editingId);
  }

  function editingParent() {
    return state.editingParentId == null ? null : findTicket(state.editingParentId);
  }

  function confirmDiscard() {
    return !state.dirty || window.confirm("Discard your unsaved changes?");
  }

  function fillSelect(select, options, value) {
    select.replaceChildren(...options.map(([v, label]) => option(v, label, String(v) === String(value))));
  }

  function renderTicketDialog(ticket, parent) {
    state.editingId = ticket ? ticket.id : null;
    state.editingParentId = parent ? parent.id : null;
    state.dirty = false;

    const draft = ticket || {
      title: "",
      description: "",
      status: "todo",
      blocked_reason: "",
      assignee_id: null,
      story_points: 0,
      project: parent ? parent.project : defaultProject(),
    };

    ui.ticketKey.textContent = ticket
      ? `${parent ? "Subtask" : "Task"} ${ticketKey(ticket)}`
      : parent ? "New subtask" : "New ticket";

    ui.parentLink.hidden = !parent;
    if (parent) ui.parentLink.textContent = `← Subtask of ${ticketKey(parent)}: ${parent.title}`;

    form.elements.project.replaceChildren(
      ...projectChoices(draft.project),
      findProject(draft.project) ? null : option(draft.project, draft.project, true)
    );
    form.elements.project.disabled = Boolean(parent);

    fillSelect(form.elements.status, STATUSES.map((s) => [s.id, s.label]), draft.status);
    fillSelect(
      form.elements.assignee_id,
      [["", "Unassigned"], ...state.members.map((m) => [m.id, m.name])],
      draft.assignee_id ?? ""
    );

    form.elements.title.value = draft.title;
    form.elements.description.value = draft.description;
    form.elements.blocked_reason.value = draft.blocked_reason;
    form.elements.story_points.value = formatPoints(points(draft.story_points));

    ui.blockedField.hidden = draft.status !== "blocked";
    ui.ticketDelete.hidden = !ticket;
    ui.subtaskTitle.value = "";
    ui.subtaskPoints.value = "";
    showError(ui.ticketError, null);

    renderSubtasks();
  }

  function renderSubtasks() {
    const ticket = editingTicket();
    const isSubtask = state.editingParentId != null;

    ui.subtasks.hidden = isSubtask;
    if (isSubtask) return;

    ui.subtasksHint.hidden = Boolean(ticket);
    ui.subtaskAdd.hidden = !ticket;

    if (!ticket) {
      ui.subtaskList.replaceChildren();
      ui.subtasksSummary.textContent = "";
      ui.pointsRollup.hidden = true;
      return;
    }

    const subs = subtasksOf(ticket);
    const doneCount = subs.filter((s) => s.status === "done").length;
    ui.subtasksSummary.textContent = subs.length ? `${doneCount} of ${subs.length} done` : "";

    renderRollup();

    ui.subtaskList.replaceChildren(...subs.map((sub) => {
      const name = memberName(sub.assignee_id);
      const status = el("select",
        {
          class: "board-mini-select",
          "aria-label": `Status of ${ticketKey(sub)}`,
          onchange: (e) => changeStatus(sub, e.target.value, ui.ticketError),
        },
        STATUSES.map((s) => option(s.id, s.label, s.id === sub.status))
      );

      return el("li", { class: `subtask-row is-${sub.status.replace("_", "-")}` },
        status,
        el("button",
          { type: "button", class: "subtask-title", onclick: () => openTicket(sub.id) },
          el("span", { class: "ticket-key" }, ticketKey(sub)),
          sub.title
        ),
        avatar(name),
        el("span", { class: "ticket-points", title: "Story points" }, formatPoints(points(sub.story_points)))
      );
    }));
  }

  // Uses the points typed into the form, so the total updates before saving.
  function renderRollup() {
    const ticket = editingTicket();
    if (!ticket) return;

    const p = pointsFor(ticket, points(form.elements.story_points.value));
    ui.pointsRollup.hidden = false;
    ui.pointsRollup.replaceChildren(
      el("strong", {}, `${formatPoints(p.total)} pts total`),
      p.count
        ? ` = ${formatPoints(p.own)} on this task + ${formatPoints(p.fromSubtasks)} from ${plural(p.count, "subtask")}`
          + ` (${formatPoints(p.done)} pts done)`
        : " — subtask points will be added to this total."
    );
  }

  function openDialog(focus) {
    if (!ui.ticketDialog.open) ui.ticketDialog.showModal();
    const field = form.elements[focus || "title"];
    if (field) field.focus();
  }

  function openTicket(id, options) {
    const ticket = findTicket(id);
    if (!ticket) return;
    if (ui.ticketDialog.open && !confirmDiscard()) return;

    renderTicketDialog(ticket, findTicket(ticket.parent_id));
    openDialog(options?.focus);
  }

  function newTicket() {
    if (ui.ticketDialog.open && !confirmDiscard()) return;
    renderTicketDialog(null, null);
    openDialog();
  }

  function closeTicketDialog() {
    if (!confirmDiscard()) return;
    state.dirty = false;

    // Closing a subtask goes back to its parent.
    const parent = editingParent();
    if (parent && state.editingId != null) {
      renderTicketDialog(parent, null);
      return;
    }
    ui.ticketDialog.close();
  }

  async function saveTicket(e) {
    e.preventDefault();

    const ticket = editingTicket();
    const parent = editingParent();
    const fields = form.elements;
    const title = fields.title.value.trim();

    if (!title) {
      showError(ui.ticketError, "Give the ticket a title.");
      fields.title.focus();
      return;
    }

    const status = fields.status.value;
    const payload = {
      title,
      description: fields.description.value.trim(),
      status,
      blocked_reason: status === "blocked" ? fields.blocked_reason.value.trim() : "",
      assignee_id: fields.assignee_id.value ? Number(fields.assignee_id.value) : null,
      story_points: points(fields.story_points.value),
      project: parent ? parent.project : fields.project.value,
    };

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;

    try {
      if (ticket) {
        if (status === "done" && ticket.status !== "done" && !(await closeOpenSubtasks(ticket, ui.ticketError))) return;
        if (!(await run(db.from("tickets").update(payload).eq("id", ticket.id), ui.ticketError))) return;
      } else {
        payload.parent_id = parent ? parent.id : null;
        const created = await run(db.from("tickets").insert(payload).select().single(), ui.ticketError);
        if (!created) return;
        state.editingId = created.id;
      }

      state.dirty = false;
      await load();

      if (parent) {
        renderTicketDialog(findTicket(parent.id), null);
      } else if (!ticket) {
        // Keep a newly created task open so subtasks can be added straight away.
        renderTicketDialog(findTicket(state.editingId), null);
        ui.subtaskTitle.focus();
      } else {
        ui.ticketDialog.close();
      }
    } finally {
      submit.disabled = false;
    }
  }

  async function deleteTicket() {
    const ticket = editingTicket();
    if (!ticket) return;

    const count = subtasksOf(ticket).length;
    const extra = count ? ` and its ${plural(count, "subtask")}` : "";
    if (!window.confirm(`Delete ${ticketKey(ticket)}${extra}? This can't be undone.`)) return;

    if (!(await run(db.from("tickets").delete().eq("id", ticket.id), ui.ticketError))) return;

    const parent = editingParent();
    state.dirty = false;
    await load();

    if (parent) renderTicketDialog(findTicket(parent.id), null);
    else ui.ticketDialog.close();
  }

  async function addSubtask() {
    const parent = editingTicket();
    const title = ui.subtaskTitle.value.trim();
    if (!parent || !title) {
      ui.subtaskTitle.focus();
      return;
    }

    ui.subtaskAddButton.disabled = true;
    const created = await run(
      db.from("tickets").insert({
        title,
        parent_id: parent.id,
        project: parent.project,
        story_points: points(ui.subtaskPoints.value),
      }),
      ui.ticketError
    );
    ui.subtaskAddButton.disabled = false;
    if (!created) return;

    ui.subtaskTitle.value = "";
    ui.subtaskPoints.value = "";
    await load();
    ui.subtaskTitle.focus();
  }


  /* People dialog */

  function renderPeople() {
    const assignedCount = (id) => state.tickets.filter((t) => t.assignee_id === id).length;

    ui.peopleList.replaceChildren(
      ...(state.members.length
        ? state.members.map((m) => {
            const count = assignedCount(m.id);
            return el("li", { class: "people-row" },
              avatar(m.name),
              el("span", { class: "people-name" }, m.name),
              el("span", { class: "people-count" }, plural(count, "ticket")),
              el("button", { type: "button", class: "board-button is-link is-danger", onclick: () => removePerson(m, count) }, "Remove")
            );
          })
        : [el("li", { class: "board-hint" }, "No one yet. Add the people you assign work to.")])
    );
  }

  async function addPerson(e) {
    e.preventDefault();
    const input = ui.peopleForm.elements.name;
    const name = input.value.trim();
    if (!name) return;

    if (!(await run(db.from("ticket_members").insert({ name }), ui.peopleError))) return;
    input.value = "";
    await load();
    input.focus();
  }

  async function removePerson(member, count) {
    const extra = count ? ` Their ${plural(count, "ticket")} will become unassigned.` : "";
    if (!window.confirm(`Remove ${member.name}?${extra}`)) return;

    if (!(await run(db.from("ticket_members").delete().eq("id", member.id), ui.peopleError))) return;
    await load();
  }


  /* Private projects dialog */

  function renderProjects() {
    const ticketCount = (id) => state.tickets.filter((t) => t.project === id).length;

    ui.projectsList.replaceChildren(
      ...(state.privateProjects.length
        ? state.privateProjects.map((p) => {
            const count = ticketCount(p.id);
            return el("li", { class: "people-row" },
              el("span", { class: "avatar" }, "🔒"),
              el("span", { class: "people-name" }, p.title, el("small", { class: "project-key" }, `${projectPrefix(p.id)}-`)),
              el("span", { class: "people-count" }, plural(count, "ticket")),
              el("button", { type: "button", class: "board-button is-link is-danger", onclick: () => removeProject(p, count) }, "Remove")
            );
          })
        : [el("li", { class: "board-hint" }, "No private projects yet.")])
    );
  }

  async function addProject(e) {
    e.preventDefault();
    const input = ui.projectsForm.elements.title;
    const title = input.value.trim();
    const id = slugify(title);
    if (!title) return;

    if (!id) {
      showError(ui.projectsError, "Use at least one letter or number in the name.");
      return;
    }
    if (findProject(id)) {
      showError(ui.projectsError, `A project with the ID "${id}" already exists. Pick a different name.`);
      return;
    }

    if (!(await run(db.from("board_projects").insert({ id, title }), ui.projectsError))) return;
    input.value = "";
    await load();
    input.focus();
  }

  async function removeProject(project, count) {
    if (count) {
      showError(ui.projectsError, `${project.title} still has ${plural(count, "ticket")}. Move or delete them first.`);
      return;
    }
    if (!window.confirm(`Remove the private project ${project.title}?`)) return;

    if (!(await run(db.from("board_projects").delete().eq("id", project.id), ui.projectsError))) return;
    if (state.filters.project === project.id) {
      state.filters.project = "all";
      saveFilters();
    }
    await load();
  }


  /* Markdown import */

  // Field names accepted under a "## Task" or "### Subtask" heading.
  const IMPORT_FIELDS = {
    "project": "project",
    "status": "status",
    "points": "story_points",
    "story points": "story_points",
    "estimate": "story_points",
    "assignee": "assignee",
    "assigned to": "assignee",
    "owner": "assignee",
    "blocked": "blocked_reason",
    "blocked by": "blocked_reason",
    "blocker": "blocked_reason",
  };

  const IMPORT_STATUSES = {
    "todo": "todo",
    "to do": "todo",
    "backlog": "todo",
    "open": "todo",
    "in progress": "in_progress",
    "inprogress": "in_progress",
    "doing": "in_progress",
    "blocked": "blocked",
    "done": "done",
    "complete": "done",
    "completed": "done",
    "closed": "done",
  };

  // Reads the board's Markdown format into tasks with their subtasks, without checking values.
  function parseImport(text) {
    const lines = text.split(/\r?\n/);
    const tasks = [];
    const errors = [];

    // AI answers are often wrapped in a ```markdown fence; blank it out but keep line numbers.
    const filled = lines.map((l, i) => [l.trim(), i]).filter(([l]) => l);
    if (filled.length >= 2 && /^(```|~~~)/.test(filled[0][0]) && /^(```|~~~)\s*$/.test(filled[filled.length - 1][0])) {
      lines[filled[0][1]] = "";
      lines[filled[filled.length - 1][1]] = "";
    }

    let project = null;
    let current = null;
    let inFields = false;
    let inCode = false;

    lines.forEach((raw, index) => {
      const lineNo = index + 1;

      if (/^\s*(```|~~~)/.test(raw)) {
        inCode = !inCode;
        inFields = false;
        if (current) current.lines.push(raw);
        return;
      }

      const heading = inCode ? null : raw.match(/^(#{1,3})\s+(.*?)\s*#*\s*$/);
      if (heading) {
        const level = heading[1].length;
        const text = heading[2].replace(/\*\*|__|`/g, "").trim();
        inFields = false;

        if (level === 1) {
          const match = text.match(/^project\s*:\s*(.+)$/i);
          if (match) project = { value: match[1].trim(), line: lineNo };
          current = null;
          return;
        }

        const title = text.replace(/^(task|story|ticket|sub-?task)\s*[:\-–—]\s*/i, "").trim();
        if (!title) {
          errors.push(`Line ${lineNo}: heading has no title.`);
          current = null;
          return;
        }

        const item = { title, line: lineNo, project, fields: {}, lines: [], subtasks: [] };
        if (level === 2) {
          tasks.push(item);
        } else if (tasks.length) {
          tasks[tasks.length - 1].subtasks.push(item);
        } else {
          errors.push(`Line ${lineNo}: subtask "${title}" has no "## " task above it.`);
          current = null;
          return;
        }

        current = item;
        inFields = true;
        return;
      }

      if (!current) return;

      if (inFields) {
        if (!raw.trim()) return;
        const field = raw.replace(/\*\*|__/g, "").match(/^\s*[-*+]\s*([A-Za-z][A-Za-z -]*?)\s*:\s*(.*)$/);
        const key = field && IMPORT_FIELDS[field[1].toLowerCase()];
        if (key) {
          current.fields[key] = { value: field[2].trim(), line: lineNo };
          return;
        }
        inFields = false;
      }

      current.lines.push(raw);
    });

    return { tasks, errors };
  }

  function matchProject(ref) {
    const wanted = ref.replace(/🔒/g, "").trim().toLowerCase();
    return allProjects().find((p) =>
      p.id === wanted || p.title.toLowerCase() === wanted || p.id === slugify(wanted)
    ) || null;
  }

  // Checks the parsed tickets against the board's projects and people, ready to create.
  function resolveImport(text, fallbackProject) {
    const { tasks, errors } = parseImport(text);
    const warnings = [];
    const knownPeople = new Map(state.members.map((m) => [m.name.toLowerCase(), m.name]));
    const newPeople = new Map();

    function resolveItem(item) {
      const f = item.fields;
      const out = {
        title: item.title.slice(0, 200),
        description: item.lines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
        status: "todo",
        blocked_reason: "",
        story_points: 0,
        assignee: null,
        subtasks: [],
      };

      if (item.title.length > 200) warnings.push(`Line ${item.line}: title shortened to 200 characters.`);

      if (f.status) {
        const key = f.status.value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
        if (IMPORT_STATUSES[key]) out.status = IMPORT_STATUSES[key];
        else errors.push(`Line ${f.status.line}: unknown status "${f.status.value}". Use To Do, In Progress, Blocked or Done.`);
      }

      if (f.story_points) {
        const value = Number(f.story_points.value.replace(/\s*(pts?|points?)\.?$/i, ""));
        if (Number.isFinite(value) && value >= 0) out.story_points = Math.round(value * 10) / 10;
        else errors.push(`Line ${f.story_points.line}: points must be a number of 0 or more, not "${f.story_points.value}".`);
      }

      if (f.assignee) {
        const name = f.assignee.value.replace(/^@/, "").trim();
        if (name && !/^(none|unassigned|n\/a|-)$/i.test(name)) {
          const key = name.toLowerCase();
          if (!knownPeople.has(key) && !newPeople.has(key)) newPeople.set(key, name);
          out.assignee = knownPeople.get(key) || newPeople.get(key);
        }
      }

      if (f.blocked_reason) {
        if (!f.status) out.status = "blocked";
        if (out.status === "blocked") out.blocked_reason = f.blocked_reason.value;
      }

      return out;
    }

    const resolved = tasks.map((task) => {
      const out = resolveItem(task);
      const ref = task.fields.project || task.project;
      const project = ref ? matchProject(ref.value) : findProject(fallbackProject);

      if (project) out.project = project.id;
      else if (ref) errors.push(`Line ${ref.line}: no project called "${ref.value}". Use one of: ${allProjects().map((p) => p.id).join(", ")}.`);
      else errors.push(`Line ${task.line}: "${task.title}" has no project.`);

      out.subtasks = task.subtasks.map((sub) => {
        if (sub.fields.project) warnings.push(`Line ${sub.fields.project.line}: subtasks always use their task's project, so "Project" is ignored.`);
        return resolveItem(sub);
      });
      return out;
    });

    if (!tasks.length && !errors.length && text.trim()) {
      errors.push('No tickets found. Each task needs to start with a "## " heading.');
    }
    newPeople.forEach((name) => warnings.push(`${name} isn't in People yet and will be added.`));

    return { tasks: resolved, errors, warnings, newPeople: [...newPeople.values()] };
  }

  function importStatus(status) {
    return el("span", { class: `import-status is-${status.replace("_", "-")}` }, STATUS_LABELS[status]);
  }

  function renderImportPreview() {
    const text = ui.importText.value;
    showError(ui.importError, null);

    if (!text.trim()) {
      ui.importPreview.replaceChildren();
      ui.importCreate.disabled = true;
      ui.importCreate.textContent = "Create tickets";
      return null;
    }

    const plan = resolveImport(text, ui.importDefaultProject.value);
    const subtaskCount = plan.tasks.reduce((sum, t) => sum + t.subtasks.length, 0);
    const totalPoints = plan.tasks.reduce(
      (sum, t) => sum + t.story_points + t.subtasks.reduce((s, sub) => s + sub.story_points, 0), 0
    );

    const parts = [
      plan.errors.length
        ? el("ul", { class: "import-messages is-error" }, plan.errors.map((m) => el("li", {}, m)))
        : null,
      plan.warnings.length
        ? el("ul", { class: "import-messages" }, plan.warnings.map((m) => el("li", {}, m)))
        : null,
      plan.tasks.length
        ? el("p", { class: "import-summary" },
            `${plural(plan.tasks.length, "task")} · ${plural(subtaskCount, "subtask")} · ${formatPoints(totalPoints)} pts`)
        : null,
      plan.tasks.length
        ? el("ul", { class: "import-list" }, plan.tasks.map((task) => {
            const fromSubtasks = task.subtasks.reduce((sum, s) => sum + s.story_points, 0);
            const pointsNote = task.subtasks.length
              ? `${formatPoints(task.story_points)} own + ${formatPoints(fromSubtasks)} from subtasks`
              : null;

            return el("li", { class: "import-task" },
              el("div", { class: "import-row" },
                importStatus(task.status),
                el("strong", {}, task.title),
                el("span", { class: "ticket-points" }, formatPoints(task.story_points + fromSubtasks))
              ),
              el("p", { class: "import-meta" },
                [task.project ? projectTitle(task.project) : "No project", task.assignee || "Unassigned", pointsNote]
                  .filter(Boolean).join(" · ")
              ),
              task.subtasks.length
                ? el("ul", { class: "import-subtasks" }, task.subtasks.map((sub) =>
                    el("li", { class: "import-row" },
                      importStatus(sub.status),
                      el("span", {}, sub.title, sub.assignee ? el("small", {}, ` · ${sub.assignee}`) : null),
                      el("span", { class: "ticket-points" }, formatPoints(sub.story_points))
                    )))
                : null
            );
          }))
        : null,
    ];
    ui.importPreview.replaceChildren(...parts.filter(Boolean));

    const count = plan.tasks.length + subtaskCount;
    ui.importCreate.disabled = Boolean(plan.errors.length) || !count;
    ui.importCreate.textContent = count ? `Create ${plural(count, "ticket")}` : "Create tickets";
    return plan;
  }

  function aiPrompt() {
    const projectList = allProjects()
      .map((p) => `  - ${p.id} (${p.title}${p.isPrivate ? ", private" : ""})`)
      .join("\n");
    const peopleList = state.members.length
      ? state.members.map((m) => `  - ${m.name}`).join("\n")
      : "  - (no one yet; any names you use will be added)";

    return `Write tickets for my project board as a Markdown file. Use exactly this format:

# Project: <project-id>

## <Task title>
- Status: To Do
- Points: <number>
- Assignee: <person>

<Task description in Markdown: goal, details, acceptance criteria. Can be several paragraphs.>

### <Subtask title>
- Points: <number>
- Assignee: <person>

<Optional subtask description.>

Rules:
- "## " starts a task. "### " starts a subtask of the task above it. Subtasks cannot have their own subtasks.
- Put the "- Field: value" lines directly under each heading, before the description. All fields are optional.
- Status is one of: To Do, In Progress, Blocked, Done. It defaults to To Do.
- For a blocked ticket, add "- Blocked: <what it's waiting on>".
- Points are story points (0, 0.5, 1, 2, 3, 5, 8, 13). A task's total is its own points plus all its subtasks' points, so give a task its own points only for work its subtasks don't cover (often 0).
- "# Project: <project-id>" applies to every task below it until the next "# Project:" line.
- Projects (use the id):
${projectList}
- People:
${peopleList}
- Reply with only the Markdown, no other commentary.

Here's the work I need tickets for:
`;
  }

  async function copyPrompt() {
    const text = aiPrompt();
    let copied = false;

    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (e) {
      // Fall back for browsers that block the clipboard API.
      const area = el("textarea", { class: "sr-only" }, text);
      document.body.append(area);
      area.select();
      copied = document.execCommand("copy");
      area.remove();
    }

    ui.importCopyStatus.textContent = copied
      ? "Copied. Paste it into Claude or ChatGPT and add what you need."
      : "Couldn't copy. Your browser blocked the clipboard.";
  }

  async function loadImportFile(file) {
    if (!file) return;
    ui.importText.value = await file.text();
    renderImportPreview();
  }

  function openImport() {
    showError(ui.importError, null);
    ui.importCopyStatus.textContent = "";
    ui.importDefaultProject.replaceChildren(...projectChoices(defaultProject()));
    renderImportPreview();
    ui.importDialog.showModal();
    ui.importText.focus();
  }

  async function createImport() {
    const plan = renderImportPreview();
    if (!plan || plan.errors.length || !plan.tasks.length) return;

    const total = plan.tasks.reduce((sum, t) => sum + 1 + t.subtasks.length, 0);
    let created = 0;
    ui.importCreate.disabled = true;
    ui.importCreate.textContent = "Creating…";

    const fail = async () => {
      await load();
      const message = ui.importError.textContent;
      showError(ui.importError, created
        ? `Created ${created} of ${total} tickets, then hit an error: ${message} Remove the created tickets from the Markdown before importing again.`
        : message);
      ui.importCreate.textContent = "Create tickets";
    };

    const memberIds = new Map(state.members.map((m) => [m.name.toLowerCase(), m.id]));
    for (const name of plan.newPeople) {
      const person = await run(db.from("ticket_members").insert({ name }).select().single(), ui.importError);
      if (!person) return fail();
      memberIds.set(name.toLowerCase(), person.id);
    }

    const row = (item) => ({
      title: item.title,
      description: item.description,
      status: item.status,
      blocked_reason: item.blocked_reason,
      story_points: item.story_points,
      assignee_id: item.assignee ? memberIds.get(item.assignee.toLowerCase()) ?? null : null,
    });

    for (const task of plan.tasks) {
      const parent = await run(
        db.from("tickets").insert({ ...row(task), project: task.project, parent_id: null }).select().single(),
        ui.importError
      );
      if (!parent) return fail();
      created += 1;

      if (task.subtasks.length) {
        const subtasks = task.subtasks.map((sub) => ({ ...row(sub), project: parent.project, parent_id: parent.id }));
        if (!(await run(db.from("tickets").insert(subtasks), ui.importError))) return fail();
        created += subtasks.length;
      }
    }

    ui.importText.value = "";
    ui.importFile.value = "";
    ui.importDialog.close();
    await load();
  }


  /* Auth */

  function setSignedIn(session) {
    const signedIn = Boolean(session);
    ui.auth.hidden = signedIn;
    ui.app.hidden = !signedIn;
    ui.session.hidden = !signedIn;
    ui.sessionEmail.textContent = session?.user?.email || "";

    if (!signedIn) startTerminal();

    if (signedIn === state.signedIn) return;
    state.signedIn = signedIn;

    if (signedIn) {
      load();
    } else {
      state.tickets = [];
      state.members = [];
      state.privateProjects = [];
      ui.columns.replaceChildren();
      if (ui.ticketDialog.open) ui.ticketDialog.close();
      if (ui.peopleDialog.open) ui.peopleDialog.close();
      if (ui.projectsDialog.open) ui.projectsDialog.close();
      if (ui.importDialog.open) ui.importDialog.close();
    }
  }

  async function signIn(e) {
    e.preventDefault();
    const submit = ui.login.querySelector('[type="submit"]');
    submit.disabled = true;

    const { error } = await db.auth.signInWithPassword({
      email: ui.login.elements.email.value.trim(),
      password: ui.login.elements.password.value,
    });

    submit.disabled = false;
    showError(ui.loginError, error);
    if (!error) ui.login.reset();
  }


  /* Events */

  ui.login.addEventListener("submit", signIn);
  ui.signOut.addEventListener("click", () => db.auth.signOut());

  ui.filterProject.addEventListener("change", () => {
    state.filters.project = ui.filterProject.value;
    saveFilters();
    render();
  });
  ui.filterAssignee.addEventListener("change", () => {
    state.filters.assignee = ui.filterAssignee.value;
    saveFilters();
    render();
  });

  ui.newTicket.addEventListener("click", newTicket);
  ui.openPeople.addEventListener("click", () => {
    showError(ui.peopleError, null);
    renderPeople();
    ui.peopleDialog.showModal();
    ui.peopleForm.elements.name.focus();
  });

  form.addEventListener("submit", saveTicket);
  form.addEventListener("input", (e) => {
    // The subtask controls save on their own, so they don't count as unsaved edits.
    if (ui.subtasks.contains(e.target)) return;
    state.dirty = true;
    if (e.target === form.elements.story_points) renderRollup();
  });
  form.elements.status.addEventListener("change", () => {
    ui.blockedField.hidden = form.elements.status.value !== "blocked";
  });

  ui.parentLink.addEventListener("click", () => {
    const parent = editingParent();
    if (parent) openTicket(parent.id);
  });
  ui.ticketDelete.addEventListener("click", deleteTicket);
  ui.subtaskAddButton.addEventListener("click", addSubtask);
  [ui.subtaskTitle, ui.subtaskPoints].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addSubtask();
    });
  });

  ui.ticketDialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeTicketDialog();
  });
  ui.ticketDialog.addEventListener("click", (e) => {
    if (e.target === ui.ticketDialog || e.target.closest("[data-close]")) closeTicketDialog();
  });

  ui.openProjects.addEventListener("click", () => {
    showError(ui.projectsError, null);
    renderProjects();
    ui.projectsDialog.showModal();
    ui.projectsForm.elements.title.focus();
  });
  ui.projectsForm.addEventListener("submit", addProject);
  ui.projectsDialog.addEventListener("click", (e) => {
    if (e.target === ui.projectsDialog || e.target.closest("[data-close]")) ui.projectsDialog.close();
  });

  ui.openImport.addEventListener("click", openImport);
  ui.importText.addEventListener("input", renderImportPreview);
  ui.importDefaultProject.addEventListener("change", renderImportPreview);
  ui.importFile.addEventListener("change", () => loadImportFile(ui.importFile.files[0]));
  ui.importText.addEventListener("dragover", (e) => e.preventDefault());
  ui.importText.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    if (!file) return;
    e.preventDefault();
    loadImportFile(file);
  });
  ui.importCopyPrompt.addEventListener("click", copyPrompt);
  ui.importCreate.addEventListener("click", createImport);
  ui.importDialog.addEventListener("click", (e) => {
    if (e.target === ui.importDialog || e.target.closest("[data-close]")) ui.importDialog.close();
  });

  ui.peopleForm.addEventListener("submit", addPerson);
  ui.peopleDialog.addEventListener("click", (e) => {
    if (e.target === ui.peopleDialog || e.target.closest("[data-close]")) ui.peopleDialog.close();
  });

  // Pick up changes made on another device when coming back to the tab.
  document.addEventListener("visibilitychange", () => {
    const dialogOpen = ui.ticketDialog.open || ui.peopleDialog.open || ui.projectsDialog.open || ui.importDialog.open;
    if (!document.hidden && state.signedIn && !dialogOpen) load();
  });

  db.auth.onAuthStateChange((_event, session) => {
    // Supabase advises against calling the client from inside this callback.
    setTimeout(() => setSignedIn(session), 0);
  });
})();
