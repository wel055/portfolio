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

/* 1 · Dataset */
let data = [1, 2, 3, 4, 5, 5];

/* 2 · Create the slice generator (a.k.a. d3.pie ) */
let sliceGenerator = d3.pie();

/* 3 · Turn data into start / end angles */
let arcData = sliceGenerator(data);

/* 4 · Arc path generator (outer‑radius 50  ⇒ diameter 100 matches the SVG viewBox) */
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

/* 5 · Colour scale (10 nice categorical colours) */
let colors = d3.scaleOrdinal(d3.schemeTableau10);

/* 6 · Render the slices */
d3.select('#projects-plot')
  .selectAll('path')
  .data(arcData)
  .enter()
  .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (_, i) => colors(i));