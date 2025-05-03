/* ───────────── shared helpers ───────────── */
import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

/* ------------------------------------------ */
/* state that must survive every re‑render    */
let allProjects   = await fetchJSON('../lib/projects.json');
let activeYear    = null;          // pie‑click filter (null = no filter)
let query         = '';            // search bar text
/* ------------------------------------------ */

const projectsContainer = document.querySelector('.projects');
const searchInput       = document.querySelector('.searchBar');
const svg               = d3.select('#projects-plot');
const legendUL          = d3.select('.legend');

/* ───── 1 · general re‑render pipeline ───── */
function refreshUI() {

  /* 1 · filter by search query */
  const searchFiltered = allProjects.filter(p =>
      p.title.toLowerCase()       .includes(query) ||
      p.description.toLowerCase() .includes(query));

  /* 2 · filter by active year (if any) */
  const visible = activeYear
      ? searchFiltered.filter(p => p.year === activeYear)
      : searchFiltered;

  /* 3 · (cards) */
  renderProjects(visible, projectsContainer, 'h2');

  /* 4 · (pie + legend) */
  drawPieAndLegend(visible);
}

/* ───── 2 · draw pie & legend from an array of projects ───── */
function drawPieAndLegend(projectsGiven){

  /* A · aggregate counts per year */
  const rolled   = d3.rollups(projectsGiven, v=>v.length, d=>d.year);
  const data     = rolled.map(([year,count]) => ({ label:year, value:count }));

  /* B · generators & scales (re‑created every time so they keep in sync) */
  const pie   = d3.pie().value(d => d.value);
  const arcs  = pie(data);
  const arc   = d3.arc().innerRadius(0).outerRadius(50);
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  /* C · clear old viz */
  svg.selectAll('*').remove();
  legendUL.selectAll('*').remove();

  /* D · draw slices */
  svg.selectAll('path')
     .data(arcs)
     .enter()
     .append('path')
       .attr('d', arc)
       .attr('fill', (_,i)=>color(i))
       .classed('selected', d => d.data.label === activeYear)
       .on('click', (_,d)=>{
          activeYear = (activeYear === d.data.label) ? null : d.data.label;
          refreshUI();
       });

  /* E · legend (ul > li) */
  legendUL.selectAll('li')
     .data(data)
     .enter()
     .append('li')
       .attr('style',(_,i)=>`--color:${color(i)}`)
       .classed('selected', d => d.label === activeYear)
       .html(d=>`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
       .on('click', (_,d)=>{
          activeYear = (activeYear === d.label) ? null : d.label;
          refreshUI();
       });
}

/* ───── 3 · live search bar ───── */
searchInput.addEventListener('input', e=>{
  query = e.target.value.toLowerCase().trim();
  refreshUI();
});

/* first paint */
refreshUI();