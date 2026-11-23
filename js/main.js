(function () {
  const $ = (id) => document.getElementById(id);

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (s) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[s]));
  }

  function statusText(status) {
    return { resolved: "已解决", ongoing: "进行中", unresolved: "未解决" }[status] || "未解决";
  }

  function statusClass(status) {
    return ["resolved", "ongoing", "unresolved"].includes(status) ? status : "unresolved";
  }

  function setContact(emailEl, githubEl, contact) {
    const email = contact?.email || "";
    const github = contact?.github || "";
    if (emailEl) {
      emailEl.textContent = email || "未填写";
      if (email) emailEl.href = "mailto:" + email;
      else emailEl.removeAttribute("href");
    }
    if (githubEl) {
      githubEl.textContent = github || "未填写";
      if (github) githubEl.href = github;
      else githubEl.removeAttribute("href");
      githubEl.target = "_blank";
      githubEl.rel = "noopener";
    }
  }

  function renderHome(data) {
    const about = data.about || {};
    const textMap = {
      "about-name": about.name, "about-grade": about.grade,
      "about-major": about.major, "about-direction": about.direction,
      "about-intro": about.intro
    };
    Object.entries(textMap).forEach(([id, value]) => {
      const el = $(id);
      if (el) el.textContent = value || "待填写";
    });
    setContact($("contact-email"), $("contact-github"), data.contact || {});
  }

  // ============ 通用时间线初始化逻辑 ============
  function initTimelinePage(data, type) {
    const all = Array.isArray(data[type]) ? data[type] : [];
    const state = { q: "", status: "all", tag: "all", sort: "desc" };
    
    const searchEl = $("search-input");
    const statusEl = $("status-filter");
    const tagEl = $("tag-filter");
    const sortEl = $("sort-filter");
    const statsEl = $(`${type}-stats`);
    const timelineEl = $("timeline");
    const emptyEl = $("empty-state");
    const countEl = $("result-count");

    function renderStats() {
      const total = all.length;
      const resolved = all.filter((r) => r.status === "resolved").length;
      const ongoing = all.filter((r) => r.status === "ongoing").length;
      const unresolved = all.filter((r) => r.status === "unresolved").length;
      statsEl.innerHTML = [
        [total, "总计"], [resolved, "已完成"], [ongoing, "进行中"], [unresolved, "未解决"]
      ].map(([num, label]) => `<div class="stat"><strong>${num}</strong><span>${label}</span></div>`).join("");
    }

    function populateTags() {
      const tags = [...new Set(all.flatMap((r) => Array.isArray(r.tags) ? r.tags : []))].sort();
      tagEl.innerHTML = '<option value="all">全部标签</option>' +
        tags.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
    }

    function recordHtml(r) {
      const st = statusClass(r.status);
      const start = r.startDate || r.date || "";
      const end = r.endDate || r.date || "";
      const dateText = (start === end || !end) ? start : `${start} ~ ${end}`;
      const title = r.title || r.name || "未命名";
      
      const tags = (Array.isArray(r.tags) ? r.tags : [])
        .map((t) => `<span class="tag">${esc(t)}</span>`).join("");
      const evidence = r.evidenceUrl
        ? `<p><a href="${esc(r.evidenceUrl)}" target="_blank" rel="noopener">查看证据/链接</a></p>`
        : "";
      
      let extraHtml = "";
      if (type === "skills") {
        extraHtml = `
          ${r.codeSnippet ? `<pre><code>${esc(r.codeSnippet)}</code></pre>` : ""}
          ${r.screenshotUrl ? `<img class="screenshot" src="${esc(r.screenshotUrl)}" alt="截图" loading="lazy" onerror="this.style.display='none'">` : ""}
        `;
      } else if (type === "projects") {
        extraHtml = `<p><strong>使用技术：</strong>${esc(r.tech || "未填写")}</p>`;
      }

      return `
        <article class="timeline-item status-${st}">
          <details class="record-card">
            <summary>
              <span class="record-date">${esc(dateText)}</span>
              <span class="record-title">${esc(title)}</span>
              <span class="badge ${st}">${statusText(r.status)}</span>
            </summary>
            <div class="record-body">
              <p><strong>${type === 'projects' ? '项目说明' : '能力说明'}：</strong>${esc(r.learned || r.description || "")}</p>
              <p><strong>遇到什么问题：</strong>${esc(r.problem || r.difficulty || "")}</p>
              <p><strong>怎么解决 / 负责什么：</strong>${esc(r.solution || r.role || "")}</p>
              ${extraHtml}
              ${evidence}
              <div class="tags">${tags}</div>
            </div>
          </details>
        </article>`;
    }

    function render() {
      const q = state.q.trim().toLowerCase();
      let rows = all.filter((r) => {
        const text = [
          r.title, r.name, r.description, r.learned, r.problem, r.difficulty, r.solution, r.role, r.tech,
          ...(Array.isArray(r.tags) ? r.tags : [])
        ].join(" ").toLowerCase();
        const matchQ = !q || text.includes(q);
        const matchStatus = state.status === "all" || r.status === state.status;
        const matchTag = state.tag === "all" || (Array.isArray(r.tags) && r.tags.includes(state.tag));
        return matchQ && matchStatus && matchTag;
      });

      rows.sort((a, b) => {
        const av = String(a.startDate || a.date || "");
        const bv = String(b.startDate || b.date || "");
        return state.sort === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      });

      countEl.textContent = `找到 ${rows.length} 条记录`;

      if (!rows.length) {
        timelineEl.innerHTML = "";
        emptyEl.classList.remove("hidden");
        return;
      }
      emptyEl.classList.add("hidden");

      const groups = {};
      rows.forEach((r) => {
        const dateStr = r.startDate || r.date || "";
        const key = String(dateStr).slice(0, 7) || "未知时间";
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      });

      timelineEl.innerHTML = Object.keys(groups).map((key) => {
        const [y, m] = key.split("-");
        const label = y && m ? `${y} 年 ${Number(m)} 月` : "未知时间";
        return `
          <section class="timeline-group">
            <h3>${esc(label)}</h3>
            <div class="timeline">${groups[key].map(recordHtml).join("")}</div>
          </section>`;
      }).join("");
    }

    searchEl.addEventListener("input", (e) => { state.q = e.target.value; render(); });
    statusEl.addEventListener("change", (e) => { state.status = e.target.value; render(); });
    tagEl.addEventListener("change", (e) => { state.tag = e.target.value; render(); });
    sortEl.addEventListener("change", (e) => { state.sort = e.target.value; render(); });

    renderStats();
    populateTags();
    render();
  }

  function initContactForm() {
    const form = $("contact-form");
    if (!form) return;
    const message = $("form-message");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.elements["name"].value.trim();
      const email = form.elements["email"].value.trim();
      const content = form.elements["message"].value.trim();
      const errors = [];
      if (!name) errors.push("请填写姓名");
      if (!email) errors.push("请填写邮箱");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("邮箱格式不正确");
      if (!content) errors.push("请填写留言内容");

      if (errors.length) {
        message.className = "notice error";
        message.textContent = errors.join("；");
        return;
      }
      message.className = "notice success";
      message.textContent = "提交成功！这是前端演示表单，未真正发送邮件。";
      form.reset();
    });
  }

  (async function () {
    const data = await GrowthStore.load();
    const page = document.body.dataset.page;
    if (page === "home") renderHome(data);
    if (page === "learning") initTimelinePage(data, "learning");
    if (page === "skills") initTimelinePage(data, "skills");
    if (page === "projects") {
      initTimelinePage(data, "projects");
      setContact($("project-contact-email"), $("project-contact-github"), data.contact || {});
      initContactForm();
    }
  })();
})();