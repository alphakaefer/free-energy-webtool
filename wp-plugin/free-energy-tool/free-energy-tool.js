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

    function row(label, explain, formula, result, color) {
      return '<tr>' +
        '<td style="padding:5px 8px 5px 0;vertical-align:top;white-space:nowrap;color:#888;font-size:0.9em;">' + label + '</td>' +
        '<td style="padding:5px 8px 5px 0;vertical-align:top;color:#aaa;font-size:0.82em;font-family:sans-serif;font-style:italic;">' + explain + '</td>' +
        '<td style="padding:5px 8px;vertical-align:top;color:#555;">' + formula + '</td>' +
        '<td style="padding:5px 0;vertical-align:top;font-weight:800;color:' + (color||'#2c3e8a') + ';">' + result + '</td>' +
        '</tr>';
    }

    function section(title, color) {
      return '<tr><td colspan="4" style="padding:12px 0 4px;font-weight:700;font-size:0.85em;color:' + color + ';border-top:1px solid #e8eaf6;letter-spacing:0.03em;">' + title + '</td></tr>';
    }

    function updateFormulas(po, err, fe) {
      var cv      = s.ps * s.ps + s.ss * s.ss;
      var pp      = 1 / (s.ps * s.ps);
      var sp      = 1 / (s.ss * s.ss);
      var tp      = pp + sp;
      var logTerm = 0.5 * Math.log(2 * Math.PI * cv);
      var errTerm = (s.pm - s.ob) * (s.pm - s.ob) / (2 * cv);

      var f = q('fetool-formula-box');
      if (!f) return;

      var html = '';

      // Current values summary
      html += '<div style="background:#eef2ff;border-radius:6px;padding:9px 12px;margin-bottom:12px;font-family:sans-serif;font-size:0.82em;color:#444;line-height:1.8;">';
      html += '<b style="color:#333;">Aktuelle Reglerwerte:</b><br>';
      html += '&nbsp;&nbsp;<span style="color:#5b6af5;font-weight:700;">μ<sub>prior</sub> = ' + s.pm.toFixed(1) + '</span> &nbsp;(Erwarteter Treffer)&nbsp;&nbsp;&nbsp;';
      html += '<span style="color:#5b6af5;font-weight:700;">σ<sub>prior</sub> = ' + s.ps.toFixed(1) + '</span> &nbsp;(Unsicherheit im Modell)<br>';
      html += '&nbsp;&nbsp;<span style="color:#27ae60;font-weight:700;">Beobachtung = ' + s.ob.toFixed(1) + '</span> &nbsp;(Beobachteter Treffer)&nbsp;&nbsp;&nbsp;';
      html += '<span style="color:#27ae60;font-weight:700;">σ<sub>sensor</sub> = ' + s.ss.toFixed(1) + '</span> &nbsp;(Sensorunsicherheit)';
      html += '</div>';

      html += '<div style="font-family:sans-serif;font-size:0.8em;color:#555;margin-bottom:8px;line-height:1.6;">';
      html += '<b>Symbole:</b> &nbsp; μ (mu) = Mittelwert einer Verteilung &nbsp;|&nbsp; σ (sigma) = Streuung / Unsicherheit &nbsp;|&nbsp; π (pi, hier) = Präzision = 1/σ²</div>';

      html += '<table style="width:100%;border-collapse:collapse;">';

      // Section 1: Precision
      html += section('① Präzision berechnen — wie zuverlässig sind Prior und Sensor?', '#5b6af5');
      html += '<tr><td colspan="4" style="font-size:0.78em;color:#888;padding:0 0 6px;font-family:sans-serif;font-style:italic;">Präzision π = 1/σ² — je kleiner die Unsicherheit σ, desto größer die Präzision. Wer präziser ist, bekommt mehr Gewicht beim Update.</td></tr>';
      html += row('π<sub>prior</sub>', 'Präzision deines Modells', '1 / ' + s.ps.toFixed(1) + '² = 1 / ' + (s.ps*s.ps).toFixed(2), pp.toFixed(3), '#5b6af5');
      html += row('π<sub>sensor</sub>', 'Präzision deiner Augen', '1 / ' + s.ss.toFixed(1) + '² = 1 / ' + (s.ss*s.ss).toFixed(2), sp.toFixed(3), '#27ae60');
      html += row('π<sub>gesamt</sub>', 'Summe beider Präzisionen', pp.toFixed(3) + ' + ' + sp.toFixed(3), tp.toFixed(3), '#333');

      // Section 2: Bayesian update
      html += section('② Bayesianisches Update — wie entsteht der Posterior?', '#e84040');
      html += '<tr><td colspan="4" style="font-size:0.78em;color:#888;padding:0 0 6px;font-family:sans-serif;font-style:italic;">Der Posterior-Mittelwert ist ein präzisionsgewichteter Durchschnitt: Wer präziser ist, zieht stärker. Ergebnis liegt immer zwischen Prior und Beobachtung.</td></tr>';
      html += row('μ<sub>post</sub>', 'Aktualisierter Mittelwert',
        '(' + s.pm.toFixed(1) + '×' + pp.toFixed(3) + ' + ' + s.ob.toFixed(1) + '×' + sp.toFixed(3) + ') / ' + tp.toFixed(3),
        po.mean.toFixed(3), '#e84040');
      html += row('σ<sub>post</sub>', 'Neue (kleinere) Unsicherheit',
        '√(1 / ' + tp.toFixed(3) + ')',
        po.sig.toFixed(3), '#e84040');

      // Section 3: Prediction error
      html += section('③ Vorhersagefehler (Prediction Error)', '#e87040');
      html += '<tr><td colspan="4" style="font-size:0.78em;color:#888;padding:0 0 6px;font-family:sans-serif;font-style:italic;">Der Abstand zwischen Erwartung und Beobachtung. Großer Fehler → viel Lernpotenzial. Treibt sowohl Lernen als auch Handeln an.</td></tr>';
      html += row('PE', '|Erwartung − Treffer|',
        '|' + s.pm.toFixed(1) + ' − ' + s.ob.toFixed(1) + '|',
        err.toFixed(3), '#e87040');

      // Section 4: Free Energy
      html += section('④ Free Energy — das Maß für Überraschung', '#2c3e8a');
      html += '<tr><td colspan="4" style="font-size:0.78em;color:#888;padding:0 0 6px;font-family:sans-serif;font-style:italic;">F setzt sich aus zwei Teilen zusammen: Wie groß ist der Fehler? (Accuracy-Term) + Wie komplex/unsicher ist das Modell? (Complexity-Term)</td></tr>';
      html += row('Accuracy', 'Fehler-Anteil an F',
        'PE² / (2·(σ²<sub>prior</sub>+σ²<sub>sensor</sub>)) = ' + err.toFixed(2) + '² / (2·' + cv.toFixed(2) + ')',
        errTerm.toFixed(3), '#2c3e8a');
      html += row('Complexity', 'Modell-Komplexitäts-Anteil',
        '½·ln(2π·' + cv.toFixed(2) + ')',
        logTerm.toFixed(3), '#2c3e8a');
      html += row('<b>F gesamt</b>', '<b>Accuracy + Complexity</b>',
        errTerm.toFixed(3) + ' + ' + logTerm.toFixed(3),
        '<span style="font-size:1.2em;">' + fe.toFixed(3) + '</span>', '#c0392b');

      html += '</table>';
      f.innerHTML = html;
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
