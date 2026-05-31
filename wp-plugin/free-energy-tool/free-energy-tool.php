<?php
/**
 * Plugin Name: Free Energy Tool
 * Description: Interaktives Lernwerkzeug zum Free Energy Principle. Einbinden mit [free_energy_tool]
 * Version: 1.1
 * Author: alphakaefer
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function fet_enqueue() {
    global $post;
    if ( is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'free_energy_tool' ) ) {
        wp_enqueue_script(
            'free-energy-tool',
            plugin_dir_url( __FILE__ ) . 'free-energy-tool.js',
            array(), '1.1', true
        );
    }
}
add_action( 'wp_enqueue_scripts', 'fet_enqueue' );

function fet_shortcode( $atts ) {
    ob_start();
    ?>
    <div id="fetool-wrap">
    <style>
      #fetool-wrap * { box-sizing: border-box; margin: 0; padding: 0; }
      #fetool-wrap {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        max-width: 860px; margin: 0 auto; color: #1a1a2e;
        background: #f4f6ff; border-radius: 14px; padding: 22px 22px 18px;
      }
      #fetool-wrap h2 { font-size: 1.3em; margin-bottom: 4px; }
      #fetool-wrap .ft-intro {
        font-size: 0.84em; color: #555; margin-bottom: 16px; line-height: 1.6;
        background: #fff; border-left: 3px solid #5b6af5;
        padding: 10px 14px; border-radius: 0 8px 8px 0;
      }
      #fetool-wrap .ft-intro strong { color: #333; }

      /* ── Main grid: canvas left, sliders right ── */
      #fetool-wrap .ft-main {
        display: grid;
        grid-template-columns: 1fr 260px;
        gap: 14px;
        margin-bottom: 12px;
        align-items: start;
      }
      @media(max-width: 620px) {
        #fetool-wrap .ft-main { grid-template-columns: 1fr; }
      }

      /* Canvas */
      #fetool-wrap .ft-canvas-box {
        background: #fff; border: 1px solid #dde; border-radius: 10px;
        padding: 10px 10px 6px;
      }
      #fetool-wrap #fetool-canvas { display: block; width: 100%; }
      #fetool-wrap .ft-legend {
        display: flex; flex-wrap: wrap; gap: 8px 14px;
        margin-top: 7px; font-size: 0.75em; color: #666;
      }
      #fetool-wrap .ft-legend span { display: flex; align-items: center; gap: 5px; }
      #fetool-wrap .ft-ld { display: inline-block; width: 22px; height: 3px; border-radius: 2px; }

      /* Sliders panel */
      #fetool-wrap .ft-sliders {
        background: #fff; border: 1px solid #dde; border-radius: 10px;
        padding: 14px;
        display: flex; flex-direction: column; gap: 14px;
      }
      #fetool-wrap .ft-sliders h4 {
        font-size: 0.82em; color: #999; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.04em;
        margin-bottom: -4px;
      }
      #fetool-wrap .ft-cg { display: flex; flex-direction: column; gap: 3px; }
      #fetool-wrap .ft-cg .ft-cg-label {
        font-size: 0.82em; font-weight: 600; color: #333;
        display: flex; justify-content: space-between;
      }
      #fetool-wrap .ft-cg .ft-cg-label em {
        font-style: normal; font-weight: 700; color: #5b6af5;
      }
      #fetool-wrap .ft-cg .ft-cg-desc { font-size: 0.73em; color: #999; }
      #fetool-wrap input[type=range] { width: 100%; accent-color: #5b6af5; cursor: pointer; margin-top: 1px; }
      #fetool-wrap .ft-sep { border: none; border-top: 1px solid #eef; margin: 0; }

      /* Buttons row — directly below main grid */
      #fetool-wrap .ft-actions {
        background: #fff; border: 1px solid #dde; border-radius: 10px;
        padding: 14px 16px; margin-bottom: 12px;
      }
      #fetool-wrap .ft-actions h4 {
        font-size: 0.82em; color: #999; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px;
      }
      #fetool-wrap .ft-action-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
      }
      @media(max-width:480px){ #fetool-wrap .ft-action-grid { grid-template-columns: 1fr; } }
      #fetool-wrap .ft-action-card {
        border: 1px solid #dde; border-radius: 8px; padding: 10px 12px;
        font-size: 0.82em; color: #444; line-height: 1.5;
      }
      #fetool-wrap .ft-action-card strong { display: block; font-size: 0.9em; margin-bottom: 4px; }
      #fetool-wrap .ft-btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
      #fetool-wrap button {
        padding: 8px 18px; border: none; border-radius: 7px;
        font-size: 0.85em; font-weight: 700; cursor: pointer;
        transition: transform 0.1s, box-shadow 0.1s;
      }
      #fetool-wrap button:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); transform: translateY(-1px); }
      #fetool-wrap button:active { transform: scale(0.97); }
      #fetool-wrap .ft-bp { background: #5b6af5; color: #fff; }
      #fetool-wrap .ft-ba { background: #e87040; color: #fff; }
      #fetool-wrap .ft-br { background: #eee; color: #666; }
      #fetool-wrap .ft-log {
        margin-top: 9px; font-size: 0.8em; color: #666;
        min-height: 18px; font-style: italic;
      }

      /* Metrics */
      #fetool-wrap .ft-metrics {
        display: grid; grid-template-columns: repeat(3,1fr);
        gap: 10px; margin-bottom: 12px;
      }
      @media(max-width:480px){ #fetool-wrap .ft-metrics { grid-template-columns: 1fr 1fr; } }
      #fetool-wrap .ft-mc {
        background: #fff; border: 1px solid #dde; border-radius: 10px;
        padding: 10px 12px; text-align: center;
      }
      #fetool-wrap .ft-mc .ft-ml { font-size: 0.7em; color: #999; margin-bottom: 3px; }
      #fetool-wrap .ft-mc .ft-mv { font-size: 1.5em; font-weight: 800; }
      #fetool-wrap .ft-mc .ft-mu { font-size: 0.67em; color: #bbb; }

      /* Free energy bar */
      #fetool-wrap .ft-fesec {
        background: #fff; border: 1px solid #dde; border-radius: 10px;
        padding: 14px 16px; margin-bottom: 12px;
      }
      #fetool-wrap .ft-fesec h3 { font-size: 0.95em; color: #222; margin-bottom: 8px; }
      #fetool-wrap .ft-fesec p { font-size: 0.82em; color: #555; line-height: 1.65; margin-bottom: 10px; }
      #fetool-wrap .ft-febar-labels {
        display: flex; justify-content: space-between;
        font-size: 0.73em; color: #aaa; margin-bottom: 4px;
      }
      #fetool-wrap .ft-febar-track { background: #eef; border-radius: 5px; height: 14px; overflow: hidden; }
      #fetool-wrap .ft-febar-fill {
        height: 100%; border-radius: 5px;
        transition: width 0.35s ease, background-color 0.35s ease;
      }

      /* Concepts */
      #fetool-wrap .ft-concepts {
        display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;
      }
      @media(max-width:560px){ #fetool-wrap .ft-concepts { grid-template-columns: 1fr; } }
      #fetool-wrap .ft-concept-card {
        background: #fff; border: 1px solid #dde; border-radius: 10px;
        padding: 12px 14px; font-size: 0.81em; color: #444; line-height: 1.6;
      }
      #fetool-wrap .ft-concept-card h4 { font-size: 0.9em; color: #222; margin-bottom: 5px; }
      #fetool-wrap .ft-concept-card .ft-tag {
        display: inline-block; font-size: 0.72em; padding: 2px 7px;
        border-radius: 10px; margin-bottom: 6px; font-weight: 700;
      }

      /* Formulas */
      #fetool-wrap .ft-formula-sec {
        background: #fff; border: 1px solid #dde; border-radius: 10px; padding: 14px 16px;
      }
      #fetool-wrap .ft-formula-sec h3 { font-size: 0.95em; color: #222; margin-bottom: 10px; }
      #fetool-wrap #fetool-formula-box {
        font-size: 0.8em; color: #444; line-height: 2;
        background: #f4f6ff; border-radius: 7px; padding: 12px 14px;
        font-family: "SFMono-Regular", Consolas, monospace;
      }
      #fetool-wrap #fetool-formula-box b { color: #2c3e8a; }
    </style>

    <h2>Free Energy — Interaktives Lernwerkzeug</h2>
    <div class="ft-intro">
      <strong>Szenario: Du übst Dart zu spielen.</strong>
      Du hast eine innere Erwartung, wo dein Pfeil landet — dein <strong>mentales Modell</strong> (Prior).
      Nach dem Wurf siehst du, wo der Pfeil tatsächlich trifft — das ist deine <strong>Beobachtung</strong>.
      Dein Gehirn hat jetzt zwei Möglichkeiten, den Widerspruch zu lösen:
      Es kann dein Modell aktualisieren (<em>Lernen / Wahrnehmung</em>), oder es kann deinen Wurfstil korrigieren (<em>Handeln</em>).
      Beides senkt die <strong>Free Energy</strong> — ein Maß für die Überraschung deines Gehirns.
    </div>

    <!-- Main: Canvas + Sliders side by side -->
    <div class="ft-main">
      <div class="ft-canvas-box">
        <canvas id="fetool-canvas"></canvas>
        <div class="ft-legend">
          <span><span class="ft-ld" style="background:#5b6af5"></span> Prior (Erwartung)</span>
          <span><span class="ft-ld" style="background:#27ae60"></span> Likelihood (Treffer)</span>
          <span><span class="ft-ld" style="background:#e84040"></span> Posterior (aktualisierte Schätzung)</span>
        </div>
      </div>

      <div class="ft-sliders">
        <h4>Regler</h4>

        <div class="ft-cg">
          <div class="ft-cg-label">Erwarteter Treffer <em id="fetool-lbl-pm">5.0</em></div>
          <div class="ft-cg-desc">Wo erwartest du, zu treffen? (Prior-Mittelwert μ)</div>
          <input type="range" id="fetool-sl-pm" min="0" max="10" step="0.1" value="5">
        </div>

        <hr class="ft-sep">

        <div class="ft-cg">
          <div class="ft-cg-label">Unsicherheit im Modell <em id="fetool-lbl-ps">1.8</em></div>
          <div class="ft-cg-desc">Wie sicher bist du in deiner Erwartung? (σ<sub>prior</sub>)</div>
          <input type="range" id="fetool-sl-ps" min="0.3" max="3.5" step="0.1" value="1.8">
        </div>

        <hr class="ft-sep">

        <div class="ft-cg">
          <div class="ft-cg-label">Beobachteter Treffer <em id="fetool-lbl-ob">7.2</em></div>
          <div class="ft-cg-desc">Wo landet der Pfeil tatsächlich? (Beobachtung)</div>
          <input type="range" id="fetool-sl-ob" min="0" max="10" step="0.1" value="7.2">
        </div>

        <hr class="ft-sep">

        <div class="ft-cg">
          <div class="ft-cg-label">Sensorunsicherheit <em id="fetool-lbl-ss">1.0</em></div>
          <div class="ft-cg-desc">Wie präzise ist dein Blick? (σ<sub>sensor</sub>)</div>
          <input type="range" id="fetool-sl-ss" min="0.3" max="3.5" step="0.1" value="1">
        </div>
      </div>
    </div>

    <!-- Buttons row -->
    <div class="ft-actions">
      <h4>Wie reagiert dein Gehirn?</h4>
      <div class="ft-action-grid">
        <div class="ft-action-card" style="border-color:#c0c8ff;">
          <strong style="color:#5b6af5">Wahrnehmen / Lernen</strong>
          Du aktualisierst dein mentales Modell: "Aha, ich werfe offenbar weiter rechts als ich dachte."
          Der Prior verschiebt sich zur Beobachtung. Das ist <em>Lernen</em>.
        </div>
        <div class="ft-action-card" style="border-color:#f5c0a0;">
          <strong style="color:#e87040">Handeln / Korrigieren</strong>
          Du passt deinen Wurfstil aktiv an: Du zielst weiter links, um den Treffer deiner Erwartung anzupassen.
          Das ist <em>aktive Inferenz</em>.
        </div>
      </div>
      <div class="ft-btn-row">
        <button class="ft-bp" id="fetool-btn-p">Lernen (Prior anpassen)</button>
        <button class="ft-ba" id="fetool-btn-a">Handeln (Wurf korrigieren)</button>
        <button class="ft-br" id="fetool-btn-r">Zurücksetzen</button>
      </div>
      <div class="ft-log" id="fetool-log">Stelle die Regler ein oder klicke einen Button.</div>
    </div>

    <!-- Metrics -->
    <div class="ft-metrics">
      <div class="ft-mc">
        <div class="ft-ml">Posterior-Schätzung</div>
        <div class="ft-mv" id="fetool-m-post" style="color:#e84040">–</div>
        <div class="ft-mu">aktualisierter Mittelwert</div>
      </div>
      <div class="ft-mc">
        <div class="ft-ml">Vorhersagefehler (PE)</div>
        <div class="ft-mv" id="fetool-m-err">–</div>
        <div class="ft-mu">|Prior − Beobachtung|</div>
      </div>
      <div class="ft-mc">
        <div class="ft-ml">Free Energy F</div>
        <div class="ft-mv" id="fetool-m-fe">–</div>
        <div class="ft-mu">Überraschung (nats)</div>
      </div>
    </div>

    <!-- Free Energy explanation -->
    <div class="ft-fesec">
      <h3>Free Energy — das Maß für Überraschung</h3>
      <p>
        Free Energy (<em>F</em>) misst, wie stark das innere Modell von der Realität abweicht.
        Sie ist groß, wenn Prior und Beobachtung weit auseinanderliegen, und klein, wenn sie übereinstimmen.
        <strong>Das Gehirn minimiert Free Energy ständig</strong> — entweder durch Lernen (Modell anpassen)
        oder durch Handeln (Welt anpassen). Beide Strategien führen zum selben Ziel: weniger Überraschung.
      </p>
      <p>
        Der <strong>Posterior</strong> ist dabei der "beste Kompromiss": Er gewichtet Prior und Beobachtung
        nach ihrer jeweiligen Präzision. Ein unsicherer Prior → Beobachtung gewinnt mehr Einfluss.
        Ein unsicherer Sensor → Prior dominiert.
      </p>
      <div class="ft-febar-labels">
        <span>Niedrig (Modell passt gut zur Realität)</span>
        <span>Hoch (große Überraschung)</span>
      </div>
      <div class="ft-febar-track">
        <div class="ft-febar-fill" id="fetool-fe-bar" style="width:40%;background:#5b6af5"></div>
      </div>
    </div>

    <!-- Concept cards -->
    <div class="ft-concepts">
      <div class="ft-concept-card">
        <span class="ft-tag" style="background:#eef;color:#5b6af5">Prior</span>
        <h4>Das innere Modell</h4>
        Deine Erwartung, bevor du eine Beobachtung machst. Basiert auf vergangenen Erfahrungen.
        Schmale Kurve = starke Überzeugung. Breite Kurve = viel Unsicherheit.
      </div>
      <div class="ft-concept-card">
        <span class="ft-tag" style="background:#efffef;color:#27ae60">Likelihood</span>
        <h4>Die Beobachtung</h4>
        Was deine Sinne melden. Auch die Sinne haben Rauschen (Sensorunsicherheit).
        Das Gehirn gewichtet sie daher nach ihrer Zuverlässigkeit.
      </div>
      <div class="ft-concept-card">
        <span class="ft-tag" style="background:#fff0f0;color:#e84040">Posterior</span>
        <h4>Die aktualisierte Schätzung</h4>
        Präzisionsgewichteter Kompromiss aus Prior und Beobachtung.
        Je präziser der Sensor, desto mehr zieht der Posterior zur Beobachtung hin.
      </div>
      <div class="ft-concept-card">
        <span class="ft-tag" style="background:#fff4ee;color:#e87040">Vorhersagefehler</span>
        <h4>Prediction Error</h4>
        Die Differenz zwischen Erwartung und Beobachtung. Treibt den gesamten Lernprozess.
        Große Abweichung → großer Fehler → viel Lernpotenzial.
      </div>
    </div>

    <!-- Formulas -->
    <div class="ft-formula-sec">
      <h3>Formeln mit aktuellen Werten</h3>
      <div id="fetool-formula-box">Lade…</div>
    </div>

    </div><!-- #fetool-wrap -->
    <?php
    return ob_get_clean();
}
add_shortcode( 'free_energy_tool', 'fet_shortcode' );
