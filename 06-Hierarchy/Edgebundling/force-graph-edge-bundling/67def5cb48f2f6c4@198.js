function _1(md) {
  return (
    md`# Force Edge Bundling

Bundles edges together using a force simulation. Adaptation of the [Force Directed Edge Bundling d3 plugin](https://github.com/upphiminn/d3.ForceBundle)  to make it work with ES6 and in Observable, while also fixing [some bugs](https://github.com/upphiminn/d3.ForceBundle/pull/11). Compare with the [hierarchical edge bundling](https://observablehq.com/@d3/hierarchical-edge-bundling).

Make sure no two points have the same x,y coordinates

## Usage

\`\`\`js
import {edgeBundling} from "@john-guerra/force-edge-bundling"

// or if you want the original d3.forceBundle 
import {ForceEdgeBundling} from "@john-guerra/force-edge-bundling"
\`\`\`

Seems a bit slow for larger networks. Here is the original example with airline data

Inspired by the experiment by [Stuart Thompson](https://observablehq.com/@stuartathompson/force-edge-bundling)`
  )
}

function _useEdgeBundling(Inputs) {
  return (
    Inputs.toggle({
      label: "Use Edge Bundling",
      value: true
    })
  )
}

function _compatibility_threshold(Inputs) {
  return (
    Inputs.range([0, 1], {
      label: "Compatibility threshold",
      value: 0.6,
      step: 0.01
    })
  )
}

function _bundling_stiffness(Inputs) {
  return (
    Inputs.range([0, 60], {
      label: "Bundling Stiffness",
      value: 0.1,
      step: 0.01
    })
  )
}

function _step_size(Inputs) {
  return (
    Inputs.range([0, 1], {
      label: "Step Size",
      value: 0.2,
      step: 0.01
    })
  )
}

function _6(edgeBundling, airlinesGraph, compatibility_threshold, bundling_stiffness, step_size, drawGraph) {
  // run the edgeBundling, resulting paths stored in airlinesGraph.links[i].path
  const bundling = edgeBundling(airlinesGraph, {
    compatibility_threshold,
    bundling_stiffness,
    step_size
  });

  // use bundling.update() to recompute, useful inside the tick function of a forceSimulation

  return drawGraph(airlinesGraph);
}


function _7(edgeBundling, compatibility_threshold, bundling_stiffness, step_size, drawGraph) {
  const nodes = [
    { id: "a", x: 5, y: 15 },
    { id: "b", x: 17, y: 14 },
    { id: "c", x: 17, y: 15 },
    { id: "d", x: 17, y: 20 }
  ],
    links = [
      { source: "a", target: "b" },
      { source: "a", target: "c" },
      { source: "a", target: "d" },
    ];
  const bundling = edgeBundling(
    { nodes, links },
    {
      compatibility_threshold,
      bundling_stiffness,
      step_size
    }
  );
  // then links will contain the bundles in the path attribute

  return drawGraph({ nodes, links });

  // (Optional) To update the bundling call, useful for force simulations
  bundling.update();
}


function _drawGraph(d3, width, height, useEdgeBundling) {
  return (
    function drawGraph({ nodes, links }) {
      const svg = d3
        .create("svg")
        .attr("viewBox", [-10, -10, width + 20, height + 20]);

      const x = d3
        .scaleLinear()
        .domain(d3.extent(nodes, (d) => d.x))
        .range([0, width])
        .nice();
      const y = d3
        .scaleLinear()
        .domain(d3.extent(nodes, (d) => d.y))
        .range([0, height])
        .nice();
      const line = d3
        .line()
        .x((d) => x(d.x))
        .y((d) => y(d.y));

      svg
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("cx", (d) => x(d.x))
        .attr("cy", (d) => y(d.y))
        .attr("r", 2);

      if (useEdgeBundling) {
        svg
          .selectAll("path")
          .data(links)
          .join("path")
          .attr("d", (d) => line(d.path))
          .attr("fill", "none")
          .attr("stroke", "#aaa3");
      } else {
        const nodesMap = new Map(nodes.map(d => [d.id, d]))
        svg
          .selectAll("line")
          .data(links)
          .join("line")
          .attr("x1", (d) => x(nodesMap.get(d.source).x))
          .attr("y1", (d) => y(nodesMap.get(d.source).y))
          .attr("x2", (d) => x(nodesMap.get(d.target).x))
          .attr("y2", (d) => y(nodesMap.get(d.target).y))
          .attr("fill", "none")
          .attr("stroke", "#aaa3");
      }

      return svg.node();
    }
  )
}

