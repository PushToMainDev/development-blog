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

  const projects = config.projects || [];
  const projectsById = new Map(projects.map((p) => [p.id, p]));

  const state = {
    tickets: [],
    members: [],
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

  function projectTitle(id) {
    return projectsById.get(id)?.title || id;
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
    return projects[0]?.id || "general";
  }

  function plural(n, word) {
    return `${n} ${word}${n === 1 ? "" : "s"}`;
  }


  /* Data */

  async function load() {
    const [tickets, members] = await Promise.all([
      db.from("tickets").select("*").order("id"),
      db.from("ticket_members").select("*").order("name"),
    ]);

    const error = tickets.error || members.error;
    showError(ui.boardError, error);
    if (error) return;

    state.tickets = tickets.data;
    state.members = members.data;
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
    const knownProject = state.filters.project === "all" || projectsById.has(state.filters.project);
    if (!knownProject) state.filters.project = "all";

    ui.filterProject.replaceChildren(
      option("all", "All projects", state.filters.project === "all"),
      ...projects.map((p) => option(p.id, p.title, state.filters.project === p.id))
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

    const projectOptions = projects.map((p) => [p.id, p.title]);
    if (!projectsById.has(draft.project)) projectOptions.push([draft.project, draft.project]);
    fillSelect(form.elements.project, projectOptions, draft.project);
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
      ui.columns.replaceChildren();
      if (ui.ticketDialog.open) ui.ticketDialog.close();
      if (ui.peopleDialog.open) ui.peopleDialog.close();
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

  ui.peopleForm.addEventListener("submit", addPerson);
  ui.peopleDialog.addEventListener("click", (e) => {
    if (e.target === ui.peopleDialog || e.target.closest("[data-close]")) ui.peopleDialog.close();
  });

  // Pick up changes made on another device when coming back to the tab.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.signedIn && !ui.ticketDialog.open && !ui.peopleDialog.open) load();
  });

  db.auth.onAuthStateChange((_event, session) => {
    // Supabase advises against calling the client from inside this callback.
    setTimeout(() => setSignedIn(session), 0);
  });
})();
