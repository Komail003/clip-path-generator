const vscode = require("vscode");

function activate(context) {
    const disposable = vscode.commands.registerCommand("clip-path.open", () => {
        const panel = vscode.window.createWebviewPanel(
            "clipPathGenerator",
            "Clip Path Generator",
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage((message) => {
            if (message.command === "copy") {
                vscode.env.clipboard.writeText(message.text);
                vscode.window.showInformationMessage("CSS copied!");
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent() {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #d4d4d4;
      background: #1e1e1e;
    }

    h2 {
      margin-top: 0;
    }

    .wrap {
      max-width: 760px;
    }

    .box {
      width: 220px;
      height: 220px;
      background: linear-gradient(135deg, #ff6b35, #f7931e);
      margin: 16px 0 22px;
      clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
      transition: clip-path 0.2s ease;
      border-radius: 12px;
    }

    .controls {
      display: grid;
      gap: 14px;
      margin-bottom: 18px;
      padding: 14px;
      border: 1px solid #333;
      border-radius: 12px;
      background: #252526;
    }

    .row {
      display: grid;
      gap: 6px;
    }

    label {
      font-size: 13px;
      color: #cfcfcf;
    }

    input[type="range"] {
      width: 100%;
    }

    select, button {
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #444;
      background: #1e1e1e;
      color: #fff;
      outline: none;
    }

    button {
      cursor: pointer;
        background: #ff6b35;
        border-color: #ff6b35;
      width: fit-content;
    }

    button:hover {
        background: #e55a2b;
    }

    .toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      user-select: none;
    }

    .toggle input {
      transform: scale(1.05);
    }

    .custom-grid {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .point-card {
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #333;
      background: #1e1e1e;
    }

    code, pre {
      display: block;
      white-space: pre-wrap;
      word-break: break-word;
    }

    pre {
      margin-top: 12px;
      padding: 12px;
      border-radius: 10px;
      background: #111;
      border: 1px solid #333;
      color: #dcdcdc;
      overflow: auto;
    }

    .muted {
      color: #9aa0a6;
      font-size: 12px;
      margin-top: 4px;
    }
      .drag-layer {
  position: absolute;
  width: 220px;
  height: 220px;
  pointer-events: none;
}

.drag-point {
  width: 12px;
  height: 12px;
  background: #fff;
  border: 2px solid #ff6b35;
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: grab;
  pointer-events: all;
}

.drag-point:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.2);
}
  </style>
</head>
<body>
  <div class="wrap">
    <h2>Clip Path Generator</h2>
    <div class="muted">
      Choose a preset shape or build a custom polygon. Toggle curved edges to generate a rounded path.
    </div>

<div class="box" id="box">
  <div class="drag-layer" id="dragLayer"></div>
</div>
    <div class="controls">
      <div class="row">
        <label for="shapeSelect">Shape</label>
        <select id="shapeSelect">
          <option value="custom">Custom Polygon</option>
          <option value="triangle">Triangle</option>
          <option value="square">Square</option>
          <option value="diamond">Diamond</option>
          <option value="pentagon">Pentagon</option>
          <option value="hexagon" selected>Hexagon</option>
          <option value="star">Star</option>
          <option value="arrow">Arrow</option>
          <option value="chevron">Chevron</option>
        </select>
      </div>

      <label class="toggle">
        <input type="checkbox" id="curvedToggle">
        Curved edges
      </label>

      <div class="row" id="radiusWrap" style="display:none;">
        <label for="radiusRange">Curve radius: <span id="radiusValue">8</span></label>
        <input type="range" id="radiusRange" min="1" max="20" value="8">
      </div>

      <div id="customControls" style="display:none;">
        <div class="custom-grid">
          <div class="point-card">
            <label>Point 1 X</label>
            <input type="range" id="x1" min="0" max="100" value="50">
            <label>Point 1 Y</label>
            <input type="range" id="y1" min="0" max="100" value="0">
          </div>

          <div class="point-card">
            <label>Point 2 X</label>
            <input type="range" id="x2" min="0" max="100" value="100">
            <label>Point 2 Y</label>
            <input type="range" id="y2" min="0" max="100" value="50">
          </div>

          <div class="point-card">
            <label>Point 3 X</label>
            <input type="range" id="x3" min="0" max="100" value="50">
            <label>Point 3 Y</label>
            <input type="range" id="y3" min="0" max="100" value="100">
          </div>

          <div class="point-card">
            <label>Point 4 X</label>
            <input type="range" id="x4" min="0" max="100" value="0">
            <label>Point 4 Y</label>
            <input type="range" id="y4" min="0" max="100" value="50">
          </div>
        </div>
      </div>

      <button id="copyBtn">Copy CSS</button>
    </div>

    <pre id="cssOut"></pre>
  </div>

<script>
  const vscode = acquireVsCodeApi();

  const box = document.getElementById("box");
  const cssOut = document.getElementById("cssOut");

  const shapeSelect = document.getElementById("shapeSelect");
  const curvedToggle = document.getElementById("curvedToggle");

  const radiusWrap = document.getElementById("radiusWrap");
  const radiusRange = document.getElementById("radiusRange");
  const radiusValue = document.getElementById("radiusValue");

  const customControls = document.getElementById("customControls");
  const copyBtn = document.getElementById("copyBtn");

  const inputs = document.querySelectorAll("input, select");

  const pts = {
    x1: document.getElementById("x1"),
    y1: document.getElementById("y1"),
    x2: document.getElementById("x2"),
    y2: document.getElementById("y2"),
    x3: document.getElementById("x3"),
    y3: document.getElementById("y3"),
    x4: document.getElementById("x4"),
    y4: document.getElementById("y4"),
  };

  function getPresetPoints(shape) {
    const shapes = {
      triangle: [[50,0],[100,100],[0,100]],
      square: [[0,0],[100,0],[100,100],[0,100]],
      diamond: [[50,0],[100,50],[50,100],[0,50]],
      pentagon: [[50,0],[95,35],[78,100],[22,100],[5,35]],
      hexagon: [[25,0],[75,0],[100,50],[75,100],[25,100],[0,50]],
      star: [[50,0],[61,35],[98,35],[68,57],[79,91],[50,70],[21,91],[32,57],[2,35],[39,35]],
      arrow: [[0,35],[60,35],[60,0],[100,50],[60,100],[60,65],[0,65]],
      chevron: [[0,20],[60,20],[100,50],[60,80],[0,80],[40,50]]
    };
    return shapes[shape] || shapes.hexagon;
  }

  function getCustomPoints() {
    return [
      [Number(pts.x1.value), Number(pts.y1.value)],
      [Number(pts.x2.value), Number(pts.y2.value)],
      [Number(pts.x3.value), Number(pts.y3.value)],
      [Number(pts.x4.value), Number(pts.y4.value)]
    ];
  }

  function toPolygon(points) {
    return "polygon(" + points.map(([x,y]) => x + "% " + y + "%").join(", ") + ")";
  }

  function dist(a,b){
    return Math.hypot(b[0]-a[0], b[1]-a[1]);
  }

  function norm(v){
    const l = Math.hypot(v[0],v[1]) || 1;
    return [v[0]/l, v[1]/l];
  }

  function roundedPath(points, r){
    const n = points.length;
    let d = "";

    for(let i=0;i<n;i++){
      const prev = points[(i-1+n)%n];
      const curr = points[i];
      const next = points[(i+1)%n];

      const v1 = norm([curr[0]-prev[0], curr[1]-prev[1]]);
      const v2 = norm([next[0]-curr[0], next[1]-curr[1]]);

      const radius = Math.min(r, dist(prev,curr)/2, dist(curr,next)/2);

      const start = [curr[0]-v1[0]*radius, curr[1]-v1[1]*radius];
      const end = [curr[0]+v2[0]*radius, curr[1]+v2[1]*radius];

      if(i===0){
        d += "M " + start[0] + " " + start[1] + " ";
      } else {
        d += "L " + start[0] + " " + start[1] + " ";
      }

      d += "Q " + curr[0] + " " + curr[1] + " " + end[0] + " " + end[1] + " ";
    }

    return d + "Z";
  }

  function updateUI(){
    const isCustom = shapeSelect.value === "custom";
    customControls.style.display = isCustom ? "block" : "none";

    radiusWrap.style.display = curvedToggle.checked ? "block" : "none";
  }

  function update(){
    updateUI();

    const shape = shapeSelect.value;
    const curved = curvedToggle.checked;
    const radius = Number(radiusRange.value);
    radiusValue.textContent = radius;

    const points = shape === "custom"
      ? getCustomPoints()
      : getPresetPoints(shape);

    let css = "";
    let preview = "";

    if(curved){
      const path = roundedPath(points, radius);
      css = "clip-path: path('" + path + "');";
      preview = "path('" + path + "')";
    } else {
      const poly = toPolygon(points);
      css = "clip-path: " + poly + ";";
      preview = poly;
    }

    box.style.clipPath = preview;
    cssOut.textContent = css;
  }

  inputs.forEach(el => {
    el.addEventListener("input", update);
    el.addEventListener("change", update);
  });

  copyBtn.addEventListener("click", () => {
    vscode.postMessage({
      command: "copy",
      text: cssOut.textContent
    });
  });

  update();
  const dragLayer = document.getElementById("dragLayer");

let draggingIndex = null;

function getActivePoints() {
  const shape = shapeSelect.value;

  const points = shape === "custom"
    ? getCustomPoints()
    : getPresetPoints(shape);

  return points;
}
</script>
</body>
</html>
  `;
}

module.exports = { activate };