/* meta.js -------------------------------------------------------------- */
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { loadData, processCommits } from './main.js';

/* ──── initial data ──── */
const data    = await loadData();
const commits = processCommits(data);

/* ──── slider state & scale ──── */
let commitProgress = 100;                         // 0‒100 %
const timeScale    = d3.scaleTime()
  .domain(d3.extent(commits, d => d.datetime))
  .range([0, 100]);

let commitMaxTime     = timeScale.invert(commitProgress);
let filteredCommits   = commits;                  // start with all commits

/* ──── initialise read-out ──── */
document.getElementById('commit-time').textContent =
  commitMaxTime.toLocaleString('en', { dateStyle : 'long', timeStyle : 'short' });

/* ──── slider handler ──── */
function onTimeSliderChange (e) {
  commitProgress  = +e.target.value;
  commitMaxTime   = timeScale.invert(commitProgress);

  /* update little <time> label on the right */
  document.getElementById('commit-time').textContent =
    commitMaxTime.toLocaleString('en', { dateStyle : 'long', timeStyle : 'short' });

  /* keep only the commits up to that moment */
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);
}

document.getElementById('commit-progress')
        .addEventListener('input', onTimeSliderChange);

/* ──── scatter-plot updater ──── */
function updateScatterPlot (commitsForPlot) {
  const width  = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usable = {
    left   : margin.left,
    right  : width  - margin.right,
    top    : margin.top,
    bottom : height - margin.bottom
  };

  const svg = d3.select('#chart').select('svg');

  const xScale = d3.scaleTime()
      .domain(d3.extent(commitsForPlot, d => d.datetime))
      .range([usable.left, usable.right]);

  const yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usable.bottom, usable.top]);

  const rScale = d3.scaleSqrt()
      .domain(d3.extent(commits, d => d.totalLines))
      .range([2, 30]);

  /* axes – clear old, draw new */
  svg.selectAll('.x-axis,.y-axis').remove();

  svg.append('g')
     .attr('class','x-axis')
     .attr('transform',`translate(0,${usable.bottom})`)
     .call(d3.axisBottom(xScale));

  svg.append('g')
     .attr('class','y-axis')
     .attr('transform',`translate(${usable.left},0)`)
     .call(d3.axisLeft(yScale));

  /* dots */
  const dots = svg.select('g.dots');

  dots.selectAll('circle')
      .data(commitsForPlot, d => d.id)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r',  d => rScale(d.totalLines))
      .attr('fill','steelblue')
      .style('fill-opacity',0.7);
}
const colors = d3.scaleOrdinal(d3.schemeTableau10);
/* ──── file-list helper ──── */
function updateFileDisplay (commitsArr) {
  // one object per file
  const files = d3.groups(
    commitsArr.flatMap(d => d.lines),      // one element per LOC
    d => d.file                            // group by filename
  )
  .map(([name, lines]) => ({ name, lines }))
  .sort((a, b) => b.lines.length - a.lines.length);

  /* ── 1.  main rows ───────────────────────────── */
  const filesContainer = d3.select('#files')
                           .selectAll('div')           // one div per file
                           .data(files, d => d.name)
                           .join(
                             enter => {
                               const row = enter.append('div');
                               row.append('dt')
                                  .append('code');     // filename
                               row.append('dd');       // dots go here
                               return row;
                             }
                           );

  /* ── 2.  filename + line-count label ─────────── */
  filesContainer.select('dt > code')
                .text(d => d.name);

  filesContainer.select('dt')               // one <small> per file
    .selectAll('small')
    .data(d => [d.lines.length])
    .join('small')
    .html(l => `${l} lines`);

  /* ── 3.  dots (unit-viz) ─────────────────────── */
  filesContainer.select('dd')
  .selectAll('div')
  .data(d => d.lines)
  .join('div')
  .attr('class', 'loc')
  .style('background', d => colors(d.type));   // ⬅ NEW
                            }

/* ──── kick-off ──── */
updateScatterPlot(filteredCommits);
updateFileDisplay(filteredCommits);