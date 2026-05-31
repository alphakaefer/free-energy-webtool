(function() {
  function init() {
    var root   = document.getElementById('fetool-wrap');
    var canvas = document.getElementById('fetool-canvas');
    if (!root || !canvas) return;

    var ctx = canvas.getContext('2d');
    var s   = { pm: 5, ps: 1.5, ob: 7.5, ss: 1.0 };
    var animId = null;

    function q(id) { return root.querySelector('#' + id); }

    function setSize() {
      var w = canvas.parentElement.clientWidth - 24;
      if (w < 200) w = 400;
      canvas.width  = Math.round(w);
      canvas.height = Math.round(w * 0.33);
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

    function xc(x) {
      var pad = 36;
      return pad + (x / 10) * (canvas.width - 2 * pad);
    }

    function drawCurve(mu, sig, color, fill) {
      var pad = 36, steps = 300, H = canvas.height;
      ctx.beginPath();
      for (var i = 0; i <= steps; i++) {
        var x  = i / steps * 10;
        var y  = gauss(x, mu, sig);
        var cx = xc(x);
        var cy = pad + (1 - y) * (H - pad * 1.8);
        if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      }
      if (fill) {
        ctx.lineTo(xc(10), H - pad * 0.8);
        ctx.lineTo(xc(0),  H - pad * 0.8);
        ctx.closePath();
        ctx.fillStyle = color + '28';
        ctx.fill();
        // redraw stroke path
        ctx.beginPath();
        for (var j = 0; j <= steps; j++) {
          var xj = j / steps * 10;
          var yj = gauss(xj, mu, sig);
          var cxj = xc(xj);
          var cyj = pad + (1 - yj) * (H - pad * 1.8);
          if (j === 0) ctx.moveTo(cxj, cyj); else ctx.lineTo(cxj, cyj);
        }
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    function drawField() {
      var pad = 36, W = canvas.width, H = canvas.height;
      var base = H - pad * 0.8;
      ctx.strokeStyle = '#dde'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad, base); ctx.lineTo(W - pad, base); ctx.stroke();
      ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
      [2.5, 7.5].forEach(function(gx) {
        var cx = xc(gx);
        ctx.beginPath(); ctx.moveTo(cx, pad * 0.5); ctx.lineTo(cx, base); ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(xc(2.5), pad * 0.5); ctx.lineTo(xc(7.5), pad * 0.5); ctx.stroke();
      var fs = Math.max(9, Math.round(W * 0.016));
      ctx.fillStyle = '#aaa'; ctx.font = fs + 'px sans-serif'; ctx.textAlign = 'center';
      for (var t = 0; t <= 10; t += 2) ctx.fillText(t + 'm', xc(t), H - 3);
    }

    function drawVLine(x, color) {
      var pad = 36, H = canvas.height, cx = xc(x);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, pad * 0.5); ctx.lineTo(cx, H - pad * 0.8); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = Math.max(9, Math.round(canvas.width * 0.016)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(x.toFixed(1) + 'm', cx, pad * 0.3);
      ctx.restore();
    }

    function drawErrorBracket() {
      if (Math.abs(s.pm - s.ob) < 0.15) return;
      var pad = 36, H = canvas.height;
      var y  = H - pad * 0.8 - 10;
      var x1 = xc(Math.min(s.pm, s.ob));
      var x2 = xc(Math.max(s.pm, s.ob));
      ctx.save();
      ctx.strokeStyle = '#e87040'; ctx.fillStyle = '#e87040'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      [[x1, -1],[x2, 1]].forEach(function(a) {
        ctx.beginPath(); ctx.moveTo(a[0], y);
        ctx.lineTo(a[0] + a[1] * 5, y - 3.5);
        ctx.lineTo(a[0] + a[1] * 5, y + 3.5);
        ctx.closePath(); ctx.fill();
      });
      ctx.font = Math.max(9, Math.round(canvas.width * 0.014)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Vorhersagefehler', (x1 + x2) / 2, y - 6);
      ctx.restore();
    }

    function render() {
      if (!canvas.width || !canvas.height) setSize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawField();
      drawCurve(s.pm, s.ps, '#5b6af5', true);
      drawCurve(s.ob, s.ss, '#27ae60', true);
      var po = posterior();
      drawCurve(po.mean, po.sig, '#e84040', false);
      drawVLine(s.ob, '#27ae6099');
      drawErrorBracket();

      q('fetool-lbl-pm').textContent = s.pm.toFixed(1) + ' m';
      q('fetool-lbl-ps').textContent = s.ps.toFixed(1) + ' m';
      q('fetool-lbl-ob').textContent = s.ob.toFixed(1) + ' m';
      q('fetool-lbl-ss').textContent = s.ss.toFixed(1) + ' m';

      var po2 = posterior();
      q('fetool-m-post').textContent = po2.mean.toFixed(2);
      var err = Math.abs(s.pm - s.ob);
      var fe  = freeEnergy();
      q('fetool-m-err').textContent = err.toFixed(2);
      q('fetool-m-fe').textContent  = fe.toFixed(2);

      var hue = Math.max(0, 120 - err * 18);
      q('fetool-m-err').style.color = 'hsl(' + hue + ',65%,35%)';
      q('fetool-m-fe').style.color  = 'hsl(' + hue + ',65%,35%)';

      var norm = Math.min(1, Math.max(0, (fe - 0.5) / 8));
      var bar  = q('fetool-fe-bar');
      bar.style.width = (norm * 100).toFixed(1) + '%';
      bar.style.backgroundColor = 'hsl(' + Math.round((1 - norm) * 120) + ',65%,45%)';
    }

    [['fetool-sl-pm','pm'],['fetool-sl-ps','ps'],['fetool-sl-ob','ob'],['fetool-sl-ss','ss']].forEach(function(row) {
      var el = q(row[0]);
      if (!el) return;
      el.addEventListener('input', function() {
        s[row[1]] = parseFloat(this.value);
        q('fetool-log').textContent = 'Regler verändert — beobachte, wie Posterior und Free Energy reagieren.';
        render();
      });
    });

    function animateTo(key, target, slId, msg) {
      if (animId) cancelAnimationFrame(animId);
      var start = s[key], diff = target - start;
      if (Math.abs(diff) < 0.05) {
        q('fetool-log').textContent = 'Schon minimal — kein weiterer Konflikt!';
        return;
      }
      var step = 0, steps = 40;
      function frame() {
        step++;
        var t = 1 - Math.pow(1 - step / steps, 3);
        s[key] = start + diff * t;
        var sl = q(slId);
        if (sl) sl.value = s[key];
        render();
        if (step < steps) animId = requestAnimationFrame(frame);
        else { animId = null; q('fetool-log').textContent = msg; }
      }
      animId = requestAnimationFrame(frame);
    }

    q('fetool-btn-p').addEventListener('click', function() {
      q('fetool-log').textContent = 'Wahrnehmung: Überzeugung (Prior) wird an die Beobachtung angepasst…';
      animateTo('pm', s.ob, 'fetool-sl-pm',
        'Fertig. Der Torwart hat seine Erwartung aktualisiert — Vorhersagefehler und Free Energy sinken.');
    });

    q('fetool-btn-a').addEventListener('click', function() {
      q('fetool-log').textContent = 'Aktion: Der Torwart bewegt sich — Beobachtung nähert sich dem Prior…';
      animateTo('ob', s.pm, 'fetool-sl-ob',
        'Fertig. Durch Bewegung stimmt die Welt wieder mit der Erwartung überein — Free Energy sinkt ebenso.');
    });

    q('fetool-btn-r').addEventListener('click', function() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      s = { pm: 5, ps: 1.5, ob: 7.5, ss: 1.0 };
      [['fetool-sl-pm',5],['fetool-sl-ps',1.5],['fetool-sl-ob',7.5],['fetool-sl-ss',1.0]].forEach(function(r) {
        var el = q(r[0]); if (el) el.value = r[1];
      });
      q('fetool-log').textContent = 'Zurückgesetzt. Ausgangslage: Erwartung 5m (Mitte), Ball kommt rechts bei 7.5m.';
      render();
    });

    window.addEventListener('resize', function() { setSize(); render(); });

    setSize();
    render();
  }

  // Run after DOM + layout are ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 100); });
  } else {
    setTimeout(init, 100);
  }
})();