function _edgeBundling(ForceEdgeBundling) {
  return (
    function edgeBundling(
      {
        nodes, // Array of nodes including x and y coords e.g. [{id: "a", x: 10, y:10}, {id: "b", x: 20, y: 20}, ...]
        links // Array of links in D3 forceSimulation format e.g. [{source: "a", target: "b"}, ... ]
      },
      {
        id = (d) => d.id,
        pathAttr = "path", // name of the attribute to save the paths
        bundling_stiffness = 0.1, // global bundling constant controlling edge stiffness
        step_size = 0.1, // init. distance to move points
        subdivision_rate = 2, // subdivision rate increase
        cycles = 6, // number of cycles to perform
        iterations = 90, // init. number of iterations for cycle
        iterations_rate = 0.6666667, // rate at which iteration number decreases i.e. 2/3
        compatibility_threshold = 0.6 //  "which pairs of edges should be considered compatible (default is set to 0.6, 60% compatiblity)"
      } = {}
    ) {
      // The library wants the links as the index positions in the nodes array
      const dNodes = new Map(nodes.map((d, i) => [id(d), i]));
      const linksIs = links.map((l) => ({
        source: dNodes.get(typeof l.source === "object" ? id(l.source) : l.source),
        target: dNodes.get(typeof l.source === "object" ? id(l.target) : l.target)
      }));

      const edgeBundling = ForceEdgeBundling()
        .nodes(nodes)
        .edges(linksIs)
        .bundling_stiffness(bundling_stiffness)
        .step_size(step_size)
        .subdivision_rate(subdivision_rate)
        .cycles(cycles)
        .iterations(iterations)
        .iterations_rate(iterations_rate)
        .compatibility_threshold(compatibility_threshold);

      edgeBundling.update = () => {
        const paths = edgeBundling();
        links.map((l, i) => (l[pathAttr] = paths[i]));
      };

      edgeBundling.update();

      return edgeBundling;
    }
  )
}

