import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects          = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const title = document.querySelector('.projects-title');
if (title) title.textContent = `${projects.length} Projects`;

/* ────── Lab 5Step 1.4 ·  Static pie chart with two slices ────── */

/* DATA WITH LABELS  ------------------------------------------------ */
let data = [
    { value: 1, label: 'Apples'   },
    { value: 2, label: 'Oranges'  },
    { value: 3, label: 'Mangos'   },
    { value: 4, label: 'Pears'    },
    { value: 5, label: 'Limes'    },
    { value: 5, label: 'Cherries' },
  ];
  
/* slice generator that knows each object’s value */
let sliceGenerator = d3.pie().value(d => d.value);
  
/* convert to arc data and draw slices exactly like before */
let arcData = sliceGenerator(data);

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

/* LEGEND  ---------------------------------------------------------- */
const legend = d3.select('.legend');

data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('style', `--color:${colors(idx)}`)        // pass the colour
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});