import { fetchJSON, renderProjects } from './global.js';

/* 1 · Load all projects */
const projects = await fetchJSON('./lib/projects.json');

/* 2 · Keep only the first three */
const latestProjects = projects.slice(0, 3);

/* 3 · Find the container on the home page */
const projectsContainer = document.querySelector('.projects');

/* 4 · Render them */
renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGitHubData('wel055');

const profileStats = document.querySelector('#profile-stats');if (profileStats) {
    profileStats.innerHTML = `
      <dl>
        <dt>Public Repos:</dt> <dd>${githubData.public_repos}</dd>
        <dt>Public Gists:</dt> <dd>${githubData.public_gists}</dd>
        <dt>Followers:</dt>    <dd>${githubData.followers}</dd>
        <dt>Following:</dt>    <dd>${githubData.following}</dd>
      </dl>
    `;
  }