function _ForceEdgeBundling() {
  return (
    function () {
      let data_nodes = {}, // {'nodeid':{'x':,'y':},..}
        data_edges = [], // [{'source':'nodeid1', 'target':'nodeid2'},..]
        compatibility_list_for_edge = [],
        subdivision_points_for_edge = [],
        K = 0.1, // global bundling constant controlling edge stiffness
        S_initial = 0.1, // init. distance to move points
        P_initial = 1, // init. subdivision number
        P_rate = 2, // subdivision rate increase
        C = 6, // number of cycles to perform
        I_initial = 90, // init. number of iterations for cycle
        I_rate = 0.6666667, // rate at which iteration number decreases i.e. 2/3
        compatibility_threshold = 0.6,
        eps = 1e-6,
        P = null;

      /*** Geometry Helper Methods ***/
      function vector_dot_product(p, q) {
        return p.x * q.x + p.y * q.y;
      }

      function edge_as_vector(P) {
        return {
          x: data_nodes[P.target].x - data_nodes[P.source].x,
          y: data_nodes[P.target].y - data_nodes[P.source].y
        };
      }

      function edge_length(e) {
        // handling nodes that are on the same location, so that K/edge_length != Inf
        if (
          Math.abs(data_nodes[e.source].x - data_nodes[e.target].x) < eps &&
          Math.abs(data_nodes[e.source].y - data_nodes[e.target].y) < eps
        ) {
          return eps;
        }

        return Math.sqrt(
          Math.pow(data_nodes[e.source].x - data_nodes[e.target].x, 2) +
          Math.pow(data_nodes[e.source].y - data_nodes[e.target].y, 2)
        );
      }

      function custom_edge_length(e) {
        return Math.sqrt(
          Math.pow(e.source.x - e.target.x, 2) +
          Math.pow(e.source.y - e.target.y, 2)
        );
      }

      function edge_midpoint(e) {
        let middle_x = (data_nodes[e.source].x + data_nodes[e.target].x) / 2.0;
        let middle_y = (data_nodes[e.source].y + data_nodes[e.target].y) / 2.0;

        return {
          x: middle_x,
          y: middle_y
        };
      }

      function compute_divided_edge_length(e_idx) {
        let length = 0;

        for (let i = 1; i < subdivision_points_for_edge[e_idx].length; i++) {
          let segment_length = euclidean_distance(
            subdivision_points_for_edge[e_idx][i],
            subdivision_points_for_edge[e_idx][i - 1]
          );
          length += segment_length;
        }

        return length;
      }

      function euclidean_distance(p, q) {
        return Math.sqrt(Math.pow(p.x - q.x, 2) + Math.pow(p.y - q.y, 2));
      }

      function project_point_on_line(p, Q) {
        let L = Math.sqrt(
          (Q.target.x - Q.source.x) * (Q.target.x - Q.source.x) +
          (Q.target.y - Q.source.y) * (Q.target.y - Q.source.y)
        );
        let r =
          ((Q.source.y - p.y) * (Q.source.y - Q.target.y) -
            (Q.source.x - p.x) * (Q.target.x - Q.source.x)) /
          (L * L);

        return {
          x: Q.source.x + r * (Q.target.x - Q.source.x),
          y: Q.source.y + r * (Q.target.y - Q.source.y)
        };
      }

      /*** ********************** ***/

      /*** Initialization Methods ***/
      function initialize_edge_subdivisions() {
        for (let i = 0; i < data_edges.length; i++) {
          if (P_initial === 1) {
            subdivision_points_for_edge[i] = []; //0 subdivisions
          } else {
            subdivision_points_for_edge[i] = [];
            subdivision_points_for_edge[i].push(data_nodes[data_edges[i].source]);
            subdivision_points_for_edge[i].push(data_nodes[data_edges[i].target]);
          }
        }
      }

      function initialize_compatibility_lists() {
        for (let i = 0; i < data_edges.length; i++) {
          compatibility_list_for_edge[i] = []; //0 compatible edges.
        }
      }

      function filter_self_loops(edgelist) {
        let filtered_edge_list = [];

        for (let e = 0; e < edgelist.length; e++) {
          if (
            data_nodes[edgelist[e].source].x != data_nodes[edgelist[e].target].x ||
            data_nodes[edgelist[e].source].y != data_nodes[edgelist[e].target].y
          ) {
            //or smaller than eps
            filtered_edge_list.push(edgelist[e]);
          }
        }

        return filtered_edge_list;
      }

      /*** ********************** ***/

      /*** Force Calculation Methods ***/
      function apply_spring_force(e_idx, i, kP) {
        let prev = subdivision_points_for_edge[e_idx][i - 1];
        let next = subdivision_points_for_edge[e_idx][i + 1];
        let crnt = subdivision_points_for_edge[e_idx][i];
        let x = prev.x - crnt.x + next.x - crnt.x;
        let y = prev.y - crnt.y + next.y - crnt.y;

        x *= kP;
        y *= kP;

        return {
          x: x,
          y: y
        };
      }

      function apply_electrostatic_force(e_idx, i) {
        let sum_of_forces = {
          x: 0,
          y: 0
        };
        let compatible_edges_list = compatibility_list_for_edge[e_idx];

        for (let oe = 0; oe < compatible_edges_list.length; oe++) {
          let force = {
            x:
              subdivision_points_for_edge[compatible_edges_list[oe]][i].x -
              subdivision_points_for_edge[e_idx][i].x,
            y:
              subdivision_points_for_edge[compatible_edges_list[oe]][i].y -
              subdivision_points_for_edge[e_idx][i].y
          };

          if (Math.abs(force.x) > eps || Math.abs(force.y) > eps) {
            let diff =
              1 /
              Math.pow(
                custom_edge_length({
                  source: subdivision_points_for_edge[compatible_edges_list[oe]][i],
                  target: subdivision_points_for_edge[e_idx][i]
                }),
                1
              );

            sum_of_forces.x += force.x * diff;
            sum_of_forces.y += force.y * diff;
          }
        }

        return sum_of_forces;
      }

      function apply_resulting_forces_on_subdivision_points(e_idx, P, S) {
        let kP = K / (edge_length(data_edges[e_idx]) * (P + 1)); // kP=K/|P|(number of segments), where |P| is the initial length of edge P.
        // (length * (num of sub division pts - 1))
        let resulting_forces_for_subdivision_points = [
          {
            x: 0,
            y: 0
          }
        ];

        for (let i = 1; i < P + 1; i++) {
          // exclude initial end points of the edge 0 and P+1
          let resulting_force = {
            x: 0,
            y: 0
          };

          let spring_force = apply_spring_force(e_idx, i, kP);
          let electrostatic_force = apply_electrostatic_force(e_idx, i, S);

          resulting_force.x = S * (spring_force.x + electrostatic_force.x);
          resulting_force.y = S * (spring_force.y + electrostatic_force.y);

          resulting_forces_for_subdivision_points.push(resulting_force);
        }

        resulting_forces_for_subdivision_points.push({
          x: 0,
          y: 0
        });

        return resulting_forces_for_subdivision_points;
      }

      /*** ********************** ***/

      /*** Edge Division Calculation Methods ***/
      function update_edge_divisions(P) {
        for (let e_idx = 0; e_idx < data_edges.length; e_idx++) {
          if (P === 1) {
            subdivision_points_for_edge[e_idx].push(
              data_nodes[data_edges[e_idx].source]
            ); // source
            subdivision_points_for_edge[e_idx].push(
              edge_midpoint(data_edges[e_idx])
            ); // mid point
            subdivision_points_for_edge[e_idx].push(
              data_nodes[data_edges[e_idx].target]
            ); // target
          } else {
            let divided_edge_length = compute_divided_edge_length(e_idx);
            let segment_length = divided_edge_length / (P + 1);
            let current_segment_length = segment_length;
            let new_subdivision_points = [];
            new_subdivision_points.push(data_nodes[data_edges[e_idx].source]); //source

            for (let i = 1; i < subdivision_points_for_edge[e_idx].length; i++) {
              let old_segment_length = euclidean_distance(
                subdivision_points_for_edge[e_idx][i],
                subdivision_points_for_edge[e_idx][i - 1]
              );

              while (old_segment_length > current_segment_length) {
                let percent_position = current_segment_length / old_segment_length;
                let new_subdivision_point_x =
                  subdivision_points_for_edge[e_idx][i - 1].x;
                let new_subdivision_point_y =
                  subdivision_points_for_edge[e_idx][i - 1].y;

                new_subdivision_point_x +=
                  percent_position *
                  (subdivision_points_for_edge[e_idx][i].x -
                    subdivision_points_for_edge[e_idx][i - 1].x);
                new_subdivision_point_y +=
                  percent_position *
                  (subdivision_points_for_edge[e_idx][i].y -
                    subdivision_points_for_edge[e_idx][i - 1].y);
                new_subdivision_points.push({
                  x: new_subdivision_point_x,
                  y: new_subdivision_point_y
                });

                old_segment_length -= current_segment_length;
                current_segment_length = segment_length;
              }
              current_segment_length -= old_segment_length;
            }
            new_subdivision_points.push(data_nodes[data_edges[e_idx].target]); //target
            subdivision_points_for_edge[e_idx] = new_subdivision_points;
          }
        }
      }

      /*** ********************** ***/

      /*** Edge compatibility measures ***/
      function angle_compatibility(P, Q) {
        return Math.abs(
          vector_dot_product(edge_as_vector(P), edge_as_vector(Q)) /
          (edge_length(P) * edge_length(Q))
        );
      }

      function scale_compatibility(P, Q) {
        let lavg = (edge_length(P) + edge_length(Q)) / 2.0;
        return (
          2.0 /
          (lavg / Math.min(edge_length(P), edge_length(Q)) +
            Math.max(edge_length(P), edge_length(Q)) / lavg)
        );
      }

      function position_compatibility(P, Q) {
        let lavg = (edge_length(P) + edge_length(Q)) / 2.0;
        let midP = {
          x: (data_nodes[P.source].x + data_nodes[P.target].x) / 2.0,
          y: (data_nodes[P.source].y + data_nodes[P.target].y) / 2.0
        };
        let midQ = {
          x: (data_nodes[Q.source].x + data_nodes[Q.target].x) / 2.0,
          y: (data_nodes[Q.source].y + data_nodes[Q.target].y) / 2.0
        };

        return lavg / (lavg + euclidean_distance(midP, midQ));
      }

      function edge_visibility(P, Q) {
        let I0 = project_point_on_line(data_nodes[Q.source], {
          source: data_nodes[P.source],
          target: data_nodes[P.target]
        });
        let I1 = project_point_on_line(data_nodes[Q.target], {
          source: data_nodes[P.source],
          target: data_nodes[P.target]
        }); //send actual edge points positions
        let midI = {
          x: (I0.x + I1.x) / 2.0,
          y: (I0.y + I1.y) / 2.0
        };
        let midP = {
          x: (data_nodes[P.source].x + data_nodes[P.target].x) / 2.0,
          y: (data_nodes[P.source].y + data_nodes[P.target].y) / 2.0
        };

        return Math.max(
          0,
          1 - (2 * euclidean_distance(midP, midI)) / euclidean_distance(I0, I1)
        );
      }

      function visibility_compatibility(P, Q) {
        return Math.min(edge_visibility(P, Q), edge_visibility(Q, P));
      }

      function compatibility_score(P, Q) {
        return (
          angle_compatibility(P, Q) *
          scale_compatibility(P, Q) *
          position_compatibility(P, Q) *
          visibility_compatibility(P, Q)
        );
      }

      function are_compatible(P, Q) {
        return compatibility_score(P, Q) >= compatibility_threshold;
      }

      function compute_compatibility_lists() {
        for (let e = 0; e < data_edges.length - 1; e++) {
          for (let oe = e + 1; oe < data_edges.length; oe++) {
            // don't want any duplicates
            if (are_compatible(data_edges[e], data_edges[oe])) {
              compatibility_list_for_edge[e].push(oe);
              compatibility_list_for_edge[oe].push(e);
            }
          }
        }
      }

      /*** ************************ ***/

      /*** Main Bundling Loop Methods ***/
      let forcebundle = function () {
        let S = S_initial;
        let I = I_initial;
        let P = P_initial;

        initialize_edge_subdivisions();
        initialize_compatibility_lists();
        update_edge_divisions(P);
        compute_compatibility_lists();

        for (let cycle = 0; cycle < C; cycle++) {
          for (let iteration = 0; iteration < I; iteration++) {
            let forces = [];
            for (let edge = 0; edge < data_edges.length; edge++) {
              forces[edge] = apply_resulting_forces_on_subdivision_points(
                edge,
                P,
                S
              );
            }
            for (let e = 0; e < data_edges.length; e++) {
              for (let i = 0; i < P + 1; i++) {
                subdivision_points_for_edge[e][i].x += forces[e][i].x;
                subdivision_points_for_edge[e][i].y += forces[e][i].y;
              }
            }
          }
          // prepare for next cycle
          S = S / 2;
          P = P * P_rate;
          I = I_rate * I;

          update_edge_divisions(P);
          //console.log('C' + cycle);
          //console.log('P' + P);
          //console.log('S' + S);
        }
        return subdivision_points_for_edge;
      };
      /*** ************************ ***/

      /*** Getters/Setters Methods ***/
      forcebundle.nodes = function (nl) {
        if (arguments.length === 0) {
          return data_nodes;
        } else {
          data_nodes = nl;
        }

        return forcebundle;
      };

      forcebundle.edges = function (ll) {
        if (arguments.length === 0) {
          return data_edges;
        } else {
          data_edges = filter_self_loops(ll); //remove edges to from to the same point
        }

        return forcebundle;
      };

      forcebundle.bundling_stiffness = function (k) {
        if (arguments.length === 0) {
          return K;
        } else {
          K = k;
        }

        return forcebundle;
      };

      forcebundle.step_size = function (step) {
        if (arguments.length === 0) {
          return S_initial;
        } else {
          S_initial = step;
        }

        return forcebundle;
      };

      forcebundle.cycles = function (c) {
        if (arguments.length === 0) {
          return C;
        } else {
          C = c;
        }

        return forcebundle;
      };

      forcebundle.iterations = function (i) {
        if (arguments.length === 0) {
          return I_initial;
        } else {
          I_initial = i;
        }

        return forcebundle;
      };

      forcebundle.iterations_rate = function (i) {
        if (arguments.length === 0) {
          return I_rate;
        } else {
          I_rate = i;
        }

        return forcebundle;
      };

      forcebundle.subdivision_points_seed = function (p) {
        if (arguments.length == 0) {
          return P;
        } else {
          P = p;
        }

        return forcebundle;
      };

      forcebundle.subdivision_rate = function (r) {
        if (arguments.length === 0) {
          return P_rate;
        } else {
          P_rate = r;
        }

        return forcebundle;
      };

      forcebundle.compatibility_threshold = function (t) {
        if (arguments.length === 0) {
          return compatibility_threshold;
        } else {
          compatibility_threshold = t;
        }

        return forcebundle;
      };

      /*** ************************ ***/

      return forcebundle;
    }
  )
}

