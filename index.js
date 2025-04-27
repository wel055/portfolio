import { fetchJSON, renderProjects } from './global.js';

/* 1 · Load all projects */
const projects = await fetchJSON('./lib/projects.json');

/* 2 · Keep only the first three */
const latestProjects = projects.slice(0, 3);

/* 3 · Find the container on the home page */
const projectsContainer = document.querySelector('.projects');

/* 4 · Render them */
renderProjects(latestProjects, projectsContainer, 'h2');