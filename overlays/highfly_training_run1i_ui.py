from pathlib import Path

css = Path("src/styles/shell.css")
text = css.read_text(encoding="utf-8")

append = r"""

/* ==========================================================================
   HIGHFLY TRAINING RUN1-I — SYSTEM UX / ROUTINE AUTHORITY
   ========================================================================== */

#highfly-training-window {
  background:
    linear-gradient(180deg, rgba(5, 10, 20, .985), rgba(3, 8, 17, .99)) !important;
  border: 1px solid rgba(86, 224, 255, .62) !important;
  border-radius: 8px !important;
  box-shadow:
    0 0 0 1px rgba(86, 224, 255, .12) inset,
    0 0 34px rgba(0, 174, 255, .18),
    0 28px 80px rgba(0, 0, 0, .58) !important;
  color: #eaf7ff;
}

#highfly-training-window .window-titlebar {
  min-height: 56px;
  padding: 0 18px !important;
  border-bottom: 1px solid rgba(86, 224, 255, .25) !important;
  background:
    linear-gradient(90deg, rgba(9, 23, 39, .98), rgba(7, 15, 28, .98)) !important;
}

#highfly-training-window .window-titlebar h2,
#highfly-training-window .window-title,
#highfly-training-window > header h2 {
  color: #dff9ff !important;
  letter-spacing: .11em;
  text-shadow: 0 0 16px rgba(86, 224, 255, .22);
}

#highfly-training-window #highfly-training-close {
  border: 1px solid rgba(86, 224, 255, .22) !important;
  background: rgba(10, 22, 36, .92) !important;
  color: #dff9ff !important;
}

#highfly-training-window .highfly-training-shell {
  display: grid !important;
  gap: 18px !important;
  max-height: none !important;
  height: calc(100% - 58px) !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  box-sizing: border-box !important;
  padding: 18px 22px 38px !important;
  scrollbar-color: rgba(86, 224, 255, .62) rgba(255,255,255,.03);
}

#highfly-training-window .hf-training-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  padding: 4px 2px 2px;
}

#highfly-training-window .hf-eyebrow,
#highfly-training-window .hf-exercise-code {
  color: #69dcff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .16em;
}

#highfly-training-window .hf-training-header h3 {
  margin: 4px 0 2px;
  color: #f5fbff;
  font-size: clamp(22px, 2.4vw, 34px);
  letter-spacing: .04em;
}

#highfly-training-window .hf-training-header p {
  margin: 0;
  color: rgba(222, 242, 255, .62);
  font-size: 12px;
}

#highfly-training-window .hf-training-controls {
  display: flex;
  align-items: end;
  gap: 12px;
}

#highfly-training-window label {
  color: rgba(226, 243, 255, .82);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .04em;
}

#highfly-training-window input,
#highfly-training-window select,
#highfly-training-window button {
  font: inherit;
  -webkit-tap-highlight-color: transparent;
}

#highfly-training-window input[type="number"],
#highfly-training-window select {
  min-height: 40px;
  box-sizing: border-box;
  border: 1px solid rgba(86, 224, 255, .22) !important;
  border-radius: 7px !important;
  outline: none;
  background:
    linear-gradient(180deg, rgba(11, 27, 43, .97), rgba(7, 17, 29, .97)) !important;
  color: #eaf9ff !important;
  box-shadow: 0 0 0 1px rgba(255,255,255,.015) inset;
}

#highfly-training-window input[type="number"]:focus,
#highfly-training-window select:focus {
  border-color: rgba(86, 224, 255, .68) !important;
  box-shadow: 0 0 18px rgba(0, 196, 255, .12);
}

#highfly-training-window input[type="range"] {
  accent-color: #5de0ff;
}

#highfly-training-window .hf-cycle-status {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid rgba(86, 224, 255, .14);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(8, 20, 33, .62);
}

#highfly-training-window .hf-cycle-status > div {
  display: grid;
  gap: 4px;
  padding: 10px 13px;
  border-right: 1px solid rgba(86, 224, 255, .09);
}

#highfly-training-window .hf-cycle-status > div:last-child {
  border-right: 0;
}

#highfly-training-window .hf-cycle-status span,
#highfly-training-window .hf-prescription > span,
#highfly-training-window .hf-accessory-load > span {
  color: rgba(118, 224, 255, .70);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .13em;
}

#highfly-training-window .hf-cycle-status b {
  color: #eefbff;
  font-size: 12px;
}

#highfly-training-window .hf-system-line {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 42px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  color: #dff9ff;
  font-weight: 900;
  letter-spacing: .08em;
  text-align: left;
}

#highfly-training-window .hf-system-line b {
  color: #72e5ff;
  font-size: 10px;
}

#highfly-training-window .hf-calibration {
  border: 1px solid rgba(86, 224, 255, .16);
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgba(8, 22, 37, .80), rgba(5, 14, 26, .78));
  box-shadow: 0 0 28px rgba(0, 174, 255, .05) inset;
}

#highfly-training-window .hf-calibration-body {
  display: none;
  gap: 12px;
  padding: 0 14px 14px;
}

#highfly-training-window .hf-calibration.is-open .hf-calibration-body {
  display: grid;
}

#highfly-training-window .hf-calibration-body p {
  margin: 0;
  color: rgba(224, 242, 255, .72);
  font-size: 12px;
  line-height: 1.45;
}

#highfly-training-window .hf-rm-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(130px, 1fr));
  gap: 9px;
}

#highfly-training-window .hf-rm-field {
  display: grid;
  gap: 6px;
}

#highfly-training-window .hf-rm-input-wrap {
  display: grid;
  gap: 3px;
}

#highfly-training-window .hf-rm-field input {
  width: 100%;
  padding: 0 10px;
}

#highfly-training-window .hf-rm-field small {
  color: rgba(197, 232, 246, .55);
  font-size: 10px;
}

#highfly-training-window .hf-primary-action {
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid rgba(86, 224, 255, .52) !important;
  border-radius: 7px;
  background:
    linear-gradient(180deg, rgba(20, 99, 132, .80), rgba(8, 52, 78, .92)) !important;
  color: #effcff !important;
  font-weight: 900 !important;
  letter-spacing: .075em;
  box-shadow:
    0 0 0 1px rgba(144, 238, 255, .06) inset,
    0 0 18px rgba(0, 184, 255, .10);
}

#highfly-training-window .hf-primary-action:active {
  transform: translateY(1px);
}

#highfly-training-window .hf-section-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 9px;
  border-bottom: 1px solid rgba(86, 224, 255, .10);
  padding-bottom: 7px;
}

#highfly-training-window .hf-section-title h4 {
  margin: 0;
  color: #f0fbff;
  font-size: 15px;
  letter-spacing: .08em;
}

#highfly-training-window .hf-section-title span {
  color: rgba(214, 238, 250, .52);
  font-size: 11px;
}

#highfly-training-window .hf-core-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(100px, 1fr));
  gap: 8px;
}

#highfly-training-window .hf-core-card {
  min-height: 112px;
  padding: 10px;
  border: 1px solid rgba(86, 224, 255, .13);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(8, 22, 36, .76), rgba(4, 12, 23, .84));
}

#highfly-training-window .hf-core-card__top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

#highfly-training-window .hf-core-card__top strong {
  color: #f2fbff;
  font-size: 16px;
}

#highfly-training-window .hf-core-current {
  margin: 6px 0;
  color: #73e6ff;
  font-size: 24px;
  font-weight: 950;
  text-shadow: 0 0 16px rgba(86, 224, 255, .18);
}

#highfly-training-window .hf-core-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 7px;
  color: rgba(218, 239, 250, .58);
  font-size: 10px;
}

#highfly-training-window .hf-core-badge,
#highfly-training-window .hf-intent {
  padding: 5px 7px;
  border: 1px solid rgba(86, 224, 255, .10);
  border-radius: 999px;
  background: rgba(86, 224, 255, .055);
  color: rgba(221, 247, 255, .70);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .06em;
}

#highfly-training-window .hf-core-badge.is-ready {
  border-color: rgba(81, 236, 169, .18);
  background: rgba(81, 236, 169, .07);
  color: #9ef5ca;
}

#highfly-training-window .hf-tp-wallet {
  color: #9ef5ca !important;
  font-weight: 850;
  letter-spacing: .05em;
}

#highfly-training-window .hf-core-source {
  display: grid;
  gap: 2px;
  margin: 7px 0 8px;
  padding: 7px;
  border-radius: 6px;
  background: rgba(86, 224, 255, .035);
  color: rgba(218, 239, 250, .60);
  font-size: 9px;
}

#highfly-training-window .hf-core-source span {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

#highfly-training-window .hf-core-source b {
  color: #dff9ff;
}

#highfly-training-window .hf-core-allocate {
  width: 100%;
  min-height: 32px;
  margin-top: 8px;
  border: 1px solid rgba(81, 236, 169, .30);
  border-radius: 6px;
  background: rgba(32, 103, 74, .24);
  color: #b8ffda;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .05em;
}

#highfly-training-window .hf-core-allocate:disabled {
  opacity: .38;
  border-color: rgba(255,255,255,.09);
  background: rgba(255,255,255,.025);
  color: rgba(218,239,250,.55);
}

#highfly-training-window .hf-training-days {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 7px;
  margin-bottom: 10px;
}

#highfly-training-window .hf-training-day {
  min-height: 54px;
  display: grid;
  align-content: center;
  gap: 2px;
  border: 1px solid rgba(86, 224, 255, .11);
  border-radius: 7px;
  background: rgba(7, 18, 31, .68);
  color: rgba(224, 242, 252, .64);
}

#highfly-training-window .hf-training-day span {
  color: rgba(92, 218, 255, .57);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .14em;
}

#highfly-training-window .hf-training-day b {
  font-size: 13px;
}

#highfly-training-window .hf-training-day.is-selected {
  border-color: rgba(86, 224, 255, .54);
  background:
    linear-gradient(180deg, rgba(14, 54, 76, .78), rgba(7, 28, 45, .82));
  color: #effcff;
  box-shadow: 0 0 18px rgba(0, 181, 255, .08);
}

#highfly-training-window .hf-exercise-list {
  display: grid;
  gap: 9px;
}

#highfly-training-window .hf-exercise {
  display: grid;
  gap: 10px;
  padding: 12px 13px;
  border: 1px solid rgba(86, 224, 255, .11);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(6, 17, 29, .88), rgba(4, 12, 22, .91));
}

#highfly-training-window .hf-exercise.is-blocked {
  border-color: rgba(255, 196, 86, .17);
}

#highfly-training-window .hf-exercise__head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
}

#highfly-training-window .hf-exercise__head > div {
  display: grid;
  gap: 2px;
}

#highfly-training-window .hf-exercise__head strong {
  color: #f2fbff;
  font-size: 18px;
}

#highfly-training-window .hf-exercise__head small {
  color: rgba(215, 237, 249, .57);
  font-size: 11px;
}

#highfly-training-window .hf-exercise-system {
  display: grid;
  grid-template-columns: 1.35fr .8fr minmax(150px, .85fr);
  gap: 8px;
}

#highfly-training-window .hf-prescription,
#highfly-training-window .hf-accessory-load,
#highfly-training-window .hf-lock-chip {
  min-height: 62px;
  box-sizing: border-box;
  display: grid;
  align-content: center;
  gap: 3px;
  padding: 8px 10px;
  border: 1px solid rgba(86, 224, 255, .08);
  border-radius: 7px;
  background: rgba(255,255,255,.018);
}

#highfly-training-window .hf-prescription b {
  color: #edfaff;
  font-size: 15px;
}

#highfly-training-window .hf-prescription small {
  color: rgba(211, 236, 247, .50);
  font-size: 10px;
}

#highfly-training-window .hf-accessory-load input {
  width: 100%;
  min-height: 36px;
  padding: 0 9px;
}

#highfly-training-window .hf-lock-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: rgba(192, 228, 242, .48);
  font-size: 9px;
  letter-spacing: .06em;
}

#highfly-training-window .hf-rest-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

#highfly-training-window .hf-rest-actions button {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(86, 224, 255, .18);
  border-radius: 6px;
  background: rgba(10, 30, 46, .72);
  color: #dcf7ff;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .055em;
}

#highfly-training-window .hf-rest-actions button:disabled {
  opacity: .40;
}

#highfly-training-window .hf-rest-actions small,
#highfly-training-window .hf-training-actions small {
  color: rgba(209, 232, 244, .45);
  font-size: 10px;
}

#highfly-training-window .hf-training-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

#highfly-training-window .hf-training-result {
  min-height: 78px;
  padding: 12px;
  border: 1px solid rgba(86, 224, 255, .10);
  border-radius: 8px;
  background: rgba(5, 14, 25, .75);
}

#highfly-training-window .hf-training-result__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

#highfly-training-window .hf-training-result__grid > div {
  display: grid;
  gap: 3px;
  padding: 7px;
  border-radius: 6px;
  background: rgba(86, 224, 255, .035);
  text-align: center;
}

#highfly-training-window .hf-training-result__grid span {
  color: rgba(158, 229, 250, .59);
  font-size: 9px;
  letter-spacing: .12em;
}

#highfly-training-window .hf-training-result__grid b {
  color: #eaffff;
  font-size: 17px;
}

#highfly-training-window .hf-training-result__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 9px;
  color: rgba(215, 237, 247, .55);
  font-size: 10px;
}

#highfly-training-window .hf-training-outcomes {
  display: grid;
  gap: 5px;
  margin-top: 9px;
}

#highfly-training-window .hf-training-outcome {
  display: grid;
  grid-template-columns: 52px 130px 1fr;
  gap: 8px;
  padding-top: 5px;
  border-top: 1px solid rgba(86,224,255,.07);
  font-size: 10px;
}

#highfly-training-window .hf-training-outcome span {
  color: #73e6ff;
  text-transform: uppercase;
}

#highfly-training-window .hf-training-outcome small {
  color: rgba(218, 238, 248, .52);
}

#highfly-training-window .hf-training-empty {
  color: rgba(218, 240, 251, .61);
  font-size: 12px;
}

#highfly-training-window .hf-rest-dock {
  position: fixed;
  left: 50%;
  bottom: 12px;
  z-index: 98;
  width: min(620px, calc(100vw - 26px));
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 7px 16px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid rgba(86, 224, 255, .55);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(7, 29, 46, .98), rgba(3, 13, 25, .99));
  box-shadow: 0 0 30px rgba(0, 187, 255, .18);
}

#highfly-training-window .hf-rest-dock[hidden] {
  display: none !important;
}

#highfly-training-window .hf-rest-dock > div:first-child {
  display: grid;
  gap: 2px;
}

#highfly-training-window .hf-rest-dock span {
  color: rgba(102, 225, 255, .65);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .16em;
}

#highfly-training-window .hf-rest-dock strong {
  color: #ecfbff;
  font-size: 13px;
}

#highfly-training-window .hf-rest-clock {
  color: #72e6ff;
  font-size: 30px;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 18px rgba(86, 224, 255, .25);
}

#highfly-training-window .hf-rest-progress {
  grid-column: 1 / -1;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,.07);
}

#highfly-training-window .hf-rest-progress i {
  display: block;
  width: 0;
  height: 100%;
  background: #64ddff;
  box-shadow: 0 0 12px rgba(86, 224, 255, .42);
}

#highfly-training-window #hf-rest-skip {
  grid-column: 1 / -1;
  min-height: 32px;
  border: 1px solid rgba(255, 153, 113, .20);
  border-radius: 6px;
  background: rgba(80, 26, 22, .24);
  color: #ffd0be;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .06em;
}

body.mobile-touch #highfly-training-window {
  position: fixed !important;
  inset: 6px !important;
  width: auto !important;
  height: auto !important;
  max-width: none !important;
  max-height: none !important;
  min-width: 0 !important;
  transform: none !important;
  z-index: 95 !important;
}

@media (min-width: 901px) {
  #highfly-training-window {
    width: min(1280px, calc(100vw - 32px)) !important;
    height: min(860px, calc(100vh - 32px)) !important;
    max-width: none !important;
    max-height: none !important;
  }
}

@media (max-width: 900px) {
  #highfly-training-window .highfly-training-shell {
    gap: 12px !important;
    padding: 12px 14px 30px !important;
  }

  #highfly-training-window .hf-training-header {
    align-items: start;
  }

  #highfly-training-window .hf-training-header h3 {
    font-size: 20px;
  }

  #highfly-training-window .hf-training-controls {
    min-width: 275px;
  }

  #highfly-training-window .hf-cycle-status {
    grid-template-columns: repeat(4, minmax(120px, 1fr));
    overflow-x: auto;
  }

  #highfly-training-window .hf-rm-grid {
    grid-template-columns: repeat(4, minmax(118px, 1fr));
    overflow-x: auto;
  }

  #highfly-training-window .hf-core-grid {
    grid-template-columns: repeat(5, minmax(108px, 1fr));
    overflow-x: auto;
  }

  #highfly-training-window .hf-training-days {
    grid-template-columns: repeat(5, minmax(105px, 1fr));
    overflow-x: auto;
  }

  #highfly-training-window .hf-exercise-system {
    grid-template-columns: 1.35fr .8fr .85fr;
  }

  #highfly-training-window .hf-exercise {
    padding: 10px 11px;
  }

  #highfly-training-window .hf-exercise__head strong {
    font-size: 15px;
  }
}
"""

css.write_text(text + append, encoding="utf-8")
print("HIGHFLY_TRAINING_RUN1I_UI_APPLIED=1")
