function hcil (location) {
  const dataTypes = {
    INTEGER: s => +s,
    STRING:  s => s,
    DOUBLE:  s => +s,
    DATE:    s => new Date(s)
  };

  return new Promise((resolve, reject) => {
    d3.tsv(location, function (error, responseData) {
      if (error) {
        reject(error);
      }
      else {
        let [types, ...data] = responseData;

        data.forEach(d => {
          for (let t in types) {
            d[t] = dataTypes[types[t]](d[t]);
          }
        });

        resolve(data);
      }
    });
  });
}

function draw (nodes, links, spec) {
  let svg = document.querySelector('svg');

  let width  = parseInt(window.getComputedStyle(svg).width),
      height = parseInt(window.getComputedStyle(svg).height);

  // Scales
  let regionX = d3.scaleBand()
    .padding(0.1)
    .domain([0])
    .range([0, width]);

  let regionY = d3.scaleBand()
    .paddingOuter(0.1)
    .paddingInner(0.2)
    .domain(spec.regions.map((d, i) => i))
    .range([0, height]);

  let x = d3.scaleLinear().domain(spec.x.domain).range([0, regionX.bandwidth()]);
      y = d3.scaleLinear().domain(spec.y.domain).range([0, regionY.bandwidth()]);

  // Axes
  let xAxis = d3.axisBottom().scale(x),
      yAxis = d3.axisLeft().scale(y);

  // Rendering
  let region = d3.select(svg).selectAll('.region').data(spec.regions);

  region.exit().remove();

  region
    .enter().append('g')
      .attr('class', 'region')
      .attr('transform', (d, i) => `translate(${regionX(0).toFixed(2)}, ${regionY(i).toFixed(2)})`)
      .call(function (s) {
        s.append('rect')
          .attr('fill',   d => d.fillColor)
          // .attr('x', 1)
          // .attr('y', 1)
          .attr('width',  (regionX.bandwidth()).toFixed(2))
          .attr('height', (regionY.bandwidth()).toFixed(2));

        s.append('g')
          .attr('class', 'nodes')
          .attr('fill', d => d.nodeColor);

        s.append('g')
          .attr('class', 'axes')
          .call(s => {
            s.append('g')
              .attr('class', 'x')
              .attr('transform', `translate(0, ${regionY.bandwidth().toFixed(2)})`)
              .call(xAxis);

            s.append('g')
              .attr('class', 'y')
              .call(yAxis);
          });
      });

  let node = d3.select('svg').selectAll('.region').select('.nodes').selectAll('.node')
    .data(
      r => nodes.filter(d => d[r.attribute] == r.value),
      d => d.ID
    );

  node.exit().remove();

  node
    .enter().append('circle')
      .attr('class', 'node')
      .attr('cx', d => x(d[spec.x.attribute]).toFixed(2))
      .attr('cy', d => y(d[spec.y.attribute]).toFixed(2))
      .attr('r',  13 / 2);
}

document.addEventListener('DOMContentLoaded', function () {
  let requests = Promise.all([
    hcil('/data/friendship_nodes.txt'),
    hcil('/data/friendship_links.txt')
  ]);

  let spec = {
    x: {
      attribute: 'WEIGHT',
      domain:    [100, 200]
    },
    y: {
      attribute: 'HEIGHT',
      domain:    [55, 74]
    },
    regions: [
      {
        attribute: 'SEX',
        value:     'M',
        label:     'Male',
        fillColor: '#99FFFF',
        nodeColor: '#0000CC'
      },
      {
        attribute: 'SEX',
        value:     'F',
        label:     'Female',
        fillColor: '#FFAFAF',
        nodeColor: '#FF0000'
      }
    ]
  };

  requests.then(([nodes, links]) => {
    draw(nodes, links, spec);
  });
});
