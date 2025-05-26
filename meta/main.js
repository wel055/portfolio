let xScale, yScale;
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

/* ---------------------------------------------------- */
/*  tiny helper – fills the <dl id="commit-tooltip">     */
/* ---------------------------------------------------- */
function renderTooltipContent (commit = {}) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
  
    /* nothing passed → keep tooltip hidden */
    if (Object.keys(commit).length === 0) {
      document.getElementById('commit-tooltip').style.opacity = 0;
      return;
    }
  
    link.href        = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
                       dateStyle : 'full',
                     });
  
    document.getElementById('commit-tooltip').style.opacity = 1;
  }

function updateTooltipVisibility (isVisible){
    document.getElementById('commit-tooltip').hidden = !isVisible;
  }

function createBrushSelector(svg) {
    svg.call(d3.brush());
  }

  function brushed(event) {
    const sel = event.selection;                // null when brush cleared
  
    d3.selectAll('circle')
      .classed('selected', d => isCommitSelected(sel, d));
  
    renderLanguageBreakdown(sel);
    renderSelectionCount(sel);
  }
  
  function isCommitSelected(selection, commit) {
    if (!selection) return false;               // nothing selected
  
    const [[x0, y0], [x1, y1]] = selection;     // brush rectangle in px
  
    const cx = xScale(commit.datetime);         // map data → px
    const cy = yScale(commit.hourFrac);
  
    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
  }

/* ───── helpers for brushing output ───── */
function renderSelectionCount(selection) {
    const chosen = selection
        ? commits.filter(d => isCommitSelected(selection, d))
        : [];
  
    document.getElementById('selection-count').textContent =
      `${chosen.length || 'No'} commit${chosen.length === 1 ? '' : 's'} selected`;
  
    return chosen;                    // we reuse it in renderLanguageBreakdown()
  }
  
function renderLanguageBreakdown(selection) {
    const chosen = selection ? commits.filter(d => isCommitSelected(selection, d))
                             : commits;        // no brush → all commits
  
    const lines   = chosen.flatMap(d => d.lines);       // every edited line
    const byLang  = d3.rollup(lines,
                              v => v.length,
                              d => d.type);             // CSV “type” = language
  
    const dl = document.getElementById('language-breakdown');
    dl.innerHTML = '';                                   // wipe
  
    for (const [lang, count] of byLang) {
      dl.innerHTML += `
        <dt>${lang}</dt>
        <dd>${count} line${count === 1 ? '' : 's'}</dd>`;
    }
  }

async function loadData() {
  const data = await d3.csv('loc.csv', row => ({
    ...row,
    line:   +row.line,
    depth:  +row.depth,
    length: +row.length,
    date:    new Date(row.date + 'T00:00' + row.timezone),
    datetime:new Date(row.datetime)
  }));
  return data;
}


/* ── Step 1.2 · compute per-commit summary ───────────────────────── */
function processCommits(data) {
    return d3.groups(data, d => d.commit).map(([commit, lines]) => {
      const first = lines[0];                         // same meta for all lines
      const { author, date, time, timezone, datetime } = first;
  
      const summary = {
        id: commit,
        url: `https://github.com/YOUR_REPO/commit/${commit}`,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60, // 14.5 etc.
        totalLines: lines.length
      };
  
      /* keep original line objects, but hide them from console output */
      Object.defineProperty(summary, 'lines', {
        value: lines,
        enumerable: false           // don’t show when you log the object
      });
  
      return summary;
    });
  }
  

/*  Step 1.3 – summary stats  */
function renderCommitInfo(data, commits) {
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file,
      );
    const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
    const workByPeriod = d3.rollups(
        data,
        (v) => v.length,
        (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
      );
    const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
    const longestLen = d3.max(data, d => d.length);
    const maxDepth   = d3.max(data, d => d.depth);
    const avgDepth   = +d3.mean(data, d => d.depth).toFixed(1);

  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Add more stats as needed...
    dl.append('dt').text('Average line length');
    dl.append('dd').text(averageFileLength);

    /* add Longest line */
    dl.append('dt').text('Longest line');
    dl.append('dd').text(longestLen);

    /* add Maximum depth */
    dl.append('dt').text('Maximum depth');
    dl.append('dd').text(maxDepth);

    /* add Average depth */
    //dl.append('dt').text('Average depth');
    //dl.append('dd').text(avgDepth);
  }
  
  let data = await loadData();
  let commits = processCommits(data);
  
  renderCommitInfo(data, commits);

  function updateTooltipPosition (evt){
    const tip = document.getElementById('commit-tooltip');
    tip.style.left = `${evt.clientX + 12}px`;   // 12 px offset to the right
    tip.style.top  = `${evt.clientY + 12}px`;   // 12 px below
  }
  