function _height() {
  return (
    500
  )
}

function _airlinesGraph(FileAttachment) {
  return (
    FileAttachment("airlines@1.json").json()
  )
}

function _13(md) {
  return (
    md`## LICENSE

GNU GENERAL PUBLIC LICENSE
                       Version 2, June 1991

 Copyright (C) 1989, 1991 Free Software Foundation, Inc., <http://fsf.org/>
 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The licenses for most software are designed to take away your
freedom to share and change it.  By contrast, the GNU General Public
License is intended to guarantee your freedom to share and change free
software--to make sure the software is free for all its users.  This
General Public License applies to most of the Free Software
Foundation's software and to any other program whose authors commit to
using it.  (Some other Free Software Foundation software is covered by
the GNU Lesser General Public License instead.)  You can apply it to
your programs, too.

  When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that you
have the freedom to distribute copies of free software (and charge for
this service if you wish), that you receive source code or can get it
if you want it, that you can change the software or use pieces of it
in new free programs; and that you know you can do these things.

  To protect your rights, we need to make restrictions that forbid
anyone to deny you these rights or to ask you to surrender the rights.
These restrictions translate to certain responsibilities for you if you
distribute copies of the software, or if you modify it.

  For example, if you distribute copies of such a program, whether
gratis or for a fee, you must give the recipients all the rights that
you have.  You must make sure that they, too, receive or can get the
source code.  And you must show them these terms so they know their
rights.

  We protect your rights with two steps: (1) copyright the software, and
(2) offer you this license which gives you legal permission to copy,
distribute and/or modify the software.

  Also, for each author's protection and ours, we want to make certain
that everyone understands that there is no warranty for this free
software.  If the software is modified by someone else and passed on, we
want its recipients to know that what they have is not the original, so
that any problems introduced by others will not reflect on the original
authors' reputations.

  Finally, any free program is threatened constantly by software
patents.  We wish to avoid the danger that redistributors of a free
program will individually obtain patent licenses, in effect making the
program proprietary.  To prevent this, we have made it clear that any
patent must be licensed for everyone's free use or not licensed at all.

  The precise terms and conditions for copying, distribution and
modification follow.

                    GNU GENERAL PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. This License applies to any program or other work which contains
a notice placed by the copyright holder saying it may be distributed
under the terms of this General Public License.  The "Program", below,
refers to any such program or work, and a "work based on the Program"
means either the Program or any derivative work under copyright law:
that is to say, a work containing the Program or a portion of it,
either verbatim or with modifications and/or translated into another
language.  (Hereinafter, translation is included without limitation in
the term "modification".)  Each licensee is addressed as "you".

Activities other than copying, distribution and modification are not
covered by this License; they are outside its scope.  The act of
running the Program is not restricted, and the output from the Program
is covered only if its contents constitute a work based on the
Program (independent of having been made by running the Program).
Whether that is true depends on what the Program does.

  1. You may copy and distribute verbatim copies of the Program's
source code as you receive it, in any medium, provided that you
conspicuously and appropriately publish on each copy an appropriate
copyright notice and disclaimer of warranty; keep intact all the
notices that refer to this License and to the absence of any warranty;
and give any other recipients of the Program a copy of this License
along with the Program.

You may charge a fee for the physical act of transferring a copy, and
you may at your option offer warranty protection in exchange for a fee.

  2. You may modify your copy or copies of the Program or any portion
of it, thus forming a work based on the Program, and copy and
distribute such modifications or work under the terms of Section 1
above, provided that you also meet all of these conditions:

    a) You must cause the modified files to carry prominent notices
    stating that you changed the files and the date of any change.

    b) You must cause any work that you distribute or publish, that in
    whole or in part contains or is derived from the Program or any
    part thereof, to be licensed as a whole at no charge to all third
    parties under the terms of this License.

    c) If the modified program normally reads commands interactively
    when run, you must cause it, when started running for such
    interactive use in the most ordinary way, to print or display an
    announcement including an appropriate copyright notice and a
    notice that there is no warranty (or else, saying that you provide
    a warranty) and that users may redistribute the program under
    these conditions, and telling the user how to view a copy of this
    License.  (Exception: if the Program itself is interactive but
    does not normally print such an announcement, your work based on
    the Program is not required to print an announcement.)

These requirements apply to the modified work as a whole.  If
identifiable sections of that work are not derived from the Program,
and can be reasonably considered independent and separate works in
themselves, then this License, and its terms, do not apply to those
sections when you distribute them as separate works.  But when you
distribute the same sections as part of a whole which is a work based
on the Program, the distribution of the whole must be on the terms of
this License, whose permissions for other licensees extend to the
entire whole, and thus to each and every part regardless of who wrote it.

Thus, it is not the intent of this section to claim rights or contest
your rights to work written entirely by you; rather, the intent is to
exercise the right to control the distribution of derivative or
collective works based on the Program.

In addition, mere aggregation of another work not based on the Program
with the Program (or with a work based on the Program) on a volume of
a storage or distribution medium does not bring the other work under
the scope of this License.

  3. You may copy and distribute the Program (or a work based on it,
under Section 2) in object code or executable form under the terms of
Sections 1 and 2 above provided that you also do one of the following:

    a) Accompany it with the complete corresponding machine-readable
    source code, which must be distributed under the terms of Sections
    1 and 2 above on a medium customarily used for software interchange; or,

    b) Accompany it with a written offer, valid for at least three
    years, to give any third party, for a charge no more than your
    cost of physically performing source distribution, a complete
    machine-readable copy of the corresponding source code, to be
    distributed under the terms of Sections 1 and 2 above on a medium
    customarily used for software interchange; or,

    c) Accompany it with the information you received as to the offer
    to distribute corresponding source code.  (This alternative is
    allowed only for noncommercial distribution and only if you
    received the program in object code or executable form with such
    an offer, in accord with Subsection b above.)

The source code for a work means the preferred form of the work for
making modifications to it.  For an executable work, complete source
code means all the source code for all modules it contains, plus any
associated interface definition files, plus the scripts used to
control compilation and installation of the executable.  However, as a
special exception, the source code distributed need not include
anything that is normally distributed (in either source or binary
form) with the major components (compiler, kernel, and so on) of the
operating system on which the executable runs, unless that component
itself accompanies the executable.

If distribution of executable or object code is made by offering
access to copy from a designated place, then offering equivalent
access to copy the source code from the same place counts as
distribution of the source code, even though third parties are not
compelled to copy the source along with the object code.

  4. You may not copy, modify, sublicense, or distribute the Program
except as expressly provided under this License.  Any attempt
otherwise to copy, modify, sublicense or distribute the Program is
void, and will automatically terminate your rights under this License.
However, parties who have received copies, or rights, from you under
this License will not have their licenses terminated so long as such
parties remain in full compliance.

  5. You are not required to accept this License, since you have not
signed it.  However, nothing else grants you permission to modify or
distribute the Program or its derivative works.  These actions are
prohibited by law if you do not accept this License.  Therefore, by
modifying or distributing the Program (or any work based on the
Program), you indicate your acceptance of this License to do so, and
all its terms and conditions for copying, distributing or modifying
the Program or works based on it.

  6. Each time you redistribute the Program (or any work based on the
Program), the recipient automatically receives a license from the
original licensor to copy, distribute or modify the Program subject to
these terms and conditions.  You may not impose any further
restrictions on the recipients' exercise of the rights granted herein.
You are not responsible for enforcing compliance by third parties to
this License.

  7. If, as a consequence of a court judgment or allegation of patent
infringement or for any other reason (not limited to patent issues),
conditions are imposed on you (whether by court order, agreement or
otherwise) that contradict the conditions of this License, they do not
excuse you from the conditions of this License.  If you cannot
distribute so as to satisfy simultaneously your obligations under this
License and any other pertinent obligations, then as a consequence you
may not distribute the Program at all.  For example, if a patent
license would not permit royalty-free redistribution of the Program by
all those who receive copies directly or indirectly through you, then
the only way you could satisfy both it and this License would be to
refrain entirely from distribution of the Program.

If any portion of this section is held invalid or unenforceable under
any particular circumstance, the balance of the section is intended to
apply and the section as a whole is intended to apply in other
circumstances.

It is not the purpose of this section to induce you to infringe any
patents or other property right claims or to contest validity of any
such claims; this section has the sole purpose of protecting the
integrity of the free software distribution system, which is
implemented by public license practices.  Many people have made
generous contributions to the wide range of software distributed
through that system in reliance on consistent application of that
system; it is up to the author/donor to decide if he or she is willing
to distribute software through any other system and a licensee cannot
impose that choice.

This section is intended to make thoroughly clear what is believed to
be a consequence of the rest of this License.

  8. If the distribution and/or use of the Program is restricted in
certain countries either by patents or by copyrighted interfaces, the
original copyright holder who places the Program under this License
may add an explicit geographical distribution limitation excluding
those countries, so that distribution is permitted only in or among
countries not thus excluded.  In such case, this License incorporates
the limitation as if written in the body of this License.

  9. The Free Software Foundation may publish revised and/or new versions
of the General Public License from time to time.  Such new versions will
be similar in spirit to the present version, but may differ in detail to
address new problems or concerns.

Each version is given a distinguishing version number.  If the Program
specifies a version number of this License which applies to it and "any
later version", you have the option of following the terms and conditions
either of that version or of any later version published by the Free
Software Foundation.  If the Program does not specify a version number of
this License, you may choose any version ever published by the Free Software
Foundation.

  10. If you wish to incorporate parts of the Program into other free
programs whose distribution conditions are different, write to the author
to ask for permission.  For software which is copyrighted by the Free
Software Foundation, write to the Free Software Foundation; we sometimes
make exceptions for this.  Our decision will be guided by the two goals
of preserving the free status of all derivatives of our free software and
of promoting the sharing and reuse of software generally.

                            NO WARRANTY

  11. BECAUSE THE PROGRAM IS LICENSED FREE OF CHARGE, THERE IS NO WARRANTY
FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW.  EXCEPT WHEN
OTHERWISE STATED IN WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES
PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED
OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.  THE ENTIRE RISK AS
TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU.  SHOULD THE
PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL NECESSARY SERVICING,
REPAIR OR CORRECTION.

  12. IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING
WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MAY MODIFY AND/OR
REDISTRIBUTE THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES,
INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING
OUT OF THE USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED
TO LOSS OF DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY
YOU OR THIRD PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER
PROGRAMS), EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE
POSSIBILITY OF SUCH DAMAGES.

                     END OF TERMS AND CONDITIONS

            How to Apply These Terms to Your New Programs

  If you develop a new program, and you want it to be of the greatest
possible use to the public, the best way to achieve this is to make it
free software which everyone can redistribute and change under these terms.

  To do so, attach the following notices to the program.  It is safest
to attach them to the start of each source file to most effectively
convey the exclusion of warranty; and each file should have at least
the "copyright" line and a pointer to where the full notice is found.

    {description}
    Copyright (C) {year}  {fullname}

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

Also add information on how to contact you by electronic and paper mail.

If the program is interactive, make it output a short notice like this
when it starts in an interactive mode:

    Gnomovision version 69, Copyright (C) year name of author
    Gnomovision comes with ABSOLUTELY NO WARRANTY; for details type \`show w'.
    This is free software, and you are welcome to redistribute it
    under certain conditions; type \`show c' for details.

The hypothetical commands \`show w' and \`show c' should show the appropriate
parts of the General Public License.  Of course, the commands you use may
be called something other than \`show w' and \`show c'; they could even be
mouse-clicks or menu items--whatever suits your program.

You should also get your employer (if you work as a programmer) or your
school, if any, to sign a "copyright disclaimer" for the program, if
necessary.  Here is a sample; alter the names:

  Yoyodyne, Inc., hereby disclaims all copyright interest in the program
  \`Gnomovision' (which makes passes at compilers) written by James Hacker.

  {signature of Ty Coon}, 1 April 1989
  Ty Coon, President of Vice

This General Public License does not permit incorporating your program into
proprietary programs.  If your program is a subroutine library, you may
consider it more useful to permit linking proprietary applications with the
library.  If this is what you want to do, use the GNU Lesser General
Public License instead of this License.`
  )
}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["airlines@1.json", { url: new URL("./files/8c4c24c2789793540bd1c9dd52996cd55fc1e1916bd1c9f8fcc460594e8e8e7ca2552954b00aa48ceb724f8bdb4cf14257c9f7fdcb5470ee43470f17dce7a0c3.json", import.meta.url), mimeType: "application/json", toString }]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof useEdgeBundling")).define("viewof useEdgeBundling", ["Inputs"], _useEdgeBundling);
  main.variable(observer("useEdgeBundling")).define("useEdgeBundling", ["Generators", "viewof useEdgeBundling"], (G, _) => G.input(_));
  main.variable(observer("viewof compatibility_threshold")).define("viewof compatibility_threshold", ["Inputs"], _compatibility_threshold);
  main.variable(observer("compatibility_threshold")).define("compatibility_threshold", ["Generators", "viewof compatibility_threshold"], (G, _) => G.input(_));
  main.variable(observer("viewof bundling_stiffness")).define("viewof bundling_stiffness", ["Inputs"], _bundling_stiffness);
  main.variable(observer("bundling_stiffness")).define("bundling_stiffness", ["Generators", "viewof bundling_stiffness"], (G, _) => G.input(_));
  main.variable(observer("viewof step_size")).define("viewof step_size", ["Inputs"], _step_size);
  main.variable(observer("step_size")).define("step_size", ["Generators", "viewof step_size"], (G, _) => G.input(_));
  main.variable(observer()).define(["edgeBundling", "airlinesGraph", "compatibility_threshold", "bundling_stiffness", "step_size", "drawGraph"], _6);
  main.variable(observer()).define(["edgeBundling", "compatibility_threshold", "bundling_stiffness", "step_size", "drawGraph"], _7);
  main.variable(observer("drawGraph")).define("drawGraph", ["d3", "width", "height", "useEdgeBundling"], _drawGraph);
  main.variable(observer("edgeBundling")).define("edgeBundling", ["ForceEdgeBundling"], _edgeBundling);
  main.variable(observer("ForceEdgeBundling")).define("ForceEdgeBundling", _ForceEdgeBundling);
  main.variable(observer("height")).define("height", _height);
  main.variable(observer("airlinesGraph")).define("airlinesGraph", ["FileAttachment"], _airlinesGraph);
  main.variable(observer()).define(["md"], _13);
  return main;
}
