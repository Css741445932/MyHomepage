window.SEED_DATA = {
  version: 1,
  about: {
    name: "成珊珊",
    major: "软件工程（AI 大模型）",
    grade: "大一",
    direction: "AI 大模型应用开发与前端基础",
    intro: "我是成珊珊，正在用代码、记录和项目搭建自己的成长轨迹。"
  },
  contact: {
    email: "your-email@example.com",
    github: "https://github.com/yourname"
  },
  learning: [
    {
      id: "learn-001",
      startDate: "2026-03-10",
      endDate: "2026-03-15",
      title: "第一次写响应式导航",
      learned: "学习 Flexbox、媒体查询和移动端导航布局。",
      problem: "手机宽度下导航项挤在一起，点击区域太小。",
      solution: "用媒体查询改为两行布局，并增大按钮点击区域，已解决。",
      status: "resolved",
      tags: ["HTML/CSS", "响应式"],
      evidenceUrl: "",
      imageUrls: [], // 新增：图片链接数组
      videoUrl: ""   // 新增：视频链接
    }
  ],
  skills: [
    {
      id: "skill-001",
      startDate: "2026-03-01",
      endDate: "2026-03-20",
      title: "掌握原生 JavaScript 逻辑",
      learned: "能使用数组方法、事件监听和 localStorage 完成筛选、搜索与数据保存。",
      problem: "搜索、状态筛选和排序同时生效时逻辑容易混乱。",
      solution: "把筛选条件集中到 state 对象，再统一 render，已解决。",
      status: "resolved",
      tags: ["JavaScript", "交互"],
      codeSnippet: "const filtered = records.filter(r =>\n  r.title.includes(keyword) && r.status === status\n);",
      imageUrls: [],
      videoUrl: ""
    }
  ],
  projects: [
    {
      id: "project-001",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
      title: "个人成长主页 (本项目)",
      learned: "需要一个能集中展示学习记录、技能证据、项目作品和联系方式的个人主页，并且内容可以自己维护。",
      problem: "最大困难是编辑页的数据结构需要兼容不同板块，且要保持搜索、筛选、修改的数据不丢失。",
      solution: "负责全部页面结构、科技感视觉、原生 JS 筛选逻辑与 localStorage 数据管理。使用 HTML/CSS/JS 从零手写完成。",
      status: "resolved",
      tags: ["前端", "项目实战", "AI辅助开发"],
      tech: "HTML5, CSS3, Vanilla JS, localStorage, Git",
      imageUrls: [],
      videoUrl: ""
    }
  ]
};

window.GrowthStore = {
  seed: window.SEED_DATA,
  clone(obj) { return JSON.parse(JSON.stringify(obj)); },
  async load() {
    const local = localStorage.getItem("growthData");
    if (local) {
      try { return JSON.parse(local); } catch (e) { localStorage.removeItem("growthData"); }
    }
    try {
      if (location.protocol !== "file:") {
        const res = await fetch("data/data.json");
        if (res.ok) return await res.json();
      }
    } catch (e) {}
    return this.clone(window.SEED_DATA);
  },
  save(data) { localStorage.setItem("growthData", JSON.stringify(data)); },
  clear() { localStorage.removeItem("growthData"); }
};