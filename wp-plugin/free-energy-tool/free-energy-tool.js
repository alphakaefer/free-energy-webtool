(function() {
  function init() {
    var root   = document.getElementById('fetool-wrap');
    var canvas = document.getElementById('fetool-canvas');
    if (!root || !canvas) return;

    var ctx    = canvas.getContext('2d');
    var s      = { pm: 5, ps: 1.8, ob: 7.2, ss: 1.0 };
    var animId = null;

    function q(id) { return root.querySelector('#' + id); }

    function setSize() {
      var w = canvas.parentElement.clientWidth;
      if (w < 100) w = 400;
      canvas.width  = Math.round(w);
      canvas.height = Math.round(w * 0.38);
    }

    function gauss(x, mu, sig) {
      return Math.exp(-0.5 * Math.pow((x - mu) / sig, 2));
    }

    function posterior() {
      var pp = 1 / (s.ps * s.ps), sp = 1 / (s.ss * s.ss), tp = pp + sp;
      return { mean: (s.pm * pp + s.ob * sp) / tp, sig: Math.sqrt(1 / tp) };
    }

    function freeEnergy() {
      var cv = s.ps * s.ps + s.ss * s.ss;
      return Math.pow(s.pm - s.ob, 2) / (2 * cv) + 0.5 * Math.log(2 * Math.PI * cv);
    }

    var XMIN = 0, XMAX = 10;
    function xc(x) {
      var pad = 30;
      return pad + ((x - XMIN) / (XMAX - XMIN)) * (canvas.width - 2 * pad);
    }

    function drawCurve(mu, sig, color, fill) {
      var pad = 30, steps = 300, H = canvas.height;
      var topPad = 32, bottomPad = 22;
      var plotH = H - topPad - bottomPad;

      ctx.beginPath();
      for (var i = 0; i <= steps; i++) {
        var x  = XMIN + i / steps * (XMAX - XMIN);
        var y  = gauss(x, mu, sig);
        var cx = xc(x);
        var cy = topPad + (1 - y) * plotH;
        if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      }
      if (fill) {
        ctx.lineTo(xc(XMAX), topPad + plotH);
        ctx.lineTo(xc(XMIN), topPad + plotH);
        ctx.closePath();
        ctx.fillStyle = color + '30';
        ctx.fill();
        ctx.beginPath();
        for (var j = 0; j <= steps; j++) {
          var xj = XMIN + j / steps * (XMAX - XMIN);
          var yj = gauss(xj, mu, sig);
          if (j === 0) ctx.moveTo(xc(xj), topPad + (1 - yj) * plotH);
          else ctx.lineTo(xc(xj), topPad + (1 - yj) * plotH);
        }
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    function drawBoard() {
      var pad = 30, W = canvas.width, H = canvas.height;
      var topPad = 32, bottomPad = 22;
      var baseline = H - bottomPad;

      // baseline
      ctx.strokeStyle = '#e0e4f0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad, baseline); ctx.lineTo(W - pad, baseline); ctx.stroke();

      // target zone (bullseye area around 5m)
      var targetX = xc(5);
      ctx.save();
      ctx.globalAlpha = 0.12;
      for (var r = 3; r >= 1; r--) {
        ctx.beginPath();
        ctx.arc(targetX, baseline, r * 12, 0, Math.PI, true);
        ctx.fillStyle = r === 1 ? '#e84040' : r === 2 ? '#e87040' : '#f0c040';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // target label
      ctx.fillStyle = '#ccc';
      ctx.font = Math.max(8, Math.round(W * 0.013)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ziel', targetX, baseline - 38);

      // x-axis ticks
      ctx.fillStyle = '#bbb';
      ctx.font = Math.max(9, Math.round(W * 0.015)) + 'px sans-serif';
      ctx.textAlign = 'center';
      for (var t = 0; t <= 10; t += 2) {
        var tx = xc(t);
        ctx.fillText(t, tx, H - 4);
        ctx.strokeStyle = '#eee'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(tx, topPad); ctx.lineTo(tx, baseline); ctx.stroke();
      }
      ctx.fillStyle = '#aaa';
      ctx.font = Math.max(8, Math.round(W * 0.013)) + 'px sans-serif';
      ctx.fillText('links', xc(0.8), baseline - 5);
      ctx.fillText('rechts', xc(9.2), baseline - 5);
    }

    function drawVLine(x, color) {
      var pad = 30, H = canvas.height, topPad = 32, bottomPad = 22;
      var cx = xc(x);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = color; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(cx, topPad); ctx.lineTo(cx, H - bottomPad); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = 'bold ' + Math.max(9, Math.round(canvas.width * 0.016)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(x.toFixed(1), cx, topPad - 4);
      ctx.restore();
    }

    function drawErrorBracket() {
      if (Math.abs(s.pm - s.ob) < 0.1) return;
      var H = canvas.height, bottomPad = 22;
      var y  = H - bottomPad - 8;
      var x1 = xc(Math.min(s.pm, s.ob));
      var x2 = xc(Math.max(s.pm, s.ob));
      ctx.save();
      ctx.strokeStyle = '#e87040aa'; ctx.fillStyle = '#e87040';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      [[x1, -1],[x2, 1]].forEach(function(a) {
        ctx.beginPath(); ctx.moveTo(a[0], y);
        ctx.lineTo(a[0] + a[1] * 5, y - 3); ctx.lineTo(a[0] + a[1] * 5, y + 3);
        ctx.closePath(); ctx.fill();
      });
      ctx.font = Math.max(8, Math.round(canvas.width * 0.013)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PE = ' + Math.abs(s.pm - s.ob).toFixed(1), (x1 + x2) / 2, y - 5);
      ctx.restore();
    }

    function render() {
      if (!canvas.width || !canvas.height) setSize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBoard();
      drawCurve(s.pm, s.ps, '#5b6af5', true);
      drawCurve(s.ob, s.ss, '#27ae60', true);
      var po = posterior();
      drawCurve(po.mean, po.sig, '#e84040', false);
      drawVLine(s.ob, '#27ae6099');
      drawErrorBracket();

      // labels
      q('fetool-lbl-pm').textContent = s.pm.toFixed(1);
      q('fetool-lbl-ps').textContent = s.ps.toFixed(1);
      q('fetool-lbl-ob').textContent = s.ob.toFixed(1);
      q('fetool-lbl-ss').textContent = s.ss.toFixed(1);

      // metrics
      var err = Math.abs(s.pm - s.ob);
      var fe  = freeEnergy();
      q('fetool-m-post').textContent = po.mean.toFixed(2);
      q('fetool-m-err').textContent  = err.toFixed(2);
      q('fetool-m-fe').textContent   = fe.toFixed(2);

      var hue = Math.max(0, 120 - err * 16);
      q('fetool-m-err').style.color = 'hsl(' + hue + ',65%,35%)';
      q('fetool-m-fe').style.color  = 'hsl(' + hue + ',65%,35%)';

      var norm = Math.min(1, Math.max(0, (fe - 0.5) / 8));
      var bar  = q('fetool-fe-bar');
      bar.style.width = (norm * 100).toFixed(1) + '%';
      bar.style.backgroundColor = 'hsl(' + Math.round((1 - norm) * 120) + ',65%,45%)';

      updateFormulas(po, err, fe);
    }

    function updateFormulas(po, err, fe) {
      var cv     = s.ps * s.ps + s.ss * s.ss;
      var pp     = 1 / (s.ps * s.ps);
      var sp     = 1 / (s.ss * s.ss);
      var tp     = pp + sp;
      var num    = s.pm * pp + s.ob * sp;
      var logTerm = 0.5 * Math.log(2 * Math.PI * cv);
      var errTerm = (s.pm - s.ob) * (s.pm - s.ob) / (2 * cv);

      var f = q('fetool-formula-box');
      if (!f) return;
      f.innerHTML =
        '<b>Bayesianisches Update (Posterior-Mittelwert):</b><br>' +
        'Präzision Prior: π<sub>prior</sub> = 1 / ' + s.ps.toFixed(1) + '² = <b>' + pp.toFixed(3) + '</b><br>' +
        'Präzision Sensor: π<sub>sensor</sub> = 1 / ' + s.ss.toFixed(1) + '² = <b>' + sp.toFixed(3) + '</b><br>' +
        'Gesamt-Präzision: π<sub>gesamt</sub> = ' + pp.toFixed(3) + ' + ' + sp.toFixed(3) + ' = <b>' + tp.toFixed(3) + '</b><br>' +
        'μ<sub>post</sub> = (' + s.pm.toFixed(1) + ' × ' + pp.toFixed(3) + ' + ' + s.ob.toFixed(1) + ' × ' + sp.toFixed(3) + ') / ' + tp.toFixed(3) + ' = <b>' + po.mean.toFixed(3) + '</b><br>' +
        'σ<sub>post</sub> = √(1 / ' + tp.toFixed(3) + ') = <b>' + po.sig.toFixed(3) + '</b><br><br>' +
        '<b>Vorhersagefehler (Prediction Error):</b><br>' +
        'PE = |μ<sub>prior</sub> − Beobachtung| = |' + s.pm.toFixed(1) + ' − ' + s.ob.toFixed(1) + '| = <b>' + err.toFixed(3) + '</b><br><br>' +
        '<b>Free Energy (vereinfacht, Gaußsche Annahme):</b><br>' +
        'F = PE² / (2 · (σ²<sub>prior</sub> + σ²<sub>sensor</sub>)) + ½ · ln(2π · (σ²<sub>prior</sub> + σ²<sub>sensor</sub>))<br>' +
        'F = ' + (s.pm - s.ob).toFixed(2) + '² / (2 · ' + cv.toFixed(2) + ') + ½ · ln(2π · ' + cv.toFixed(2) + ')<br>' +
        'F = <b>' + errTerm.toFixed(3) + '</b> + <b>' + logTerm.toFixed(3) + '</b> = <b>' + fe.toFixed(3) + '</b>';
    }

    // Sliders
    [['fetool-sl-pm','pm'],['fetool-sl-ps','ps'],['fetool-sl-ob','ob'],['fetool-sl-ss','ss']].forEach(function(row) {
      var el = q(row[0]);
      if (!el) return;
      el.addEventListener('input', function() {
        s[row[1]] = parseFloat(this.value);
        q('fetool-log').textContent = 'Regler verändert.';
        render();
      });
    });

    function animateTo(key, target, slId, msg) {
      if (animId) cancelAnimationFrame(animId);
      var start = s[key], diff = target - start;
      if (Math.abs(diff) < 0.05) {
        q('fetool-log').textContent = 'Bereits minimal — kein Konflikt mehr!';
        return;
      }
      var step = 0, steps = 45;
      function frame() {
        step++;
        var t = 1 - Math.pow(1 - step / steps, 3);
        s[key] = start + diff * t;
        var sl = q(slId); if (sl) sl.value = s[key];
        render();
        if (step < steps) animId = requestAnimationFrame(frame);
        else { animId = null; q('fetool-log').textContent = msg; }
      }
      animId = requestAnimationFrame(frame);
    }

    q('fetool-btn-p').addEventListener('click', function() {
      q('fetool-log').textContent = 'Lernen: Das innere Modell (Prior) passt sich dem beobachteten Treffer an…';
      animateTo('pm', s.ob, 'fetool-sl-pm',
        'Fertig. Das Modell wurde aktualisiert — du weißt jetzt genauer, wohin du wirklich wirfst. Free Energy sinkt.');
    });

    q('fetool-btn-a').addEventListener('click', function() {
      q('fetool-log').textContent = 'Anpassen: Du korrigierst deinen Wurf, sodass der Treffer deiner Erwartung entspricht…';
      animateTo('ob', s.pm, 'fetool-sl-ob',
        'Fertig. Durch aktive Korrektur trifft der Pfeil näher an dein Ziel. Free Energy sinkt ebenso.');
    });

    q('fetool-btn-r').addEventListener('click', function() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      s = { pm: 5, ps: 1.8, ob: 7.2, ss: 1.0 };
      [['fetool-sl-pm',5],['fetool-sl-ps',1.8],['fetool-sl-ob',7.2],['fetool-sl-ss',1.0]].forEach(function(r) {
        var el = q(r[0]); if (el) el.value = r[1];
      });
      q('fetool-log').textContent = 'Zurückgesetzt. Ausgangslage: Du erwartest Mitte (5), triffst aber rechts (7.2).';
      render();
    });

    window.addEventListener('resize', function() { setSize(); render(); });

    setSize();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 100); });
  } else {
    setTimeout(init, 100);
  }
})();
