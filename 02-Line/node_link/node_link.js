const data = await d3.json('./num004.json')
console.log(data.nodes);

const width = 800,
    height = 800

const svg = d3.select("#node_link")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black")

const color = d3.scaleOrdinal()
    .range(['#F0E5CF', '#E0A292', '#A68A67', '#98B2D1', '#F5D491', '#B2C29F'])
    .domain(['UI设计师', '交互设计师', '视觉设计师', '用户体验', '产品经理', '用户研究']);

// 计算圆的排列位置
const radius = 300; // 圆的半径
const centerX = width / 2;
const centerY = height / 2;
const angleStep = (2 * Math.PI) / data.nodes.length;

// 设置节点的初始位置
data.nodes.forEach((node, index) => {
    const angle = index * angleStep;
    node.x = centerX + radius * Math.cos(angle);
    node.y = centerY + radius * Math.sin(angle);
});


const link = svg.append("g")
    .attr("class", "links")
    .selectAll(".link")
    .data(data.links.filter(item => item.value != '0.0'))
    .enter().append("path")
    .attr("class", "link")
    .style("stroke", d => color(d.target))
    .style("fill", "none");

function distanceToTarget(d) {
    const source = data.nodes[d.source];
    const target = data.nodes[d.target];
    // 计算连接线的长度
    const length = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2));
    return length;
}

const maxDistance = d3.max(data.links, d => distanceToTarget(d));

const curve = d3.line()
    .curve(d3.curveBasis);

link.attr("d", function (d) {
    const source = data.nodes[d.source];
    const target = data.nodes[d.target];
    const distance = distanceToTarget(d);
    const strokeWidth = 2 - (distance / maxDistance * 20); // 根据距离调整线的粗细
    link.style("stroke-width", strokeWidth);
    const controlPointX = (source.x + target.x) / 2.2;
    const controlPointY = (source.y + target.y) / 2.2;
    const pathData = [
        [source.x, source.y],
        [controlPointX, controlPointY], // 调整控制点位置
        [target.x, target.y]
    ];
    return curve(pathData);
});
// 创建节点元素
const node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(data.nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", function (d) {
        if (d.name == "UI设计师" || d.name == "交互设计师" || d.name == "视觉设计师" || d.name == "用户体验" || d.name == "产品经理" || d.name == "用户研究" || d.name == "111") {
            return 10
        }
        else {
            return d.symbolSize * 0.5 + 1
        }
    })

    .style("fill", function (d) {
        if (d.name == "UI设计师" || d.name == "交互设计师" || d.name == "视觉设计师" || d.name == "用户体验" || d.name == "产品经理" || d.name == "用户研究") {
            return color(d.name)
        } else {
            return "grey"
        }
    })
    .style("stroke", function (d) {
        if (d.name == "UI设计师" || d.name == "交互设计师" || d.name == "视觉设计师" || d.name == "用户体验" || d.name == "产品经理" || d.name == "用户研究") {
            return d3.rgb(color(d.name)).darker()
        } else {
            return "black"
        }
    })
    .style("stroke-width", 0.5)
    .style("opacity", function (d) { if (d.name == "111") { return 0 } })
// 更新节点位置
node
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);




// 计算一个较大的圆的半径，用于包围所有节点
const outerRadius = radius + 50; // 假设为原始圆的半径加上一个固定的偏移量

// 设置文本标签的位置，位于较大的圆的外部
const textOffset = 15; // 文本标签距离较大圆的偏移量

const ticks = svg.append("g")
    .attr("class", "ticks")
    .selectAll('text')
    .data(data.nodes)
    .join("text")
    .text(d => d.name)
    .attr("x", centerX) // 文本标签的x坐标设置为中心点的x坐标
    .attr("y", centerY) // 文本标签的y坐标设置为中心点的y坐标
    .style("text-anchor", "middle") // 调整文本对齐方式
    .style("alignment-baseline", "middle")
    .style("font-size", "5px")
    .style("opacity", function (d) {
        if (d.name == "111") {
            return 0
        }
    });
ticks.attr("x", d => {
    const angle = Math.atan2(d.y - centerY, d.x - centerX);
    const newX = centerX + (radius + textOffset) * Math.cos(angle);
    return newX;
})
    .attr("y", d => {
        const angle = Math.atan2(d.y - centerY, d.x - centerX);
        const newY = centerY + (radius + textOffset) * Math.sin(angle);
        return newY;
    });





