console.log('chord.js');

// set the dimensions and margins of the graph
const width = 800
const height = 800

// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black")
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

// Read data
let dataAdj = []
await d3.json("./data/data_adj.json").then(data => {
    dataAdj = data;
})
console.log(dataAdj);
let adjLabels = []
await d3.json("./data/label_adj.json").then(data => {
    adjLabels = data;
})
let positionLabels = []
await d3.json("./data/label_position.json").then(data => {
    positionLabels = data;
})

const allNodes = [...new Set(dataAdj.flatMap(d => d.source).concat(dataAdj.flatMap(d => d.target)))]
const allTargets = [...new Set(dataAdj.map(d => d.target))];

const matrix = new Array(allNodes.length).fill(0).map(() => new Array(allNodes.length).fill(0))

dataAdj.forEach(d => {
    const sourceIndex = allNodes.indexOf(d.source)
    const targetIndex = allNodes.indexOf(d.target)
    matrix[sourceIndex][targetIndex] = d.value
})
console.log(matrix);

const arcPadding = 0.01
const outerRadius = Math.min(width, height) * 0.5 - 100
const innerRadius = outerRadius - 50

const chord = d3.chord()
    .padAngle(arcPadding)
    .sortSubgroups(d3.descending);

const ribbon = d3.ribbon()
    .radius(innerRadius)

const color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(allTargets);

const chords = chord(matrix);
console.log(chords);

const groups = new Map();
chords.forEach(chord => {
    const sourceIndex = chord.source.index;
    if (!groups.has(sourceIndex)) {
        groups.set(sourceIndex, []);
    }
    groups.get(sourceIndex).push(chord);
});


const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

svg.append("g")
    .selectAll("path")
    .data(Array.from(groups.values()))
    .enter()
    .append("path")
    .attr("d", group => {
        return arc({
            startAngle: d3.min(group, d => d.source.startAngle),
            endAngle: d3.max(group, d => d.source.endAngle)
        });
    })
    .style("fill", "none")
    .style("stroke", "black");

svg.append("g")
    .selectAll("path")
    .data(chords)
    .enter()
    .append("path")
    .attr("d", ribbon)
    .style("fill", d => color(d.target.index))
    .style("opacity", 0.7)
    .style("stroke", d => d3.rgb(color(d.target.index)).darker())

svg.append("g")
    .selectAll("text")
    .data(chords.groups)
    .enter()
    .append("text")
    .attr("x", d => (outerRadius - 20) * Math.sin((d.startAngle + d.endAngle) / 2))
    .attr("y", d => -(outerRadius - 20) * Math.cos((d.startAngle + d.endAngle) / 2))
    .text((d, i) => allNodes[i])  // 使用 nodeNames 数组中的名称
    .style("font-size", "7px")
    .style("text-anchor", "middle");