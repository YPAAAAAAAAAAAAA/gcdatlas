/* gcdatlas — clean-room ASCII universe atlas.
   idea after @eshin087 (eshin087/gcdatlas); no upstream code. */
(function () {
  "use strict";

  var AU = 1.495978707e11;
  var LY = 9.4607304725808e15;
  var RSUN = 6.9634e8;
  var RE = 6.371e6;
  var RM = 1.7374e6;
  var MD = 3.844e8;
  var EDGE = 4.4e26;
  var GLYPH = " .:-=+*#%@";

  var PAL = [
    "#07060f",
    "#a39cb4",
    "#f6f1e6",
    "#8ec0ff",
    "#ffb15e",
    "#0c3348",
    "#1c6d78",
    "#3ecfb8",
    "#6f9344",
    "#d2ae62",
    "#e7f6f4",
    "#1b4566",
    "#f0c56a",
    "#6e675f",
    "#ddd4c8",
    "#4a4038",
    "#ff9a3a",
    "#fff3c4",
    "#ffc48a",
    "#c98448",
    "#f3e2c0",
    "#d24b38",
    "#e6d0a0",
    "#f6ecd4",
    "#d2653e",
    "#f0e2a4",
    "#a5dbe8",
    "#3d6de0",
    "#8a7568",
    "#cbb8ff",
    "#fff1cc",
    "#6d4d78",
    "#ffb07c",
    "#5a3048",
    "#f4f7ff",
    "#7ad7ff",
    "#ffd0a0"
  ];

  var C = {
    star: 1, starHot: 2, starBlue: 3, starWarm: 4,
    sea0: 5, sea1: 6, sea2: 7, land: 8, landLit: 9, ice: 10, night: 11, city: 12,
    moon0: 13, moon1: 14, crater: 15,
    sun0: 16, sun1: 17, corona: 18,
    jup0: 19, jup1: 20, spot: 21, sat: 22, ring: 23,
    mars: 24, venus: 25, uranus: 26, neptune: 27, merc: 28,
    gal: 29, bulge: 30, dust: 31, cmb: 32, cmbDim: 33, photon: 34, atmos: 35, core: 36
  };

  function hash3(x, y, z) {
    var n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1440671873);
    n = (n ^ (n >>> 13)) >>> 0;
    n = Math.imul(n, 1274126177);
    return (n ^ (n >>> 16)) >>> 0;
  }

  function noiseHash(ix, iy) {
    return (hash3(ix, iy, 0x9e3779b9) & 65535) / 65535;
  }

  function noise2(x, y) {
    var x0 = Math.floor(x), y0 = Math.floor(y);
    var fx = x - x0, fy = y - y0;
    var sx = fx * fx * (3 - 2 * fx);
    var sy = fy * fy * (3 - 2 * fy);
    var a = noiseHash(x0, y0), b = noiseHash(x0 + 1, y0);
    var c = noiseHash(x0, y0 + 1), d = noiseHash(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function nrm(x, y, z) {
    var l = Math.hypot(x, y, z) || 1;
    return { x: x / l, y: y / l, z: z / l };
  }

  function radec(hours, deg, lyDist) {
    var ra = (hours / 24) * Math.PI * 2;
    var dec = (deg * Math.PI) / 180;
    var cd = Math.cos(dec);
    var d = lyDist * LY;
    return { x: d * cd * Math.cos(ra), y: d * Math.sin(dec), z: d * cd * Math.sin(ra) };
  }

  function orbit(au, deg, yAu) {
    var a = deg * Math.PI / 180;
    return { x: Math.cos(a) * au * AU, y: yAu * AU, z: Math.sin(a) * au * AU };
  }

  var GC = radec(17.76, -29.0, 26000);
  var GN = nrm(radec(12.85, 27.13, 1).x, radec(12.85, 27.13, 1).y, radec(12.85, 27.13, 1).z);
  var AND = radec(0.71, 41.27, 2.54e6);
  var GAL_R = 52000 * LY;
  var AND_R = 110000 * LY;
  var andDir = nrm(AND.x, AND.y, AND.z);
  var AND_N = nrm(andDir.y * 0.15 + 0.25, 0.72, andDir.x * 0.2 - 0.35);

  function diskBasis(n) {
    var ax = Math.abs(n.y) < 0.85 ? 0 : 1;
    var ay = Math.abs(n.y) < 0.85 ? 1 : 0;
    var az = 0;
    var t1 = nrm(ay * n.z - az * n.y, az * n.x - ax * n.z, ax * n.y - ay * n.x);
    var t2 = nrm(n.y * t1.z - n.z * t1.y, n.z * t1.x - n.x * t1.z, n.x * t1.y - n.y * t1.x);
    return { t1: t1, t2: t2 };
  }
  var MW_B = diskBasis(GN);
  var AND_B = diskBasis(AND_N);

  var HOLE_R = 3.05e10;

  var bodies = [
    { name: "Sun", kind: "sun", x: 0, y: 0, z: 0, r: RSUN },
    { name: "Mercury", kind: "mercury", r: 2.44e6 },
    { name: "Venus", kind: "venus", r: 6.052e6 },
    { name: "Earth", kind: "earth", x: AU, y: 0, z: 0, r: RE },
    { name: "Moon", kind: "moon", x: AU + MD * 0.96, y: MD * 0.11, z: MD * 0.28, r: RM },
    { name: "Mars", kind: "mars", r: 3.39e6 },
    { name: "Jupiter", kind: "jupiter", r: 6.991e7 },
    { name: "Saturn", kind: "saturn", r: 5.823e7 },
    { name: "Uranus", kind: "uranus", r: 2.536e7 },
    { name: "Neptune", kind: "neptune", r: 2.462e7 },
    { name: "Sirius", kind: "star", r: 1.7 * RSUN, tint: C.starHot },
    { name: "Alpha Centauri", kind: "star", r: 1.2 * RSUN, tint: C.starWarm },
    { name: "Vega", kind: "star", r: 2.36 * RSUN, tint: C.starBlue },
    { name: "Betelgeuse", kind: "star", r: 640 * RSUN, tint: C.starWarm },
    { name: "Rigel", kind: "star", r: 79 * RSUN, tint: C.starBlue },
    { name: "Arcturus", kind: "star", r: 25 * RSUN, tint: C.starWarm },
    { name: "Procyon", kind: "star", r: 2.05 * RSUN, tint: C.starHot },
    { name: "Antares", kind: "star", r: 680 * RSUN, tint: C.starWarm },
    { name: "Polaris", kind: "star", r: 37 * RSUN, tint: C.starHot },
    { name: "Deneb", kind: "star", r: 203 * RSUN, tint: C.starBlue },
    { name: "The Core", kind: "hole", x: GC.x, y: GC.y, z: GC.z, r: HOLE_R },
    { name: "Andromeda", kind: "andromeda", x: AND.x, y: AND.y, z: AND.z, r: AND_R * 0.35 },
    { name: "Milky Way", kind: "galaxy", x: GC.x, y: GC.y, z: GC.z, r: GAL_R }
  ];

  (function placePlanets() {
    var p = {
      Mercury: orbit(0.387, 128, 0.004),
      Venus: orbit(0.723, 206, -0.012),
      Mars: orbit(1.524, 312, 0.02),
      Jupiter: orbit(5.204, 48, -0.015),
      Saturn: orbit(9.583, 132, 0.03),
      Uranus: orbit(19.19, 228, -0.02),
      Neptune: orbit(30.07, 18, 0.018)
    };
    var stars = {
      Sirius: radec(6.752, -16.72, 8.6),
      "Alpha Centauri": radec(14.66, -60.83, 4.37),
      Vega: radec(18.615, 38.78, 25.04),
      Betelgeuse: radec(5.919, 7.41, 548),
      Rigel: radec(5.242, -8.2, 860),
      Arcturus: radec(14.261, 19.18, 36.7),
      Procyon: radec(7.655, 5.22, 11.46),
      Antares: radec(16.49, -26.43, 550),
      Polaris: radec(2.53, 89.26, 448),
      Deneb: radec(20.69, 45.28, 2615)
    };
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      var at = p[b.name] || stars[b.name];
      if (!at) continue;
      b.x = at.x;
      b.y = at.y;
      b.z = at.z;
    }
  })();

  var GWEB = 1.15e25;
  var FILAMENTS = [
    [[-0.55, -0.18, -0.42], [0.72, 0.16, 0.28]],
    [[-0.22, 0.52, -0.58], [0.34, -0.46, 0.6]],
    [[0.12, 0.08, -0.78], [-0.48, 0.42, 0.55]],
    [[-0.7, 0.28, 0.18], [0.46, -0.22, -0.62]]
  ].map(function (seg) {
    return seg.map(function (p) {
      return { x: p[0] * GWEB, y: p[1] * GWEB, z: p[2] * GWEB };
    });
  });

  var FACT = {
    earth: "Blue, wet, and busy. One moon keeps it company.",
    moon: "A gray archive of impacts, facing home.",
    sun: "A close star. Bright cells are boiling granules.",
    mercury: "Small, cratered, and scorched on the sunward side.",
    venus: "One unbroken cloud deck. The hottest world here.",
    mars: "Rust-red, with ice at the poles.",
    jupiter: "Weather bands wider than Earth, and one long storm.",
    saturn: "A pale globe in a bright ring. The dark gap is empty.",
    uranus: "Rolled onto its side, pale, and far from the fire.",
    neptune: "The last giant. Deep blue, and windy.",
    star: "A named light. Get close and it becomes a disk.",
    hole: "The shadow is wider than the hole. Light rings it.",
    galaxy: "A few hundred billion stars in a thin spiral.",
    andromeda: "The nearest big neighbour, two and a half million light-years out.",
    edge: "The oldest light still traveling. The atlas ends at this shell.",
    pair: "Earth and the Moon, sharing one quiet stretch of space.",
    inner: "The rocky worlds, still close to the fire.",
    system: "The giants live out here. They stay small until you arrive.",
    near: "A handful of bright named stars, and a field of the rest.",
    inside: "Still inside the disk. The pale band is the rest of the galaxy.",
    group: "Home and Andromeda, with a scatter of smaller galaxies.",
    web: "Galaxies strung along filaments. The gaps are real."
  };

  var canvas = document.getElementById("stage");
  var ctx = canvas.getContext("2d", { alpha: false });
  var elPlace = document.getElementById("place");
  var elRange = document.getElementById("range");
  var elFact = document.getElementById("fact");
  var toggle = document.getElementById("ui-toggle");
  var panel = document.getElementById("panel");

  var cssW = 390, cssH = 844, dpr = 1;
  var MAX_COLS = 52, MAX_ROWS = 64;
  var cols = 48, rows = 64, cellW = 7, cellH = 13, offX = 0, offY = 0;
  var glyphs, colors, depth;
  var fontPx = 12, fontReady = 0;
  var dirx = 0, diry = 0, dirz = 1;
  var lonV = 0, latV = 0;
  var skyInside = false, coreOn = false, coreX = 0, coreY = 0, coreZ = 0, coreD = 0;
  var vignette = null, vigW = 0, vigH = 0;
  var sentReady = false;
  var tour = null;
  var lastTap = 0, tapX = 0, tapY = 0;
  var ptr = new Map();
  var pinchD = 0;
  var moved = 0;
  var clock0 = performance.now();

  var cam = {
    tx: AU, ty: 0, tz: 0,
    yaw: 0, pitch: 0, logD: 7.4,
    minR: RE, focus: "Earth", kind: "earth",
    biasY: 0.1,
    x: 0, y: 0, z: 0,
    fx: 0, fy: 0, fz: 1,
    rx: 1, ry: 0, rz: 0,
    ux: 0, uy: 1, uz: 0,
    tanV: Math.tan(0.56),
    tanH: 0.3
  };

  function earthPose() {
    var earth = bodies[3];
    var moon = bodies[4];
    var toM = nrm(moon.x - earth.x, moon.y - earth.y, moon.z - earth.z);
    var off = nrm(-toM.x, -toM.y - 0.42, -toM.z);
    return poseFrom(earth, off, RE * 4.35, RE);
  }
  function moonPose() {
    var moon = bodies[4];
    var earth = bodies[3];
    var toE = nrm(earth.x - moon.x, earth.y - moon.y, earth.z - moon.z);
    var side = nrm(-toE.z, 0.05, toE.x);
    var off = nrm(side.x * 0.72 - toE.x * 0.22, 0.38, side.z * 0.72 - toE.z * 0.22);
    return poseFrom(moon, off, RM * 5.2, RM);
  }
  function pairPose(yawExtra) {
    var earth = bodies[3];
    var moon = bodies[4];
    var mid = {
      name: "Earth & Moon", kind: "pair",
      x: (earth.x + moon.x) * 0.5,
      y: (earth.y + moon.y) * 0.5,
      z: (earth.z + moon.z) * 0.5,
      r: MD
    };
    var sep = nrm(moon.x - earth.x, moon.y - earth.y, moon.z - earth.z);
    var side = nrm(-sep.z, 0.15, sep.x);
    var off = nrm(side.x, 0.42, side.z);
    var c = Math.cos(yawExtra || 0), s = Math.sin(yawExtra || 0);
    var spun = nrm(off.x * c - off.z * s, off.y, off.x * s + off.z * c);
    return poseFrom(mid, spun, MD * 2.15, RE);
  }
  function sunPose() {
    return poseFrom(bodies[0], nrm(0.55, 0.28, 0.78), RSUN * 3.35, RSUN);
  }
  function giantPose(body, distMul) {
    return poseFrom(body, nrm(0.62, 0.48, 0.55), body.r * distMul, body.r);
  }
  function galaxyPose() {
    var off = nrm(GN.x * 0.96 + 0.08, GN.y * 0.96 + 0.05, GN.z * 0.96 + 0.06);
    return poseFrom(bodies[22], off, GAL_R * 4.6, GAL_R * 0.15);
  }
  function corePose() {
    var hole = bodies[20];
    return poseFrom(hole, nrm(0.78, 0.34, 0.42), HOLE_R * 7.2, HOLE_R);
  }
  function edgePose() {
    var off = nrm(0.42, 0.18, 0.89);
    var fake = { name: "The Edge", kind: "edge", x: AU, y: 0, z: 0, r: EDGE };
    return poseFrom(fake, off, EDGE * 0.9, RE);
  }

  function poseFrom(target, off, dist, minR) {
    var fx = -off.x, fy = -off.y, fz = -off.z;
    var yaw = Math.atan2(fx, fz);
    var pitch = Math.asin(clamp(fy, -1, 1));
    return {
      tx: target.x, ty: target.y, tz: target.z,
      yaw: yaw, pitch: pitch,
      logD: Math.log10(Math.max(dist, minR * 1.05)),
      minR: minR,
      focus: target.name,
      kind: target.kind || "sky"
    };
  }

  function applyPose(p) {
    cam.tx = p.tx; cam.ty = p.ty; cam.tz = p.tz;
    cam.yaw = p.yaw; cam.pitch = p.pitch;
    cam.logD = p.logD; cam.minR = p.minR;
    cam.focus = p.focus; cam.kind = p.kind;
    clampLog();
  }

  function lerpAngle(a, b, t) {
    var d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  function lerpPose(a, b, t) {
    return {
      tx: a.tx + (b.tx - a.tx) * t,
      ty: a.ty + (b.ty - a.ty) * t,
      tz: a.tz + (b.tz - a.tz) * t,
      yaw: lerpAngle(a.yaw, b.yaw, t),
      pitch: a.pitch + (b.pitch - a.pitch) * t,
      logD: a.logD + (b.logD - a.logD) * t,
      minR: a.minR + (b.minR - a.minR) * t,
      focus: t < 0.5 ? a.focus : b.focus,
      kind: t < 0.5 ? a.kind : b.kind
    };
  }

  function ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function snapshot() {
    return {
      tx: cam.tx, ty: cam.ty, tz: cam.tz,
      yaw: cam.yaw, pitch: cam.pitch, logD: cam.logD,
      minR: cam.minR, focus: cam.focus, kind: cam.kind
    };
  }

  function clampLog() {
    var minD = Math.max(cam.minR * 1.045, 1);
    var floor = Math.log10(minD);
    if (cam.logD < floor) cam.logD = floor;
    if (cam.logD > 26.62) cam.logD = 26.62;
  }

  function updateCam() {
    clampLog();
    var cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    var cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    var fx = sy * cp, fy = sp, fz = cy * cp;
    var dist = Math.pow(10, cam.logD);
    cam.fx = fx; cam.fy = fy; cam.fz = fz;
    cam.x = cam.tx - fx * dist;
    cam.y = cam.ty - fy * dist;
    cam.z = cam.tz - fz * dist;
    var rl = Math.hypot(fz, fx) || 1;
    cam.rx = fz / rl; cam.ry = 0; cam.rz = -fx / rl;
    cam.ux = fy * cam.rz - fz * cam.ry;
    cam.uy = fz * cam.rx - fx * cam.rz;
    cam.uz = fx * cam.ry - fy * cam.rx;
    var aspect = cssW / Math.max(1, cssH);
    cam.tanV = Math.tan(0.56);
    cam.tanH = cam.tanV * aspect;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var w = rect.width || canvas.clientWidth || 390;
    var h = rect.height || canvas.clientHeight || 844;
    if (w < 20 || h < 20) { w = 390; h = 844; }
    var nextDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var bw = Math.max(2, Math.round(w * nextDpr));
    var bh = Math.max(2, Math.round(h * nextDpr));
    if (glyphs && w === cssW && h === cssH && nextDpr === dpr && canvas.width === bw && canvas.height === bh) return;
    cssW = w; cssH = h; dpr = nextDpr;
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      fontReady = 0;
      vignette = null;
    }
    cellH = Math.max(9, Math.round(h / MAX_ROWS));
    cellW = Math.max(5, Math.round(cellH * 0.54));
    if (Math.floor(w / cellW) > MAX_COLS) cellW = Math.max(5, Math.floor(w / MAX_COLS));
    if (Math.floor(h / cellH) > MAX_ROWS) cellH = Math.max(9, Math.floor(h / MAX_ROWS));
    cols = Math.max(16, Math.min(MAX_COLS, Math.floor(w / cellW)));
    rows = Math.max(20, Math.min(MAX_ROWS, Math.floor(h / cellH)));
    offX = (w - cols * cellW) * 0.5;
    offY = (h - rows * cellH) * 0.5;
    var n = cols * rows;
    if (!glyphs || glyphs.length !== n) {
      glyphs = new Uint8Array(n);
      colors = new Uint8Array(n);
      depth = new Float64Array(n);
    }
    fontPx = cellH * 0.98;
  }

  function fitFont() {
    if (fontReady === cellW * 1000 + cellH) return;
    fontPx = cellH * 0.98;
    ctx.font = fontPx + "px ui-monospace, Menlo, Consolas, monospace";
    var adv = ctx.measureText("M").width || cellW;
    if (adv > 0.1) fontPx = fontPx * (cellW / adv) * 0.96;
    ctx.font = fontPx + "px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    fontReady = cellW * 1000 + cellH;
  }

  function aim(c, r) {
    var ndcX = ((c + 0.5) / cols) * 2 - 1;
    var ndcY = (1 - (r + 0.5) / rows * 2) - cam.biasY;
    var x = cam.fx + cam.rx * ndcX * cam.tanH + cam.ux * ndcY * cam.tanV;
    var y = cam.fy + cam.ry * ndcX * cam.tanH + cam.uy * ndcY * cam.tanV;
    var z = cam.fz + cam.rz * ndcX * cam.tanH + cam.uz * ndcY * cam.tanV;
    var l = Math.hypot(x, y, z) || 1;
    dirx = x / l;
    diry = y / l;
    dirz = z / l;
  }

  function raySphere(dx, dy, dz, cx, cy, cz, rad) {
    var lx = cx - cam.x, ly = cy - cam.y, lz = cz - cam.z;
    var tca = lx * dx + ly * dy + lz * dz;
    var d2 = lx * lx + ly * ly + lz * lz - tca * tca;
    var r2 = rad * rad;
    if (d2 > r2) return 0;
    var thc = Math.sqrt(r2 - d2);
    var t = tca - thc;
    if (t < 1) t = tca + thc;
    return t > 1 ? t : 0;
  }

  function gIndex(lit) {
    var x = lit < 0 ? 0 : lit > 1 ? 1 : lit;
    x = Math.sqrt(x);
    var i = (x * (GLYPH.length - 1) + 0.5) | 0;
    if (i < 1) i = 1;
    if (i > GLYPH.length - 1) i = GLYPH.length - 1;
    return i;
  }

  function lonLat(nx, ny, nz, spin) {
    var c = Math.cos(spin), s = Math.sin(spin);
    var rx = nx * c - nz * s;
    var rz = nx * s + nz * c;
    lonV = Math.atan2(rx, rz);
    latV = Math.asin(clamp(ny, -1, 1));
  }

  var BLOBS = [
    -2.15, -0.15, 0.62, 0.42, 1.05,
    -1.15, 0.45, 0.38, 0.28, 0.75,
    -2.7, 0.35, 0.45, 0.32, 0.7,
    0.35, 0.15, 0.7, 0.48, 0.95,
    1.15, -0.55, 0.42, 0.36, 0.8,
    2.15, -0.25, 0.5, 0.4, 0.85,
    2.55, 0.45, 0.28, 0.22, 0.55,
    -0.4, -0.85, 0.36, 0.24, 0.6
  ];

  function landAmount(lon, lat) {
    var s = 0;
    for (var i = 0; i < BLOBS.length; i += 5) {
      var dlon = lon - BLOBS[i];
      dlon = Math.atan2(Math.sin(dlon), Math.cos(dlon));
      var dlat = lat - BLOBS[i + 1];
      var e = (dlon * dlon) / (BLOBS[i + 2] * BLOBS[i + 2]) + (dlat * dlat) / (BLOBS[i + 3] * BLOBS[i + 3]);
      s += BLOBS[i + 4] * Math.exp(-0.5 * e);
    }
    s += (noise2(lon * 2.4 + 3.1, lat * 3.3) - 0.5) * 0.55;
    s += (noise2(lon * 6.2 - 1.4, lat * 7.1) - 0.5) * 0.22;
    return s;
  }

  function shadePlanet(kind, nx, ny, nz, lit, time) {
    lonLat(nx, ny, nz, kind === "earth" ? time * 0.12 : kind === "jupiter" ? time * 0.35 : 0);
    var lon = lonV, lat = latV;
    var shade = 0.07 + 0.93 * lit;
    var g = gIndex(shade);
    var col = C.night;
    if (kind === "earth") {
      var ice = Math.abs(lat) > 1.22;
      var land = landAmount(lon, lat);
      var cloudN = noise2(lon * 3.1 + time * 0.045, lat * 4.2);
      var cloud = cloudN > 0.64 && lit > 0.18;
      if (lit < 0.1) {
        col = C.night;
        g = lit > 0.04 ? 2 : 1;
        if (!ice && land > 0.62 && ((hash3((lon * 18) | 0, (lat * 18) | 0, 3) & 255) > 214)) {
          col = C.city;
          g = 6;
        }
      } else if (cloud) {
        col = C.ice;
        g = gIndex(0.55 + lit * 0.5);
      } else if (ice) {
        col = C.ice;
        g = gIndex(0.45 + lit * 0.6);
      } else if (land > 0.58) {
        col = lit > 0.45 ? C.landLit : C.land;
        g = gIndex(shade * (0.75 + (land - 0.58)));
      } else {
        col = lit > 0.62 ? C.sea2 : lit > 0.28 ? C.sea1 : C.sea0;
        var wave = noise2(lon * 4 + 2, lat * 5);
        g = gIndex(shade * (0.82 + wave * 0.25));
      }
    } else if (kind === "moon" || kind === "mercury") {
      var cr = noise2(lon * 5.5, lat * 6.5);
      var deep = cr < 0.38;
      col = deep ? C.crater : lit > 0.45 ? C.moon1 : C.moon0;
      if (kind === "mercury") col = deep ? C.crater : lit > 0.4 ? C.merc : C.moon0;
      g = gIndex(shade * (deep ? 0.55 : 1));
    } else if (kind === "sun") {
      var gran = noise2(lon * 9 + time * 0.25, lat * 9);
      var hot = 0.55 + gran * 0.55;
      col = hot > 0.82 ? C.sun1 : C.sun0;
      g = gIndex(hot);
    } else if (kind === "jupiter") {
      var band = Math.sin(lat * 14 + Math.sin(lon * 2) * 0.4);
      var spotLon = lon + 0.4;
      spotLon = Math.atan2(Math.sin(spotLon), Math.cos(spotLon));
      var spot = Math.exp(-((spotLon * spotLon) / 0.08 + ((lat + 0.35) * (lat + 0.35)) / 0.05));
      if (spot > 0.45) col = C.spot;
      else col = band > 0 ? C.jup1 : C.jup0;
      g = gIndex(shade * (0.7 + Math.abs(band) * 0.35));
    } else if (kind === "saturn") {
      col = C.sat;
      var belt = 0.75 + 0.25 * Math.sin(lat * 10);
      g = gIndex(shade * belt);
    } else if (kind === "mars") {
      var cap = Math.abs(lat) > 1.25;
      col = cap ? C.ice : C.mars;
      g = gIndex(shade * (cap ? 1 : 0.8 + noise2(lon * 3, lat * 3) * 0.3));
    } else if (kind === "venus") {
      col = C.venus;
      g = gIndex(0.55 + 0.45 * lit * (0.7 + noise2(lon * 4, lat * 4) * 0.5));
    } else if (kind === "uranus") {
      col = C.uranus;
      g = gIndex(shade);
    } else if (kind === "neptune") {
      col = C.neptune;
      g = gIndex(shade * (0.85 + 0.15 * Math.sin(lat * 8)));
    } else if (kind === "star") {
      col = C.starHot;
      g = gIndex(0.75 + 0.25 * noise2(lon * 6 + time, lat * 6));
    }
    return g | (col << 8);
  }

  function shadeRing(px, py, pz, body) {
    var tilt = 0.48;
    var nx = 0, ny = Math.cos(tilt), nz = Math.sin(tilt);
    var vx = px - body.x, vy = py - body.y, vz = pz - body.z;
    var radial = Math.hypot(vx, vy, vz);
    var inner = body.r * 1.28, outer = body.r * 2.35;
    if (radial < inner || radial > outer) return null;
    var gap = radial > body.r * 1.92 && radial < body.r * 2.05;
    if (gap) return null;
    var ang = Math.atan2(vx, vz);
    var lit = 0.45 + 0.55 * (0.5 + 0.5 * Math.cos(ang));
    void ny; void nz;
    return { g: gIndex(0.35 + lit * 0.65), col: C.ring };
  }

  function rayPlane(dx, dy, dz, px, py, pz, nx, ny, nz) {
    var denom = dx * nx + dy * ny + dz * nz;
    if (denom > -1e-8 && denom < 1e-8) return 0;
    var t = ((px - cam.x) * nx + (py - cam.y) * ny + (pz - cam.z) * nz) / denom;
    return t > 1 ? t : 0;
  }

  function shadeDisk(dx, dy, dz, center, normal, basis, radius) {
    var t = rayPlane(dx, dy, dz, center.x, center.y, center.z, normal.x, normal.y, normal.z);
    if (!t) return null;
    var px = cam.x + dx * t, py = cam.y + dy * t, pz = cam.z + dz * t;
    var vx = px - center.x, vy = py - center.y, vz = pz - center.z;
    var u = vx * basis.t1.x + vy * basis.t1.y + vz * basis.t1.z;
    var v = vx * basis.t2.x + vy * basis.t2.y + vz * basis.t2.z;
    var rad = Math.hypot(u, v);
    if (rad > radius || rad < radius * 0.015) return null;
    var ang = Math.atan2(v, u);
    var twist = Math.sin(2 * ang - 1.65 * Math.log(Math.max(rad / radius, 0.02)));
    var arm = 0.38 + 0.62 * (0.5 + 0.5 * twist);
    var bulge = Math.exp(-Math.pow(rad / (radius * 0.14), 2));
    var fall = Math.exp(-Math.pow(rad / (radius * 0.78), 2));
    var dens = Math.min(1.15, bulge * 1.45 + arm * fall);
    if (dens < 0.1) return null;
    var dust = dens > 0.25 && dens < 0.55 && Math.sin(ang * 2) > 0.65;
    var col = bulge > 0.45 ? C.bulge : dust ? C.dust : C.gal;
    return { t: t, g: gIndex(clamp(dens, 0, 1)), col: col };
  }

  function shadeHole(dx, dy, dz, hole) {
    var lx = hole.x - cam.x, ly = hole.y - cam.y, lz = hole.z - cam.z;
    var dist = Math.hypot(lx, ly, lz);
    if (dist > hole.r * 90) return null;
    var Rs = hole.r;
    var tS = raySphere(dx, dy, dz, hole.x, hole.y, hole.z, Rs);
    var tca = (lx * dx + ly * dy + lz * dz);
    var closest2 = lx * lx + ly * ly + lz * lz - tca * tca;
    var impact = closest2 > 0 ? Math.sqrt(closest2) : 0;
    var ringR = Rs * 1.2;
    var ringW = Rs * 0.07;
    var best = null;
    if (tca > 1 && Math.abs(impact - ringR) < ringW) {
      var glow = 1 - Math.abs(impact - ringR) / ringW;
      best = { t: tca, g: gIndex(0.65 + glow * 0.35), col: C.photon };
    }
    var tilt = 0.42;
    var nx = 0.15, ny = Math.cos(tilt), nz = Math.sin(tilt);
    var nl = Math.hypot(nx, ny, nz);
    nx /= nl; ny /= nl; nz /= nl;
    var tD = rayPlane(dx, dy, dz, hole.x, hole.y, hole.z, nx, ny, nz);
    if (tD) {
      var px = cam.x + dx * tD, py = cam.y + dy * tD, pz = cam.z + dz * tD;
      var rx = px - hole.x, ry = py - hole.y, rz = pz - hole.z;
      var rad = Math.hypot(rx, ry, rz);
      if (rad > Rs * 1.35 && rad < Rs * 8.5) {
        var ang = Math.atan2(rx, rz);
        var dop = 0.32 + 0.68 * (0.5 + 0.5 * Math.cos(ang));
        var heat = dop * Math.pow(Rs * 2.2 / rad, 0.65);
        heat *= 0.75 + 0.25 * noise2(ang * 2, rad / Rs);
        if (heat > 0.12) {
          var disk = { t: tD, g: gIndex(clamp(heat, 0, 1)), col: heat > 0.62 ? C.sun1 : C.sun0 };
          if (!best || disk.t < best.t) best = disk;
        }
      }
    }
    if (tS && (!best || tS < best.t)) {
      best = { t: tS, g: 0, col: 0 };
    }
    return best;
  }

  function skyPaint(dx, dy, dz, time, camR) {
    var qx = Math.round(dx * 240);
    var qy = Math.round(dy * 240);
    var qz = Math.round(dz * 240);
    var h = hash3(qx, qy, qz);
    var starOn = (h & 255) < 7;
    if (starOn) {
      var tintRoll = (h >>> 8) & 7;
      var col = tintRoll < 1 ? C.starBlue : tintRoll < 2 ? C.starWarm : (h & 3) === 0 ? C.starHot : C.star;
      var tw = 0.55 + 0.45 * Math.sin(time * 2.4 + ((h >>> 4) & 63));
      var bright = (h & 255) < 2;
      var g = bright ? 6 : tw > 0.55 ? 5 : 1;
      return g | (col << 8);
    }
    var elev = dx * GN.x + dy * GN.y + dz * GN.z;
    if (skyInside) {
      var band = Math.exp(-elev * elev * 240);
      if (band > 0.18) {
        var h2 = hash3(qx ^ 91, qy, qz ^ 17);
        var az = Math.atan2(dx, dz);
        var knot = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(az * 5 + elev * 8));
        var chance = band * knot;
        if ((h2 & 1023) / 1023 < chance * 0.72) {
          var gB = chance > 0.75 ? 6 : chance > 0.4 ? 5 : 1;
          var colB = chance > 0.8 ? C.bulge : C.gal;
          return gB | (colB << 8);
        }
      }
      if (coreOn) {
        var dot = dx * coreX + dy * coreY + dz * coreZ;
        var ang2 = Math.max(0, 1 - dot);
        var prox = 1 - Math.min(1, coreD / (2200 * LY));
        var glow = Math.exp(-ang2 * 220) * (0.15 + 2.2 * prox);
        if (glow > 0.22 && coreD > HOLE_R * 100) {
          return gIndex(clamp(glow, 0, 1)) | ((glow > 0.7 ? C.core : C.starWarm) << 8);
        }
      }
    }
    if (camR > 8e23) {
      var tWeb = 2.2e24 + camR * 0.35;
      var px = cam.x + dx * tWeb, py = cam.y + dy * tWeb, pz = cam.z + dz * tWeb;
      var best = 1e40;
      for (var i = 0; i < FILAMENTS.length; i++) {
        var dseg = segDist(px, py, pz, FILAMENTS[i][0], FILAMENTS[i][1]);
        if (dseg < best) best = dseg;
      }
      var fil = Math.exp(-best / 7.5e23);
      if (fil > 0.55) {
        return (fil > 0.8 ? 5 : 1) | ((fil > 0.75 ? C.gal : C.dust) << 8);
      }
    }
    var nearEdge = camR / EDGE;
    if (nearEdge > 0.04) {
      var shell = cmbPoint(dx, dy, dz);
      if (shell) {
        var n = noise2(shell.x / 1.3e25, shell.y / 1.3e25);
        var strength = nearEdge * nearEdge;
        var gate = 0.78 - strength * 0.55;
        if (n > gate) {
          return gIndex(0.25 + strength * 0.7 * n) | ((strength > 0.45 ? C.cmb : C.cmbDim) << 8);
        }
      }
    }
    return 0;
  }

  function dist2To(x, y, z) {
    var dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
    return dx * dx + dy * dy + dz * dz;
  }

  function coreDir() {
    var dx = GC.x - cam.x, dy = GC.y - cam.y, dz = GC.z - cam.z;
    var d = Math.hypot(dx, dy, dz);
    if (d < 1 || d > 2500 * LY) return null;
    return { x: dx / d, y: dy / d, z: dz / d, d: d };
  }

  function segDist(px, py, pz, a, b) {
    var abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
    var apx = px - a.x, apy = py - a.y, apz = pz - a.z;
    var ab2 = abx * abx + aby * aby + abz * abz || 1;
    var t = clamp((apx * abx + apy * aby + apz * abz) / ab2, 0, 1);
    var cx = a.x + abx * t - px, cy = a.y + aby * t - py, cz = a.z + abz * t - pz;
    return Math.hypot(cx, cy, cz);
  }

  function cmbPoint(dx, dy, dz) {
    var b = cam.x * dx + cam.y * dy + cam.z * dz;
    var c0 = cam.x * cam.x + cam.y * cam.y + cam.z * cam.z - EDGE * EDGE;
    var disc = b * b - c0;
    if (disc < 0) return null;
    var t = -b + Math.sqrt(disc);
    if (t < 1) return null;
    return { x: cam.x + dx * t, y: cam.y + dy * t, z: cam.z + dz * t, t: t };
  }

  var limbT = 0;
  function limb(dx, dy, dz, body, width, col) {
    var lx = body.x - cam.x, ly = body.y - cam.y, lz = body.z - cam.z;
    var tca = lx * dx + ly * dy + lz * dz;
    if (tca < 1) return 0;
    var d2 = lx * lx + ly * ly + lz * lz - tca * tca;
    var miss = Math.sqrt(Math.max(0, d2)) - body.r;
    if (miss <= 0 || miss > width) return 0;
    var k = 1 - miss / width;
    var sl = Math.hypot(body.x, body.y, body.z) || 1;
    var sx = -body.x / sl, sy = -body.y / sl, sz = -body.z / sl;
    var px = cam.x + dx * tca, py = cam.y + dy * tca, pz = cam.z + dz * tca;
    var nx = px - body.x, ny = py - body.y, nz = pz - body.z;
    var nl = Math.hypot(nx, ny, nz) || 1;
    var light = (nx / nl) * sx + (ny / nl) * sy + (nz / nl) * sz;
    if (body.kind !== "sun" && light < 0.05) return 0;
    limbT = tca;
    return (k > 0.55 ? 4 : 2) | (col << 8);
  }

  function writeCell(i, g, col, t) {
    glyphs[i] = g;
    colors[i] = col;
    depth[i] = t;
  }

  function render(time) {
    updateCam();
    var n = cols * rows;
    depth.fill(1e40);
    var ink = 0;
    var camR = Math.hypot(cam.x, cam.y, cam.z);
    var gc2 = dist2To(GC.x, GC.y, GC.z);
    var insideMW = gc2 < (GAL_R * 0.92) * (GAL_R * 0.92);
    skyInside = gc2 < (GAL_R * 0.95) * (GAL_R * 0.95);
    coreOn = false;
    if (skyInside) {
      var cdx = GC.x - cam.x, cdy = GC.y - cam.y, cdz = GC.z - cam.z;
      var cd = Math.hypot(cdx, cdy, cdz);
      if (cd >= 1 && cd <= 2500 * LY) {
        coreOn = true;
        coreX = cdx / cd;
        coreY = cdy / cd;
        coreZ = cdz / cd;
        coreD = cd;
      }
    }
    var hole = bodies[20];
    var saturn = bodies[7];
    var sun = bodies[0];

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c;
        aim(c, r);
        var dx = dirx, dy = diry, dz = dirz;
        var bestT = 1e40;
        var bestG = 0, bestC = 0, hitBody = null;

        for (var b = 0; b < 11; b++) {
          var body = bodies[b];
          if (body.kind === "star") continue;
          var t = raySphere(dx, dy, dz, body.x, body.y, body.z, body.r);
          if (t && t < bestT) {
            bestT = t;
            hitBody = body;
          }
        }
        for (var s = 10; s < 20; s++) {
          var st = bodies[s];
          var sdx = st.x - cam.x, sdy = st.y - cam.y, sdz = st.z - cam.z;
          var sd2 = sdx * sdx + sdy * sdy + sdz * sdz;
          if (st.r * st.r * 4e4 < sd2) continue;
          var ts = raySphere(dx, dy, dz, st.x, st.y, st.z, st.r);
          if (ts && ts < bestT) {
            bestT = ts;
            hitBody = st;
          }
        }

        if (hitBody) {
          var px = cam.x + dx * bestT, py = cam.y + dy * bestT, pz = cam.z + dz * bestT;
          var nx = (px - hitBody.x) / hitBody.r;
          var ny = (py - hitBody.y) / hitBody.r;
          var nz = (pz - hitBody.z) / hitBody.r;
          var lit = 1;
          if (hitBody.kind !== "sun" && hitBody.kind !== "star") {
            var lx = sun.x - px, ly = sun.y - py, lz = sun.z - pz;
            var ll = Math.hypot(lx, ly, lz) || 1;
            lit = Math.max(0, nx * lx / ll + ny * ly / ll + nz * lz / ll);
          }
          var sh = shadePlanet(hitBody.kind, nx, ny, nz, lit, time);
          bestG = sh & 255;
          bestC = sh >>> 8;
          if (hitBody.kind === "star") bestC = hitBody.tint || C.starHot;
        }

        var tRing = rayPlane(dx, dy, dz, saturn.x, saturn.y, saturn.z, 0, Math.cos(0.48), Math.sin(0.48));
        if (tRing && tRing < bestT) {
          var rpx = cam.x + dx * tRing, rpy = cam.y + dy * tRing, rpz = cam.z + dz * tRing;
          var rg = shadeRing(rpx, rpy, rpz, saturn);
          if (rg) {
            bestT = tRing;
            bestG = rg.g;
            bestC = rg.col;
            hitBody = saturn;
          }
        }

        var holeHit = shadeHole(dx, dy, dz, hole);
        if (holeHit && holeHit.t < bestT) {
          bestT = holeHit.t;
          bestG = holeHit.g;
          bestC = holeHit.col;
          hitBody = hole;
        }

        if (!insideMW) {
          var mw = shadeDisk(dx, dy, dz, GC, GN, MW_B, GAL_R);
          if (mw && mw.t < bestT) {
            bestT = mw.t;
            bestG = mw.g;
            bestC = mw.col;
            hitBody = bodies[22];
          }
        }
        var and = shadeDisk(dx, dy, dz, AND, AND_N, AND_B, AND_R);
        if (and && and.t < bestT) {
          bestT = and.t;
          bestG = and.g;
          bestC = and.col;
          hitBody = bodies[21];
        }

        if (!hitBody) {
          var halo = limb(dx, dy, dz, sun, RSUN * 0.2, C.corona);
          var haloT = limbT;
          var earth = bodies[3];
          var atmo = limb(dx, dy, dz, earth, RE * 0.08, C.atmos);
          var atmoT = limbT;
          if (halo && (!atmo || haloT < atmoT)) {
            bestT = haloT; bestG = halo & 255; bestC = halo >>> 8;
          } else if (atmo) {
            bestT = atmoT; bestG = atmo & 255; bestC = atmo >>> 8;
          } else {
            var sky = skyPaint(dx, dy, dz, time, camR);
            bestG = sky & 255;
            bestC = sky >>> 8;
            bestT = bestC ? 1e30 : 1e40;
          }
        }

        writeCell(i, bestG, bestC, bestT);
        if (bestC) ink++;
      }
    }

    splatPoints(time);
    paint();
    return ink;
  }

  function splatPoints(time) {
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b.kind === "galaxy" || b.kind === "andromeda" || b.kind === "hole") continue;
      var dx = b.x - cam.x, dy = b.y - cam.y, dz = b.z - cam.z;
      var dist = Math.hypot(dx, dy, dz);
      if (dist < 1) continue;
      var ang = b.r / dist;
      var cellAng = cam.tanV * 2 / rows;
      if (ang > cellAng * 1.4) continue;
      var p = project(b.x, b.y, b.z);
      if (!p) continue;
      var g = 7, col = C.starHot;
      if (b.kind === "sun") { g = 6; col = C.sun1; }
      else if (b.kind === "star") { g = 6; col = b.tint || C.starHot; }
      else if (b.kind === "earth") { g = 5; col = C.sea2; }
      else if (b.kind === "moon") { g = 6; col = C.moon1; }
      else if (b.kind === "jupiter") { g = 6; col = C.jup1; }
      else if (b.kind === "saturn") { g = 6; col = C.sat; }
      else if (b.kind === "mars") { g = 4; col = C.mars; }
      else if (b.kind === "venus") { g = 4; col = C.venus; }
      else if (b.kind === "neptune") { g = 4; col = C.neptune; }
      else if (b.kind === "uranus") { g = 4; col = C.uranus; }
      else { g = 3; col = C.merc; }
      var tw = b.kind === "star" || b.kind === "sun" ? (0.5 + 0.5 * Math.sin(time * 3 + i)) : 1;
      if (tw < 0.25) g = 1;
      plot(p.c, p.r, g, col, dist);
      if ((b.kind === "sun" || b.kind === "moon") && ang > cellAng * 0.35) {
        plot(p.c, p.r - 1, 1, col, dist);
        plot(p.c, p.r + 1, 1, col, dist);
      }
    }
    if (Math.hypot(cam.x, cam.y, cam.z) > 2e24) {
      for (var f = 0; f < FILAMENTS.length; f++) {
        for (var k = 0; k < 2; k++) {
          var node = FILAMENTS[f][k];
          var pr = project(node.x, node.y, node.z);
          if (!pr) continue;
          plot(pr.c, pr.r, 8, C.bulge, pr.z);
          plot(pr.c + 1, pr.r, 4, C.gal, pr.z);
          plot(pr.c, pr.r + 1, 4, C.gal, pr.z);
        }
      }
    }
  }

  function project(wx, wy, wz) {
    var vx = wx - cam.x, vy = wy - cam.y, vz = wz - cam.z;
    var z = vx * cam.fx + vy * cam.fy + vz * cam.fz;
    if (z < 1) return null;
    var x = vx * cam.rx + vy * cam.ry + vz * cam.rz;
    var y = vx * cam.ux + vy * cam.uy + vz * cam.uz;
    var ndcX = x / (z * cam.tanH);
    var ndcY = y / (z * cam.tanV);
    var c = (ndcX + 1) * 0.5 * cols - 0.5;
    var r = (1 - (ndcY + cam.biasY)) * 0.5 * rows - 0.5;
    return { c: c, r: r, z: z };
  }

  function plot(c, r, g, col, t) {
    var ic = Math.round(c), ir = Math.round(r);
    if (ic < 0 || ir < 0 || ic >= cols || ir >= rows) return;
    var i = ir * cols + ic;
    if (depth[i] < t) return;
    glyphs[i] = g;
    colors[i] = col;
    depth[i] = t;
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAL[0];
    ctx.fillRect(0, 0, cssW, cssH);
    fitFont();
    var i0 = 0;
    for (var r = 0; r < rows; r++) {
      var c = 0;
      while (c < cols) {
        var col = colors[i0 + c];
        var e = c + 1;
        while (e < cols && colors[i0 + e] === col) e++;
        if (col !== 0) {
          var s = "";
          for (var k = c; k < e; k++) s += GLYPH[glyphs[i0 + k]];
          ctx.fillStyle = PAL[col];
          ctx.fillText(s, offX + c * cellW, offY + (r + 0.5) * cellH);
        }
        c = e;
      }
      i0 += cols;
    }
    if (!vignette || vigW !== cssW || vigH !== cssH) {
      vigW = cssW;
      vigH = cssH;
      vignette = ctx.createRadialGradient(cssW * 0.5, cssH * 0.46, cssW * 0.2, cssW * 0.5, cssH * 0.5, cssW * 0.95);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.28)");
    }
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, cssW, cssH);
  }

  function formatDist(meters) {
    var abs = Math.abs(meters);
    function fmt(n) {
      if (n >= 100) return String(Math.round(n));
      if (n >= 10) return n.toFixed(1);
      return n.toFixed(n >= 1 ? 2 : 2);
    }
    if (abs < 1e9) return fmt(abs / 1000) + " km";
    var au = abs / AU;
    if (au < 80000) return fmt(au) + " AU";
    var ly = abs / LY;
    if (ly < 1e6) return fmt(ly) + " ly";
    if (ly < 1e9) return fmt(ly / 1e6) + " Mly";
    return fmt(ly / 1e9) + " Gly";
  }

  function setText(el, s) {
    if (el && el.textContent !== s) el.textContent = s;
  }

  function centerBody() {
    var best = null;
    var cellAng = cam.tanV * 2 / rows;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b.kind === "galaxy") continue;
      var dx = b.x - cam.x, dy = b.y - cam.y, dz = b.z - cam.z;
      var dist = Math.hypot(dx, dy, dz) || 1;
      var dot = (dx * cam.fx + dy * cam.fy + dz * cam.fz) / dist;
      if (dot < 0.2) continue;
      var ang = Math.acos(clamp(dot, -1, 1));
      var ar = Math.asin(clamp(b.r / dist, 0, 1));
      if (b.kind === "andromeda") ar = Math.asin(clamp((AND_R * 0.45) / dist, 0, 1));
      var limit = Math.max(ar * 1.25, cellAng * 1.6);
      if (ang > limit) continue;
      if (!best || ang < best.ang) best = { body: b, ang: ang, ar: ar, dist: dist };
    }
    return best;
  }

  function bandOf(dist) {
    if (dist < 8e7) return ["Earth", FACT.earth, "earth"];
    if (dist < 2.2e9) return ["Earth & Moon", FACT.pair, "pair"];
    if (dist < 2e12) return ["Inner system", FACT.inner, "inner"];
    if (dist < 8e13) return ["Solar system", FACT.system, "system"];
    if (dist < 8e17) return ["Nearby stars", FACT.near, "near"];
    if (dist < 3e21) return ["Milky Way", FACT.inside, "inside"];
    if (dist < 2e23) return ["Local group", FACT.group, "group"];
    if (dist < 6e25) return ["Cosmic web", FACT.web, "web"];
    return ["The Edge", FACT.edge, "edge"];
  }

  function hud() {
    var dist = Math.pow(10, cam.logD);
    var hit = centerBody();
    var place, fact;
    var cellAng = cam.tanV * 2 / Math.max(8, rows);
    if (hit && hit.ar > cellAng * 0.7 && hit.ang < hit.ar * 1.25) {
      place = hit.body.name;
      fact = FACT[hit.body.kind] || FACT.near;
    } else if (cam.kind === "hole" && dist < HOLE_R * 40) {
      place = "The Core";
      fact = FACT.hole;
    } else if (cam.kind === "edge") {
      place = "The Edge";
      fact = FACT.edge;
    } else {
      var fromSun = Math.hypot(cam.x, cam.y, cam.z);
      var band = bandOf(Math.max(dist, fromSun));
      place = cam.focus && hit ? cam.focus : band[0];
      if (!hit) place = band[0];
      fact = band[1];
    }
    setText(elPlace, place);
    setText(elRange, formatDist(dist) + " out");
    setText(elFact, fact);
  }

  function markTour(name) {
    var buttons = panel.querySelectorAll("button[data-go]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle("on", buttons[i].getAttribute("data-go") === name);
    }
  }

  function startKeys(name, keys, spin) {
    tour = { name: name, keys: keys, spin: spin || 0, elapsed: 0, origin: snapshot() };
    markTour(name);
  }

  function startNamed(name) {
    if (name === "earth") startKeys("earth", [{ pose: earthPose(), dur: 1.5 }]);
    else if (name === "moon") startKeys("moon", [{ pose: moonPose(), dur: 2.1 }]);
    else if (name === "pair") startKeys("pair", [
      { pose: pairPose(0), dur: 2.2 },
      { pose: pairPose(0.85), dur: 6.2 },
      { pose: moonPose(), dur: 3.0 }
    ]);
    else if (name === "sun") startKeys("sun", [{ pose: sunPose(), dur: 2.3 }]);
    else if (name === "planets") startKeys("planets", [
      { pose: giantPose(bodies[6], 11), dur: 2.8 },
      { pose: giantPose(bodies[7], 12.5), dur: 4.2 }
    ], 0.08);
    else if (name === "galaxy") startKeys("galaxy", [{ pose: galaxyPose(), dur: 3.4 }], 0.045);
    else if (name === "core") startKeys("core", [
      { pose: galaxyPose(), dur: 0.9 },
      { pose: corePose(), dur: 6.4 }
    ]);
    else if (name === "edge") startKeys("edge", [{ pose: edgePose(), dur: 4.2 }]);
  }

  function stepTour(dt) {
    if (!tour) return;
    tour.elapsed += dt;
    var t = tour.elapsed;
    var from = tour.origin;
    for (var i = 0; i < tour.keys.length; i++) {
      var key = tour.keys[i];
      var last = i === tour.keys.length - 1;
      if (t < key.dur || last) {
        var u = key.dur <= 0 ? 1 : clamp(t / key.dur, 0, 1);
        var pose = lerpPose(from, key.pose, ease(u));
        applyPose(pose);
        if (last && u >= 1 && tour.spin) cam.yaw += dt * tour.spin;
        return;
      }
      t -= key.dur;
      from = key.pose;
    }
  }

  function pickAt(px, py) {
    var rect = canvas.getBoundingClientRect();
    var c = (px - rect.left - offX) / cellW;
    var r = (py - rect.top - offY) / cellH;
    aim(clamp(c, 0, cols - 1), clamp(r, 0, rows - 1));
    var best = null;
    var cellAng = cam.tanV * 2 / rows;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b.kind === "galaxy") continue;
      var dx = b.x - cam.x, dy = b.y - cam.y, dz = b.z - cam.z;
      var dist = Math.hypot(dx, dy, dz) || 1;
      var dot = (dx * dirx + dy * diry + dz * dirz) / dist;
      if (dot < 0) continue;
      var ang = Math.acos(clamp(dot, -1, 1));
      var radius = b.r;
      if (b.kind === "andromeda") radius = AND_R * 0.5;
      var ar = Math.asin(clamp(radius / dist, 0, 1));
      var limit = Math.max(ar * 1.5, cellAng * 2.2);
      if (b.kind === "star" || b.kind === "sun") limit = Math.max(limit, cellAng * 2.4);
      if (ang > limit) continue;
      if (!best || ang < best.ang) best = { body: b, ang: ang, dist: dist, ar: ar };
    }
    return best;
  }

  function flyToBody(b) {
    var dist = Math.pow(10, cam.logD);
    var framed = b.r * (b.kind === "sun" ? 3.4 : b.kind === "hole" ? 7.2 : b.kind === "galaxy" ? 1.85 : b.kind === "andromeda" ? 2.4 : 4.4);
    if (b.kind === "galaxy") {
      startKeys("", [{ pose: galaxyPose(), dur: 2.6 }]);
      return;
    }
    if (b.kind === "andromeda") {
      var offA = nrm(AND_N.x * 0.8 + 0.2, AND_N.y * 0.8, AND_N.z * 0.8 + 0.15);
      startKeys("", [{ pose: poseFrom(b, offA, AND_R * 2.3, AND_R * 0.3), dur: 2.8 }]);
      return;
    }
    if (b.kind === "hole") {
      startKeys("core", [{ pose: corePose(), dur: 2.4 }]);
      return;
    }
    var already = cam.focus === b.name && dist < b.r * 9;
    var dest = already ? Math.max(b.r * 1.12, dist / 6) : Math.max(framed, b.r * 1.12);
    var off = nrm(cam.x - b.x, cam.y - b.y, cam.z - b.z);
    if (!isFinite(off.x)) off = nrm(0.4, 0.3, 0.8);
    startKeys("", [{ pose: poseFrom(b, off, dest, b.kind === "edge" ? RE : b.r), dur: 1.6 }]);
  }

  function cellFromEvent(px, py) {
    var rect = canvas.getBoundingClientRect();
    return {
      c: (px - rect.left - offX) / cellW,
      r: (py - rect.top - offY) / cellH
    };
  }

  function onDouble(px, py) {
    var hit = pickAt(px, py);
    if (hit) {
      flyToBody(hit.body);
      return;
    }
    var cr = cellFromEvent(px, py);
    if (cr.c >= 0 && cr.r >= 0 && cr.c < cols && cr.r < rows) {
      cam.logD = Math.min(26.6, cam.logD + 1.2);
      cam.kind = "sky";
      clampLog();
    }
  }

  function pairDist() {
    var it = ptr.values();
    var a = it.next().value;
    var b = it.next().value;
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }

  function bind() {
    canvas.addEventListener("pointerdown", function (e) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { void err; }
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      tour = null;
      markTour("");
      if (ptr.size === 1) moved = 0;
      if (ptr.size >= 2) pinchD = pairDist();
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", function (e) {
      var p = ptr.get(e.pointerId);
      if (!p) return;
      var dx = e.clientX - p.x;
      var dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (ptr.size >= 2 && pinchD > 0) {
        var d = pairDist();
        var ratio = d / pinchD;
        if (ratio > 0 && isFinite(ratio)) {
          cam.logD -= Math.log10(ratio) * 3.15;
          cam.kind = "sky";
          clampLog();
        }
        pinchD = d;
      } else if (ptr.size === 1) {
        cam.yaw -= dx * 0.0072;
        cam.pitch = clamp(cam.pitch - dy * 0.0066, -1.15, 1.15);
      }
      e.preventDefault();
    });
    function endPtr(e) {
      var was = ptr.size;
      ptr.delete(e.pointerId);
      if (was === 1 && moved < 14) {
        var now = performance.now();
        if (now - lastTap < 340 && Math.hypot(e.clientX - tapX, e.clientY - tapY) < 30) {
          lastTap = 0;
          onDouble(e.clientX, e.clientY);
        } else {
          lastTap = now;
          tapX = e.clientX;
          tapY = e.clientY;
        }
      }
      if (ptr.size < 2) pinchD = 0;
    }
    canvas.addEventListener("pointerup", endPtr);
    canvas.addEventListener("pointercancel", function (e) {
      ptr.delete(e.pointerId);
      pinchD = 0;
    });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      tour = null;
      markTour("");
      cam.logD += (e.deltaY > 0 ? 1 : -1) * 0.22;
      cam.kind = "sky";
      clampLog();
    }, { passive: false });

    function stop(e) { e.stopPropagation(); }
    [toggle, panel].forEach(function (el) {
      el.addEventListener("pointerdown", stop);
      el.addEventListener("pointermove", stop);
      el.addEventListener("pointerup", stop);
      el.addEventListener("touchstart", stop, { passive: true });
      el.addEventListener("touchmove", stop, { passive: true });
    });
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = document.body.classList.toggle("ui-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    panel.addEventListener("click", function (e) {
      var button = e.target.closest ? e.target.closest("button[data-go]") : null;
      if (!button) return;
      e.stopPropagation();
      startNamed(button.getAttribute("data-go"));
    });
  }

  function notify() {
    if (sentReady) return;
    var gb = window.__gbSandbox;
    if (gb && typeof gb.ready === "function") {
      sentReady = true;
      gb.ready();
    }
  }

  var lastNow = 0;
  function frame(now) {
    var dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
    lastNow = now;
    stepTour(dt);
    resize();
    var time = (now - clock0) * 0.001;
    var ink = render(time);
    hud();
    if (ink > 24) notify();
    requestAnimationFrame(frame);
  }

  applyPose(earthPose());
  bind();
  resize();
  var ink0 = render((performance.now() - clock0) * 0.001);
  hud();
  if (ink0 > 24) notify();
  requestAnimationFrame(frame);
})();
