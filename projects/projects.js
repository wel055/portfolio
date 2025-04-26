import { fetchJSON, renderProjects } from '../global.js';

const projects      = await fetchJSON('../lib/projects.json');  // 1. fetch data
const projectsContainer = document.querySelector('.projects'); // 2. select target

renderProjects(projects, projectsContainer, 'h2');