# ChargeSpan

A small web app that estimates EV charge **duration**, **session cost**, and **energy delivered** from your current %, target %, battery size, charger speed, and electricity rate.

## Open it

No build step. Serve the folder with any static server, or open `index.html` directly:

```bash
python3 -m http.server 4173
```

Then visit [http://localhost:4173](http://localhost:4173).

## Inputs

| Field | Meaning |
| --- | --- |
| Current % / Target % | Where you start and stop |
| Battery capacity (kWh) | Pack size used for energy math |
| Charge speed (kW) | Charger power (presets for L1 / L2 / DCFC) |
| Energy cost ($/kWh) | Rate for session cost |
| Efficiency (mi/kWh, optional) | Unlocks range added & cost per mile |

## Outputs

- Duration and estimated finish clock time
- Session cost and energy delivered (kWh)
- Charge rate (%/hour), cost per %, time to +10%
- Overnight fit check (8-hour window)
- Range added and cost per mile when efficiency is set

Assumes a constant charge rate. Real packs taper near full, especially on DC fast chargers.
