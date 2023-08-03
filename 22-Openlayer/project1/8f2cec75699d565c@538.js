// https://observablehq.com/@pbogden/d3-openlayers@538
function _1(md) {
  return md`
# D3 + OpenLayers

Adadpted from the OpenLayers examples: [D3 Integration](https://openlayers.org/en/latest/examples/d3.html)
and [Mouse Position](https://openlayers.org/en/latest/examples/mouse-position.html)
  `;
}

function _position(html) {
  return html`<div id="mouse-position"></div>`;
}

function _target(html, width) {
  return html`<div style="height:${width / 2}px"></div>`;
}

function _4(md) {
  return md`
### Pick the data displayed on the map
  `;
}

function _features(counties) {
  return counties;
}

function _6(md) {
  return md`
### Add the GeoJSON on a canvas
  `;
}

function _info(html) {
  return html`<div></div>`;
}

function _canvasFunction(d3, features, ol, info, topojson, topo) {
  return function canvasFunction(
    extent,
    resolution,
    pixelRatio,
    size,
    projection
  ) {
    var canvasWidth = size[0];
    var canvasHeight = size[1];

    var canvas = d3.select(document.createElement("canvas"));
    canvas.attr("width", canvasWidth).attr("height", canvasHeight);

    var context = canvas.node().getContext("2d");

    // Trial projection with unit scale is used to compute bounding box
    var d3Projection = d3.geoMercator().scale(1).translate([0, 0]);
    var d3Path = d3.geoPath().projection(d3Projection);

    // Compute the projected planar bounding box (typically in pixels) for the specified GeoJSON object.
    var pixelBounds = d3Path.bounds(features);
    var pixelBoundsWidth = pixelBounds[1][0] - pixelBounds[0][0];
    var pixelBoundsHeight = pixelBounds[1][1] - pixelBounds[0][1];

    // Compute spherical bounding box: [lowerLeft, upperRight]
    var geoBounds = d3.geoBounds(features);

    // Compute the OpenLayers-projected bounding box from spherical bounding box
    var geoBoundsLeftBottom = ol.proj.fromLonLat(geoBounds[0], projection);
    var geoBoundsRightTop = ol.proj.fromLonLat(geoBounds[1], projection);
    var geoBoundsWidth = geoBoundsRightTop[0] - geoBoundsLeftBottom[0];
    if (geoBoundsWidth < 0) {
      geoBoundsWidth += ol.extent.getWidth(projection.getExtent());
    }
    var geoBoundsHeight = geoBoundsRightTop[1] - geoBoundsLeftBottom[1];

    var widthResolution = geoBoundsWidth / pixelBoundsWidth;
    var heightResolution = geoBoundsHeight / pixelBoundsHeight;
    var r = Math.max(widthResolution, heightResolution);
    var scale = r / (resolution / pixelRatio);

    // Print some diagnostics to a cell
    let f = d3.format(" ,d");
    info.innerHTML =
      "Left bottom: " +
      geoBoundsLeftBottom.map(f) +
      "<br>Right top: " +
      geoBoundsRightTop.map(f) +
      "<br>widthResolution, heightResolution: " +
      widthResolution +
      ", " +
      heightResolution;

    var center = ol.proj.toLonLat(ol.extent.getCenter(extent), projection);
    d3Projection
      .scale(scale)
      .center(center)
      .translate([canvasWidth / 2, canvasHeight / 2]);
    d3Path = d3Path.projection(d3Projection).context(context);

    context.beginPath();
    d3Path(
      topojson.mesh(
        topo,
        topo.objects.counties,
        (a, b) => a !== b && ((a.id / 1000) | 0) === ((b.id / 1000) | 0)
      )
    );
    // context.lineWidth = 0.5 / scale;
    context.lineWidth = 1;
    context.strokeStyle = "#aaa";
    context.stroke();

    context.beginPath();
    d3Path(topojson.mesh(topo, topo.objects.states, (a, b) => a !== b));
    //  context.lineWidth = 0.5 / scale;
    context.strokeStyle = "#555";
    context.stroke();

    context.beginPath();
    d3Path(topojson.feature(topo, topo.objects.nation));
    //  context.lineWidth = 1 / scale;
    context.strokeStyle = "#000";
    context.stroke();

    return canvas.node();
  };
}

function _9(md) {
  return md`
## The map
  `;
}

