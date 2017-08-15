//
// JsPlumb (https://jsplumbtoolkit.com/) based flow diagram.
//

/*global jsPlumb: true */ 
/*global DIAGRAM_PAGE: true */ 

Object.assign(jsPlumb.Defaults, {
  Container: "tduck-diagram",
  Connector: ["Straight", {curviness:100, gap: 20}],
  Endpoint: "Blank",
  Anchor: "Continuous",
  PaintStyle : { strokeWidth : 10 },
});

var oneArrow = [
  ["Arrow" , { width:22, length:22, location:0.999 }],
];

// eslint-disable-next-line no-unused-vars
var twoArrows = [
  ["Arrow" , { width:22, length:22, location:0.999 }],
  ["Arrow" , { width:22, length:22, location:0.001, direction:-1 }],
];


function connect(source, target, cssClass, optEndpoints) {
  jsPlumb.connect({
    source: source, target: target, cssClass: cssClass, overlays: optEndpoints });
}


// What arrows to show on what pages

let perPageConnections = {
  [Symbol.for("index")]() {
    connect("user", "rsce", "tduck-path tduck-path-active", oneArrow);
    connect("rsce", "data", "tduck-path tduck-path-active");
  },
  [Symbol.for("client_home")]() {
    connect("user", "clnt", "tduck-path tduck-path-active", oneArrow);
  },
  [Symbol.for("login")]() {
    connect("clnt", "user", "tduck-path tduck-path-active", oneArrow);
    connect("user", "rsce", "tduck-path tduck-path-active", oneArrow);
  },
  [Symbol.for("client_callback")]() {
    connect("rsce", "user", "tduck-path tduck-path-active", oneArrow);
    connect("user", "clnt", "tduck-path tduck-path-active", oneArrow);
    connect("clnt", "rsce", "tduck-path", oneArrow);
  },
  [Symbol.for("client_use_token")]() {
    connect("clnt", "rsce", "tduck-path tduck-path-green", oneArrow);
    connect("rsce", "data", "tduck-path tduck-path-green");
  },
};


// Useful for layout
function echoLocation(e) {
  // eslint-disable-next-line no-console
  console.log("new position: ", e.pos);
}

function decorateNode(node) {
  jsPlumb.draggable(node, { containment:true, stop: echoLocation });
}



jsPlumb.ready(function() {
  // Render per page connections. "DIAGRAM_PAGE" is previously set in the html header
  // by layout.pug view.
  DIAGRAM_PAGE = DIAGRAM_PAGE || "";
  perPageConnections[DIAGRAM_PAGE] && perPageConnections[DIAGRAM_PAGE]();

  for (let node of ["user", "clnt", "rsce", "data"]) {
    decorateNode(node);
  }
});

