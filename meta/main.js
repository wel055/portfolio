import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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

/* ──────────────────────────────────────────────────────────────── */
/*  STEP 2 ·  scatter-plot of commits (date  ×  time-of-day)       */
/* ──────────────────────────────────────────────────────────────── */
function renderScatterPlot(data, commits) {
    /*  SVG size --------------------------------------------------- */
    const width  = 1000;
    const height = 600;
  
    /*  create / clear the SVG container --------------------------- */
    const svg = d3.select('#chart')
                  .selectAll('svg')            // reuse if it exists
                  .data([null])
                  .join('svg')
                    .attr('viewBox', `0 0 ${width} ${height}`)
                    .style('overflow', 'visible');
  
    /*  scales ------------------------------------------------------ */
    const xScale = d3.scaleTime()
                     .domain(d3.extent(commits, d => d.datetime))
                     .range([0, width])
                     .nice();                  // “round” ticks
  
    const yScale = d3.scaleLinear()
                     .domain([0, 24])          // 0-24 h
                     .range([height, 0]);      // SVG Y grows downward
  
    /*  dots -------------------------------------------------------- */
    svg.selectAll('circle')
       .data(commits)
       .join('circle')
         .attr('cx', d => xScale(d.datetime))
         .attr('cy', d => yScale(d.hourFrac))
         .attr('r', 5)
         .attr('fill', 'steelblue')
         .append('title')                      // tooltip
           .text(d => `${d.hourFrac.toFixed(2)} h – ${d.author}`);
  
    /*  axes (optional but nice) ----------------------------------- */
    svg.selectAll('.x-axis')
       .data([null])
       .join('g')
         .attr('class', 'x-axis')
         .attr('transform', `translate(0,${height})`)
         .call(d3.axisBottom(xScale));
  
    svg.selectAll('.y-axis')
       .data([null])
       .join('g')
         .attr('class', 'y-axis')
         .call(d3.axisLeft(yScale)
                 .ticks(6)
                 .tickFormat(h => h + ':00'));
  }
  
  /*  ── load → process → render ----------------------------------- */
  (async () => {
    const data    = await loadData();          // you already wrote this
    const commits = processCommits(data);      // you already wrote this
    renderScatterPlot(data, commits);          // ★ new scatter-plot
  })();