function _map(width, target, ol, invalidation) {
  width;
  target.dispatchEvent(new CustomEvent("input"));

  let tileLayer = new ol.layer.Tile({
    source: new ol.source.OSM(),
  });

  const map = new ol.Map({
    layers: [tileLayer], // Uncomment this line to add the OpenStreetMap layer in the background
    target: target,
    view: new ol.View({
      center: ol.proj.fromLonLat([-97, 38]),
      zoom: 4,
    }),
    controls: ol.control.defaults().extend([new ol.control.ScaleLine()]),
  });

  // Add custom interaction to the map
  target.value = []; // Initial empty selection.
  const select = new ol.interaction.Select();
  select.on("select", (event) => {
    target.value = select.getFeatures().getArray();
    target.dispatchEvent(new CustomEvent("input"));
  });
  map.addInteraction(select);
  // Initialize the target value
  target.dispatchEvent(new CustomEvent("input"));
  invalidation.then(() => map.dispose()); // Specific to OpenLayers

  return map;
}

function _canvasLayer(ol, canvasFunction, map) {
  var layer = new ol.layer.Image({
    source: new ol.source.ImageCanvas({
      canvasFunction: canvasFunction,
      projection: "EPSG:3857",
    }),
  });
  map.addLayer(layer);
  return layer;
}

function _mousePosition(ol, map) {
  let mousePosition = new ol.control.MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(4),
    projection: "EPSG:4326",
    // comment the following two lines to have the mouse position
    // be placed within the map.
    className: "custom-mouse-position",
    target: document.getElementById("mouse-position"),
    undefinedHTML: "&nbsp;",
  });

  map.addControl(mousePosition);
}

function _13(md) {
  return md`
### TopoJSON
  `;
}

function _states(topojson, topo) {
  return topojson.feature(topo, topo.objects.states);
}

function _counties(topojson, topo) {
  return topojson.feature(topo, topo.objects.counties);
}

function _topo(d3) {
  return d3.json("https://pbogden.github.io/mapping/data/topojson/us-10m.json");
}

function _17(md) {
  return md`
## Appendix
  `;
}

async function _ol(require, html) {
  // OpenLayers doesn’t publish a build to npm, so we can’t use unpkg. :(
  const ol =
    await require("https://openlayers.org/en/v5.3.0/build/ol.js").catch(
      () => window.ol
    );
  if (!ol.css)
    ol.css = document.head.appendChild(
      html`<link
        rel="stylesheet"
        href="https://openlayers.org/en/v5.3.0/css/ol.css"
      />`
    );
  return ol;
}

function _d3(require) {
  return require("d3@5", "d3-geo-projection", "d3-scale-chromatic@1");
}

function _topojson(require) {
  return require("topojson-client@3");
}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main
    .variable(observer("viewof position"))
    .define("viewof position", ["html"], _position);
  main
    .variable(observer("position"))
    .define("position", ["Generators", "viewof position"], (G, _) =>
      G.input(_)
    );
  main
    .variable(observer("target"))
    .define("target", ["html", "width"], _target);
  main.variable(observer()).define(["md"], _4);
  main
    .variable(observer("features"))
    .define("features", ["counties"], _features);
  main.variable(observer()).define(["md"], _6);
  main.variable(observer("info")).define("info", ["html"], _info);
  main
    .variable(observer("canvasFunction"))
    .define(
      "canvasFunction",
      ["d3", "features", "ol", "info", "topojson", "topo"],
      _canvasFunction
    );
  main.variable(observer()).define(["md"], _9);
  main
    .variable(observer("map"))
    .define("map", ["width", "target", "ol", "invalidation"], _map);
  main
    .variable(observer("canvasLayer"))
    .define("canvasLayer", ["ol", "canvasFunction", "map"], _canvasLayer);
  main
    .variable(observer("mousePosition"))
    .define("mousePosition", ["ol", "map"], _mousePosition);
  main.variable(observer()).define(["md"], _13);
  main
    .variable(observer("states"))
    .define("states", ["topojson", "topo"], _states);
  main
    .variable(observer("counties"))
    .define("counties", ["topojson", "topo"], _counties);
  main.variable(observer("topo")).define("topo", ["d3"], _topo);
  main.variable(observer()).define(["md"], _17);
  main.variable(observer("ol")).define("ol", ["require", "html"], _ol);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main
    .variable(observer("topojson"))
    .define("topojson", ["require"], _topojson);
  return main;
}
