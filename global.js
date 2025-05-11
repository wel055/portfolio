/* global.js  ───────────────────────────────────────────── */

console.log("IT’S ALIVE!");

/* Helper: $$() returns an array of elements that match a selector */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/* ── Step 2 • Automatically mark the current nav link ────────────── */

/* 1. Grab every <a> inside <nav> */
const navLinks = $$("nav a");

/* 2. Normalise paths so "/", "/index.html", "about/" all compare correctly */
const normalise = p =>
  p.replace(/\/index\.html$/i, "/").replace(/\/+$/, "/");  // strip /index.html & trailing “//”

/* 3. Find the link whose host + pathname match the current page */
const currentLink = navLinks.find(a =>
  a.host === location.host &&
  normalise(new URL(a.href).pathname) === normalise(location.pathname)
);

/* 4. Add the highlight class (only if a match was found) */
currentLink?.classList.add("current");

/* 1. Site pages (add / edit as needed) */
const pages = [
    { url: "",            title: "Home"     },
    { url: "projects/",   title: "Projects" },
    { url: "cv/",         title: "CV"       },
    { url: "contact/",    title: "Contact"  },
    { url: "meta/",     title: "Meta"     },
    { url: "https://github.com/YourGitHubUsername", title: "GitHub" }
  ];
  
  /* 2. Detect whether we’re on localhost or GitHub Pages ⇒ set BASE_PATH */
  const BASE_PATH =
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "/"                              // local dev
      : "/portfolio/";                   // repo name on GitHub Pages
  
  /* 3. Helper to normalise “/” vs “/index.html” */
  const norm = p => p.replace(/\/index\.html$/i, "/").replace(/\/+$/, "/");
  
  /* 4. Create <nav> and insert it at the very top of <body> */
  const nav = document.createElement("nav");
  document.body.prepend(nav);
  
  /* 5. Build links */
  for (const { url: rawURL, title } of pages) {
    /* If the URL is relative, prepend BASE_PATH */
    const url = rawURL.startsWith("http") ? rawURL : BASE_PATH + rawURL;
  
    const a = document.createElement("a");
    a.href = url;
    a.textContent = title;
  
    /* Open external links in a new tab */
    if (a.host !== location.host) a.target = "_blank";
  
    /* Highlight the current page link */
    if (a.host === location.host && norm(new URL(a.href).pathname) === norm(location.pathname)) {
      a.classList.add("current");
    }
  
    nav.append(a);
  }
  
  /* 6. (Optional) minimal styling so links don’t stick together
        – remove if you already have nav styles in CSS            */
  nav.style.display = "flex";
  nav.style.gap = "1rem";

/* 1. Inject the <label><select>… HTML at the top of <body> */
document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="auto">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>`
  );
  
  const select = document.querySelector(".color-scheme select");
  
  /* 2. If the user chose a scheme before, restore it */
  const saved = localStorage.colorScheme || "auto";
  select.value = saved;
  applyScheme(saved);
  
  /* 3. React when the user changes the dropdown */
  select.addEventListener("input", e => {
    const mode = e.target.value;          // "auto" | "light" | "dark"
    localStorage.colorScheme = mode;      // persist
    applyScheme(mode);
  });
  
  /* Helper: set or clear the css property on <html> */
  function applyScheme(mode) {
    const rootStyle = document.documentElement.style;
    if (mode === "auto") {
      rootStyle.removeProperty("color-scheme");   // back to OS preference
    } else {
      rootStyle.setProperty("color-scheme", mode); // force light or dark
    }
  }

/* ── Load & render projects from lib/projects.json ───────── */

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);          // 1. fetch
    if (!response.ok) {                         // 2. handle errors
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();         // 3. parse JSON
    return data;
  } catch (error) {
    console.error("Error fetching or parsing JSON data:", error);
  }
}

/* Run only on the Projects page */
if (location.pathname.match(/\/projects(\/index\.html)?$/)) {
  fetchJSON("../lib/projects.json").then(list => {
    if (!list) return;                          // fetch failed
    const container = document.querySelector(".projects");
    if (!container) return;

    /* minimal templating */
    for (const { title, image, description } of list) {
      container.insertAdjacentHTML(
        "beforeend",
        `<article>
           <h2>${title}</h2>
           <img src="${image}" alt="">
           <p>${description}</p>
         </article>`
      );
    }
  });
}

/* ----------  Lab 4 STEP 1.4 • renderProjects  ------------------------ */
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!Array.isArray(projects) || !containerElement) return;

  /* 1 · Clear previous content */
  containerElement.innerHTML = '';

  /* 2 · Create an <article> for each project */
  for (const project of projects) {
    const article = document.createElement('article');

    /* 3 · Populate with dynamic markup */
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
    `;

    /* 4 · Append to the container */
    containerElement.appendChild(article);
  }
}

/* ----------  fetch GitHub data  ---------- */
export async function fetchGitHubData(username) {
  return fetchJSON(
    `https://api.github.com/users/${encodeURIComponent(username)}`
  );
}