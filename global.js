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
