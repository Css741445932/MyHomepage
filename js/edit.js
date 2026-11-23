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

  (async function () {
    let data = await GrowthStore.load();
    data.learning = Array.isArray(data.learning) ? data.learning : [];
    data.skills = Array.isArray(data.skills) ? data.skills : [];
    data.projects = Array.isArray(data.projects) ? data.projects : [];
    data.about = data.about || {};
    data.contact = data.contact || {};

    const filterState = { q: "", type: "all", startDate: "", endDate: "" };

    function show(text, type) {
      const el = $("edit-message");
      el.textContent = text;
      el.className = "notice " + (type || "");
    }

    function fillProfile() {
      $("edit-name").value = data.about.name || "";
      $("edit-major").value = data.about.major || "";
      $("edit-grade").value = data.about.grade || "";
      $("edit-direction").value = data.about.direction || "";
      $("edit-intro").value = data.about.intro || "";
      $("edit-email").value = data.contact.email || "";
      $("edit-github").value = data.contact.github || "";
    }

    function collectProfile() {
      data.about = {
        name: $("edit-name").value.trim(), major: $("edit-major").value.trim(),
        grade: $("edit-grade").value.trim(), direction: $("edit-direction").value.trim(),
        intro: $("edit-intro").value.trim()
      };
      data.contact = {
        email: $("edit-email").value.trim(), github: $("edit-github").value.trim()
      };
    }

    function saveAll(message) {
      collectProfile();
      GrowthStore.save(data);
      show(message || "已保存到浏览器本地存储。", "success");
    }

    function matchFilter(record) {
      const q = filterState.q.toLowerCase();
      const text = [
        record.title, record.name, record.learned, record.description, 
        record.problem, record.difficulty, record.solution, record.role, record.tech,
        ...(Array.isArray(record.tags) ? record.tags : [])
      ].join(" ").toLowerCase();
      if (q && !text.includes(q)) return false;
      const rStart = record.startDate || record.date || "";
      const rEnd = record.endDate || record.date || "";
      if (filterState.startDate && rEnd < filterState.startDate) return false;
      if (filterState.endDate && rStart > filterState.endDate) return false;
      return true;
    }

    function renderList(type, containerId) {
      const el = $(containerId);
      const list = data[type].filter(matchFilter);
      if (!list || !list.length) {
        el.innerHTML = `<p class="muted">没有匹配的数据。</p>`;
        return;
      }
      
      el.innerHTML = list.map((r) => {
        const start = r.startDate || r.date || "未填时间";
        const end = r.endDate || r.date || "";
        const dateText = (start === end || !end) ? start : `${start} ~ ${end}`;
        const title = r.title || r.name || "未命名";
        return `
        <div class="edit-row">
          <span>${esc(dateText)} · ${esc(title)} <span class="badge ${statusClass(r.status)}">${statusText(r.status)}</span></span>
          <span style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn ghost" data-action="edit" data-type="${type}" data-id="${esc(r.id)}">编辑</button>
            <button type="button" class="btn danger" data-action="delete" data-type="${type}" data-id="${esc(r.id)}">删除</button>
          </span>
        </div>`;
      }).join("");
    }

    // 🛠️ 修复单复数映射
    function getFormIds(type) {
      if (type === "learning") return { form: "learning-form", id: "learning-editing-id", submit: "learning-submit-btn", cancel: "learning-cancel-btn", text: "添加学习记录" };
      if (type === "skills") return { form: "skill-form", id: "skill-editing-id", submit: "skill-submit-btn", cancel: "skill-cancel-btn", text: "添加技能" };
      if (type === "projects") return { form: "project-form", id: "project-editing-id", submit: "project-submit-btn", cancel: "project-cancel-btn", text: "添加项目" };
    }

    function resetForm(type) {
      const ids = getFormIds(type);
      const f = $(ids.form);
      if (!f) return;
      f.reset();
      $(ids.id).value = "";
      $(ids.submit).textContent = ids.text;
      $(ids.cancel).classList.add("hidden");
    }

    function startEdit(type, record) {
      const ids = getFormIds(type);
      const f = $(ids.form);
      if (!f) {
        alert("找不到表单元素，请检查 HTML 中是否包含 id=" + ids.form);
        return;
      }

      const setVal = (name, val) => { if (f.elements[name]) f.elements[name].value = val || ""; };

      setVal("startDate", record.startDate || record.date);
      setVal("endDate", record.endDate || record.date);
      setVal("title", record.title || record.name);
      setVal("learned", record.learned || record.description);
      setVal("problem", record.problem || record.difficulty);
      setVal("solution", record.solution || record.role);
      setVal("status", record.status || "resolved");
      setVal("tags", (Array.isArray(record.tags) ? record.tags : []).join(", "));
      setVal("imageUrls", (Array.isArray(record.imageUrls) ? record.imageUrls : []).join(", "));
      setVal("videoUrl", record.videoUrl);

      if (type === "learning") {
        setVal("evidenceUrl", record.evidenceUrl);
      } else if (type === "skills") {
        setVal("codeSnippet", record.codeSnippet);
      } else if (type === "projects") {
        setVal("tech", record.tech);
      }

      $(ids.id).value = record.id;
      $(ids.submit).textContent = "保存修改";
      $(ids.cancel).classList.remove("hidden");
      f.scrollIntoView({ behavior: "smooth", block: "center" });
      show(`正在编辑 [${record.title || record.name}]，请修改后点击保存。`, "");
    }

    function renderAllLists() {
      renderList("learning", "learning-list");
      renderList("skills", "skills-list-edit");
      renderList("projects", "projects-list-edit");

      $("section-learning").style.display = (filterState.type === "all" || filterState.type === "learning") ? "" : "none";
      $("section-skills").style.display = (filterState.type === "all" || filterState.type === "skills") ? "" : "none";
      $("section-projects").style.display = (filterState.type === "all" || filterState.type === "projects") ? "" : "none";
    }

    fillProfile();
    renderAllLists();

    $("edit-search").addEventListener("input", (e) => { filterState.q = e.target.value; renderAllLists(); });
    $("edit-type-filter").addEventListener("change", (e) => { filterState.type = e.target.value; renderAllLists(); });
    $("edit-start-date").addEventListener("change", (e) => { filterState.startDate = e.target.value; renderAllLists(); });
    $("edit-end-date").addEventListener("change", (e) => { filterState.endDate = e.target.value; renderAllLists(); });

    $("save-btn").addEventListener("click", () => saveAll());

    ["learning-list", "skills-list-edit", "projects-list-edit"].forEach((id) => {
      $(id).addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-type]");
        if (!btn) return;
        const action = btn.dataset.action;
        const type = btn.dataset.type;
        const idValue = btn.dataset.id;

        if (action === "edit") {
          const record = data[type].find((x) => x.id === idValue);
          if (record) {
            startEdit(type, record);
          } else {
            alert("找不到这条数据，可能已被删除。");
          }
          return;
        }

        if (action === "delete") {
          if (!confirm("确定删除这条内容吗？")) return;
          data[type] = data[type].filter((x) => x.id !== idValue);
          GrowthStore.save(data);
          renderAllLists();
          resetForm(type);
          show("已删除并保存。", "success");
        }
      });
    });

    function handleFormSubmit(type, e) {
      e.preventDefault();
      const f = e.target;
      const ids = getFormIds(type);
      const editingId = $(ids.id).value;
      
      const getVal = (name) => f.elements[name] ? f.elements[name].value : "";
      const getArr = (name) => getVal(name).split(",").map((s) => s.trim()).filter(Boolean);

      const payload = {
        startDate: getVal("startDate"), endDate: getVal("endDate"),
        title: getVal("title").trim(), learned: getVal("learned").trim(),
        problem: getVal("problem").trim(), solution: getVal("solution").trim(),
        status: getVal("status"),
        tags: getArr("tags"),
        imageUrls: getArr("imageUrls"),
        videoUrl: getVal("videoUrl").trim()
      };

      if (type === "learning") {
        payload.evidenceUrl = getVal("evidenceUrl").trim();
      } else if (type === "skills") {
        payload.codeSnippet = getVal("codeSnippet");
      } else if (type === "projects") {
        payload.tech = getVal("tech").trim();
      }

      if (editingId) {
        const idx = data[type].findIndex((x) => x.id === editingId);
        if (idx !== -1) data[type][idx] = { ...data[type][idx], ...payload };
        show("已更新并保存。", "success");
      } else {
        data[type].push({ id: type + "-" + Date.now(), ...payload });
        show("已添加并保存。", "success");
      }

      GrowthStore.save(data);
      renderAllLists();
      resetForm(type);
    }

    $("learning-form").addEventListener("submit", (e) => handleFormSubmit("learning", e));
    $("skill-form").addEventListener("submit", (e) => handleFormSubmit("skills", e));
    $("project-form").addEventListener("submit", (e) => handleFormSubmit("projects", e));

    $("learning-cancel-btn").addEventListener("click", () => { resetForm("learning"); show("已取消编辑。", ""); });
    $("skill-cancel-btn").addEventListener("click", () => { resetForm("skills"); show("已取消编辑。", ""); });
    $("project-cancel-btn").addEventListener("click", () => { resetForm("projects"); show("已取消编辑。", ""); });

    $("export-btn").addEventListener("click", () => {
      collectProfile();
      GrowthStore.save(data);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "data.json";
      a.click(); URL.revokeObjectURL(a.href);
      show("已导出 data.json，请放到 data/ 目录并提交 Git。", "success");
    });

    $("import-file").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!parsed || typeof parsed !== "object") throw new Error("JSON 格式不正确");
        data = parsed;
        data.learning = Array.isArray(data.learning) ? data.learning : [];
        data.skills = Array.isArray(data.skills) ? data.skills : [];
        data.projects = Array.isArray(data.projects) ? data.projects : [];
        data.about = data.about || {}; data.contact = data.contact || {};
        GrowthStore.save(data); location.reload();
      } catch (err) { show("导入失败：" + err.message, "error"); }
    });

    $("reset-btn").addEventListener("click", () => {
      if (!confirm("确定恢复示例数据吗？当前本地保存的内容会被清除。")) return;
      GrowthStore.clear(); location.reload();
    });
  })();
})();