/* ──────────────────────────────────────────────────────────────── */
/*  STEP 2 ·  scatter-plot of commits (date  ×  time-of-day)       */
/* ──────────────────────────────────────────────────────────────── */
function renderScatterPlot(data, commits) {

    /* ───── 1. margins + inner area ───── */
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };   // ★
    const width  = 1000;
    const height = 600;
  
    const usableArea = {
      left:   margin.left,
      top:    margin.top,
      right:  width  - margin.right,
      bottom: height - margin.bottom,
      width:  width  - margin.left - margin.right,
      height: height - margin.top  - margin.bottom
    };
  
    /* ───── 2. svg holder (unchanged) ───── */
    const svg = d3.select('#chart')
                  .selectAll('svg')
                  .data([null])
                  .join('svg')
                    .attr('viewBox', `0 0 ${width} ${height}`)
                    .style('overflow', 'visible');

    xScale = d3.scaleTime()
                    .domain(d3.extent(commits, d => d.datetime))
                    .range([usableArea.left, usableArea.right])   // ← use usableArea
                    .nice();
         
    yScale = d3.scaleLinear()
                    .domain([0, 24])
                    .range([usableArea.bottom, usableArea.top]);
    svg
                    .append('g')
                    .attr('transform', `translate(0, ${usableArea.bottom})`)
                    .attr('class', 'x-axis') // new line to mark the g tag
                    .call(xAxis);
                
    svg
                    .append('g')
                    .attr('transform', `translate(${usableArea.left}, 0)`)
                    .attr('class', 'y-axis') // just for consistency
                    .call(yAxis);
    /* ───── 4. grid lines (behind everything) ───── */
    svg.selectAll('.gridlines')
       .data([null])
       .join('g')
         .attr('class', 'gridlines')
         .attr('transform', `translate(${usableArea.left},0)`)        // align left
         .call(
           d3.axisLeft(yScale)
              .tickFormat('')                                     // no labels
              .tickSize(-usableArea.width)                            // full-width ticks
         )
         .selectAll('line')                                       // faint grey
           .attr('stroke', '#ccc')
           .attr('stroke-opacity', 0.3);
  
    /* ───── 5. dots (same as before, but Y after X) ───── */
    svg.selectAll('circle')
       .data(commits)
       .join('circle')
         .attr('cx', d => xScale(d.datetime))
         .attr('cy', d => yScale(d.hourFrac))
         .attr('r', 5)
         .attr('fill', 'steelblue');
  
    /* ───── 6. axes ───── */
    // X-axis (dates)
    svg.selectAll('.x-axis')
       .data([null])
       .join('g')
         .attr('class', 'x-axis')
         .attr('transform', `translate(0,${usableArea.bottom})`)
         .call(d3.axisBottom(xScale));
  
    // Y-axis (time-of-day)
    svg.selectAll('.y-axis')
        .data([null])
        .join('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${usableArea.left},0)`)
            .call(
            d3.axisLeft(yScale)
                .tickFormat(d => String(d % 24).padStart(2, '0') + ':00')  // ▼
            );
      /* ---------- dots ---------------------------------------- */
    const dots = svg.append('g').attr('class','dots');
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt() // Change only this line
        .domain([minLines, maxLines])
        .range([2, 30]);
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots.selectAll('circle')
    .data(sortedCommits)       // 👈 use the sorted array instead of commits
    .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r',  d => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .attr('fill-opacity', .7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).attr('fill-opacity', 1);
        renderTooltipContent(commit);          // your step-3.1 function
        updateTooltipVisibility(true);         // step-3.3 helper
        updateTooltipPosition(event);          // ← NEW
      })
      .on('mouseenter', (ev, d) => {
        d3.select(ev.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(d);
        updateTooltipVisibility(true);
     })
     .on('mouseleave', ev => {
        d3.select(ev.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
     });
    svg.call(d3.brush());
    svg.selectAll('.dots , .overlay ~ *').raise();
    const brush = d3.brush()
  .extent([[usableArea.left, usableArea.top],
           [usableArea.right, usableArea.bottom]])
  .on('start brush end', brushed);

    svg.append('g')
    .attr('class', 'brush')
    .call(brush);

    // bring dots above the overlay so they keep tool-tips
    svg.selectAll('.dots , .overlay ~ *').raise();
        }
  
  /*  ── load → process → render ----------------------------------- */
  (async () => {
    const data    = await loadData();          // you already wrote this
    const commits = processCommits(data);      // you already wrote this
    renderScatterPlot(data, commits);          // ★ new scatter-plot
  })();