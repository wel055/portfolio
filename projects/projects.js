import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects          = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const title = document.querySelector('.projects-title');
if (title) title.textContent = `${projects.length} Projects`;

/* ───  LAB 5 · Pie‑chart  ───────────────────────────────────────── */

const data = [
    { value: 1, label: 'Apples'   },
    { value: 2, label: 'Oranges'  },
    { value: 3, label: 'Mangos'   },
    { value: 4, label: 'Pears'    },
    { value: 5, label: 'Limes'    },
    { value: 5, label: 'Cherries' },
  ];
  
  /* 1 · slice generator that reads d.value */
  const sliceGenerator = d3.pie().value(d => d.value);
  
  /* 2 · convert to arc‑data */
  const arcData = sliceGenerator(data);
  
  /* 3 · arc generator (radius 50 – matches the SVG viewBox) */
  const arcGenerator = d3.arc()
    .innerRadius(0)      // pie (use >0 for donut)
    .outerRadius(50);    // matches viewBox –50 –50 100 100
  
  /* 4 · nice categorical colour scale */
  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  
  /* 5 · render the slices */
  d3.select('#projects-plot')
    .selectAll('path')
    .data(arcData)
    .join('path')
      .attr('d', arcGenerator)      // ← uses our generator
      .attr('fill', (_, i) => colors(i));
  
  /* 6 · build the legend */
  const legend = d3.select('.legend')
    .selectAll('li')
    .data(arcData)
    .join('li')
      .attr('style', (_, i) => `--color:${colors(i)}`)   // swatch colour
      .html(d => `<span class="swatch"></span> ${d.data.label} <em>(${d.data.value})</em>`);
  