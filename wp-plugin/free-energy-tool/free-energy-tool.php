<?php
/**
 * Plugin Name: Free Energy Tool
 * Description: Interaktives Lernwerkzeug zum Free Energy Principle. Einbinden mit Shortcode [free_energy_tool]
 * Version: 1.0
 * Author: alphakaefer
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function fet_enqueue( $hook ) {
    // Nur laden wenn der Shortcode auf der Seite vorkommt
    global $post;
    if ( is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'free_energy_tool' ) ) {
        wp_enqueue_script(
            'free-energy-tool',
            plugin_dir_url( __FILE__ ) . 'free-energy-tool.js',
            array(),
            '1.0',
            true // Im Footer laden
        );
    }
}
add_action( 'wp_enqueue_scripts', 'fet_enqueue' );

function fet_shortcode( $atts ) {
    ob_start();
    ?>
    <div id="fetool-wrap">
      <style>
        #fetool-wrap * { box-sizing: border-box; }
        #fetool-wrap {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          max-width: 780px; margin: 0 auto; color: #1a1a2e;
          background: #f8f9ff; border-radius: 12px; padding: 24px;
        }
        #fetool-wrap h2 { font-size: 1.35em; margin: 0 0 4px 0; }
        #fetool-wrap .ft-sub { font-size: 0.88em; color: #666; margin: 0 0 18px 0; line-height: 1.5; }
        #fetool-wrap .ft-canvas-wrap {
          background: #fff; border: 1px solid #dde;
          border-radius: 8px; padding: 12px 12px 8px; margin-bottom: 18px;
        }
        #fetool-wrap .ft-canvas-wrap canvas { display: block; width: 100%; }
        #fetool-wrap .ft-legend {
          display: flex; gap: 14px; margin-top: 8px; flex-wrap: wrap; font-size: 0.78em; color: #555;
        }
        #fetool-wrap .ft-legend span { display: flex; align-items: center; gap: 5px; }
        #fetool-wrap .ft-ld { display: inline-block; width: 24px; height: 3px; border-radius: 2px; }
        #fetool-wrap .ft-controls {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px 22px; margin-bottom: 18px;
        }
        @media(max-width:500px){ #fetool-wrap .ft-controls{ grid-template-columns: 1fr; } }
        #fetool-wrap .ft-cg label {
          display: flex; justify-content: space-between;
          font-size: 0.83em; font-weight: 600; margin-bottom: 3px; color: #333;
        }
        #fetool-wrap .ft-cg label em { font-style: normal; font-weight: 400; color: #666; }
        #fetool-wrap input[type=range] { width: 100%; accent-color: #5b6af5; cursor: pointer; }
        #fetool-wrap .ft-metrics {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px;
        }
        @media(max-width:480px){ #fetool-wrap .ft-metrics{ grid-template-columns: 1fr 1fr; } }
        #fetool-wrap .ft-mc {
          background: #fff; border: 1px solid #dde; border-radius: 8px; padding: 10px 12px; text-align: center;
        }
        #fetool-wrap .ft-mc .ft-ml { font-size: 0.72em; color: #888; margin-bottom: 3px; }
        #fetool-wrap .ft-mc .ft-mv { font-size: 1.45em; font-weight: 700; }
        #fetool-wrap .ft-mc .ft-mu { font-size: 0.68em; color: #aaa; }
        #fetool-wrap .ft-sec {
          background: #fff; border: 1px solid #dde; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px;
        }
        #fetool-wrap .ft-sec h3 { font-size: 0.95em; margin: 0 0 8px 0; color: #222; }
        #fetool-wrap .ft-sec p { font-size: 0.83em; color: #555; margin: 0 0 10px 0; line-height: 1.6; }
        #fetool-wrap .ft-btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
        #fetool-wrap button {
          padding: 8px 16px; border: none; border-radius: 6px;
          font-size: 0.85em; font-weight: 600; cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
        }
        #fetool-wrap button:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
        #fetool-wrap button:active { transform: scale(0.97); }
        #fetool-wrap .ft-bp { background: #5b6af5; color: #fff; }
        #fetool-wrap .ft-ba { background: #e87040; color: #fff; }
        #fetool-wrap .ft-br { background: #eee; color: #555; }
        #fetool-wrap .ft-log {
          margin-top: 9px; font-size: 0.81em; color: #555; min-height: 18px; font-style: italic;
        }
        #fetool-wrap .ft-febar-wrap { margin-top: 10px; }
        #fetool-wrap .ft-febar-labels {
          display: flex; justify-content: space-between; font-size: 0.75em; color: #888; margin-bottom: 3px;
        }
        #fetool-wrap .ft-febar-track { background: #eef; border-radius: 4px; height: 13px; overflow: hidden; }
        #fetool-wrap .ft-febar-fill {
          height: 100%; border-radius: 4px;
          transition: width 0.35s ease, background-color 0.35s ease;
        }
      </style>

      <h2>Free Energy — Interaktives Lernwerkzeug</h2>
      <p class="ft-sub">
        <strong>Szenario: Ein Torwart muss einen Elfmeter halten.</strong><br>
        Er hat eine Erwartung (Prior), wohin der Ball geschossen wird. Der Sensor (seine Augen) liefert eine Beobachtung.
        Wie aktualisiert das Gehirn seine Schätzung, und wie minimiert es Free Energy?
      </p>

      <div class="ft-canvas-wrap">
        <canvas id="fetool-canvas"></canvas>
        <div class="ft-legend">
          <span><span class="ft-ld" style="background:#5b6af5"></span> Prior (Erwartung des Torwarts)</span>
          <span><span class="ft-ld" style="background:#27ae60"></span> Likelihood (Sensor: Blickrichtung Ball)</span>
          <span><span class="ft-ld" style="background:#e84040"></span> Posterior (aktualisierte Schätzung)</span>
        </div>
      </div>

      <div class="ft-controls">
        <div class="ft-cg">
          <label>Erwartete Ballposition <em id="fetool-lbl-pm">5.0 m</em></label>
          <input type="range" id="fetool-sl-pm" min="0" max="10" step="0.1" value="5">
        </div>
        <div class="ft-cg">
          <label>Unsicherheit der Erwartung <em id="fetool-lbl-ps">1.5 m</em></label>
          <input type="range" id="fetool-sl-ps" min="0.3" max="3.5" step="0.1" value="1.5">
        </div>
        <div class="ft-cg">
          <label>Beobachtete Ballposition <em id="fetool-lbl-ob">7.5 m</em></label>
          <input type="range" id="fetool-sl-ob" min="0" max="10" step="0.1" value="7.5">
        </div>
        <div class="ft-cg">
          <label>Sensorunsicherheit (Sicht) <em id="fetool-lbl-ss">1.0 m</em></label>
          <input type="range" id="fetool-sl-ss" min="0.3" max="3.5" step="0.1" value="1">
        </div>
      </div>

      <div class="ft-metrics">
        <div class="ft-mc">
          <div class="ft-ml">Posterior-Schätzung</div>
          <div class="ft-mv" id="fetool-m-post" style="color:#e84040">–</div>
          <div class="ft-mu">Meter</div>
        </div>
        <div class="ft-mc">
          <div class="ft-ml">Vorhersagefehler</div>
          <div class="ft-mv" id="fetool-m-err">–</div>
          <div class="ft-mu">Meter Abweichung</div>
        </div>
        <div class="ft-mc">
          <div class="ft-ml">Free Energy</div>
          <div class="ft-mv" id="fetool-m-fe" style="color:#5b6af5">–</div>
          <div class="ft-mu">relativ (nats)</div>
        </div>
      </div>

      <div class="ft-sec">
        <h3>Was ist Free Energy?</h3>
        <p>
          Free Energy misst, wie stark das innere Modell des Torwarts von der Realität abweicht — also wie <strong>überrascht</strong> er ist.
          Großer Vorhersagefehler = hohe Free Energy. Das Gehirn will diese Größe ständig minimieren.
        </p>
        <div class="ft-febar-wrap">
          <div class="ft-febar-labels"><span>Niedrig (kein Konflikt)</span><span>Hoch (große Überraschung)</span></div>
          <div class="ft-febar-track"><div class="ft-febar-fill" id="fetool-fe-bar" style="width:40%;background:#5b6af5"></div></div>
        </div>
      </div>

      <div class="ft-sec">
        <h3>Wahrnehmung vs. Aktion — zwei Wege zur Minimierung</h3>
        <p>
          <strong>Wahrnehmen:</strong> Der Torwart aktualisiert seine Überzeugung — er akzeptiert, dass der Ball doch rechts geht.<br>
          <strong>Handeln:</strong> Er bewegt sich in die erwartete Richtung und versucht, die Welt seiner Erwartung anzupassen.
        </p>
        <div class="ft-btn-row">
          <button class="ft-bp" id="fetool-btn-p">Wahrnehmen (Überzeugung anpassen)</button>
          <button class="ft-ba" id="fetool-btn-a">Handeln (Position anpassen)</button>
          <button class="ft-br" id="fetool-btn-r">Zurücksetzen</button>
        </div>
        <div class="ft-log" id="fetool-log">Stelle die Regler ein oder klicke einen Button.</div>
      </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'free_energy_tool', 'fet_shortcode' );
