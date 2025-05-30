import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { loadData, processCommits } from './main.js';

let data = await loadData();
let commits = processCommits(data);

/* ──── filtering slider ──── */
let commitProgress = 100;

let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress)
let filteredCommits = commits;

/* --- slider ----------------------------------------------------------------- */
function onTimeSliderChange(e) {
  commitProgress = +e.target.value;            // 0–100
  commitMaxTime = timeScale.invert(commitProgress);

  // update right-hand read-out
  document.getElementById('commit-time')
    .textContent = commitMaxTime.toLocaleString('en',
      { dateStyle: 'long', timeStyle: 'short' });

  // recompute visible commits
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
}

document.getElementById('commit-progress')
  .addEventListener('input', onTimeSliderChange);

// initialise the <time> element once
document.getElementById('commit-time')
  .textContent = commitMaxTime.toLocaleString('en',
    { dateStyle: 'long', timeStyle: 'short' });


function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();
  const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.top, usableArea.bottom]);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  // Remove old axes if they exist
  svg.selectAll('.x-axis').remove();
  svg.selectAll('.y-axis').remove();

  // Append new axes
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis')
    .call(yAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits,  (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}