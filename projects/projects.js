import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects          = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const title = document.querySelector('.projects-title');
if (title) title.textContent = `${projects.length} Projects`;

/* ---- arc with D3 ---- */
let arc = d3.arc().innerRadius(0).outerRadius(50)({
    startAngle: 0,
    endAngle: 2 * Math.PI,
  });
  
/* append it to our existing SVG */
d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');

/* ────── Lab 5Step 1.4 ·  Static pie chart with two slices ────── */

// 1 · Data: ⅓ vs ⅔ (1 and 2)
const data = [1, 2];

// 2 · Arc generator (outer radius 50px, full pie)
const arcGen = d3.arc().innerRadius(0).outerRadius(50);

// 3 · Compute start/end angles **manually**
let total = 0;
for (const d of data) total += d;

let angle = 0;
const arcs = [];
for (const d of data) {
  const endAngle = angle + (d / total) * 2 * Math.PI;
  arcs.push(arcGen({ startAngle: angle, endAngle }));
  angle = endAngle;
}

// 4 · Draw each slice in its own <path>
const colors = ['gold', 'purple'];       // slice 0, slice 1
arcs.forEach((arc, idx) => {
  d3.select('#projects-plot')
    .append('path')
    .attr('d', arc)
    .attr('fill', colors[idx]);
});