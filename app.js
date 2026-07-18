const els = {
  form: document.getElementById("calc-form"),
  current: document.getElementById("current"),
  target: document.getElementById("target"),
  capacity: document.getElementById("capacity"),
  speed: document.getElementById("speed"),
  rate: document.getElementById("rate"),
  efficiency: document.getElementById("efficiency"),
  error: document.getElementById("form-error"),
  results: document.getElementById("results"),
  sessionSummary: document.getElementById("session-summary"),
  fillCurrent: document.getElementById("fill-current"),
  fillGain: document.getElementById("fill-gain"),
  labelCurrent: document.getElementById("label-current"),
  labelGain: document.getElementById("label-gain"),
  labelTarget: document.getElementById("label-target"),
  outDuration: document.getElementById("out-duration"),
  outFinish: document.getElementById("out-finish"),
  outCost: document.getElementById("out-cost"),
  outCostDetail: document.getElementById("out-cost-detail"),
  outEnergy: document.getElementById("out-energy"),
  outEnergyDetail: document.getElementById("out-energy-detail"),
  outPctRate: document.getElementById("out-pct-rate"),
  outCostPerPct: document.getElementById("out-cost-per-pct"),
  outRange: document.getElementById("out-range"),
  outCostPerMi: document.getElementById("out-cost-per-mi"),
  outTen: document.getElementById("out-ten"),
  outOvernight: document.getElementById("out-overnight"),
};

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const moneyExact = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

function readNumber(input) {
  const value = Number.parseFloat(input.value);
  return Number.isFinite(value) ? value : NaN;
}

function formatDuration(hours) {
  if (!Number.isFinite(hours) || hours < 0) return "—";
  if (hours === 0) return "0m";

  const totalMinutes = Math.round(hours * 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const remAfterDays = totalMinutes % (60 * 24);
  const h = Math.floor(remAfterDays / 60);
  const m = remAfterDays % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (h) parts.push(`${h}h`);
  if (m || parts.length === 0) parts.push(`${m}m`);
  return parts.join(" ");
}

function formatFinishTime(hours) {
  if (!Number.isFinite(hours) || hours < 0) return "—";
  const end = new Date(Date.now() + hours * 3_600_000);
  const time = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const sameDay = end.toDateString() === new Date().toDateString();
  if (sameDay) return `Done around ${time} if you start now`;
  const day = end.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `Done ${day} around ${time} if you start now`;
}

function clampPct(value) {
  return Math.min(100, Math.max(0, value));
}

function compute() {
  const current = readNumber(els.current);
  const target = readNumber(els.target);
  const capacity = readNumber(els.capacity);
  const speed = readNumber(els.speed);
  const rate = readNumber(els.rate);
  const efficiency = readNumber(els.efficiency);

  const errors = [];
  if (!Number.isFinite(current) || current < 0 || current > 100) {
    errors.push("Current % must be between 0 and 100.");
  }
  if (!Number.isFinite(target) || target < 0 || target > 100) {
    errors.push("Target % must be between 0 and 100.");
  }
  if (Number.isFinite(current) && Number.isFinite(target) && target < current) {
    errors.push("Target % should be greater than or equal to current %.");
  }
  if (!Number.isFinite(capacity) || capacity <= 0) {
    errors.push("Battery capacity must be greater than 0.");
  }
  if (!Number.isFinite(speed) || speed <= 0) {
    errors.push("Charge speed must be greater than 0.");
  }
  if (!Number.isFinite(rate) || rate < 0) {
    errors.push("Energy cost cannot be negative.");
  }

  if (errors.length) {
    els.error.hidden = false;
    els.error.textContent = errors[0];
    els.results.classList.add("is-invalid");
    return;
  }

  els.error.hidden = true;
  els.error.textContent = "";
  els.results.classList.remove("is-invalid");

  const pctGain = target - current;
  const energyKWh = (pctGain / 100) * capacity;
  const durationHours = speed > 0 ? energyKWh / speed : Infinity;
  const sessionCost = energyKWh * rate;
  const pctPerHour = speed > 0 ? (speed / capacity) * 100 : 0;
  const costPerPct = pctGain > 0 ? sessionCost / pctGain : 0;
  const hoursForTen = pctPerHour > 0 ? 10 / pctPerHour : Infinity;
  const hasEfficiency = Number.isFinite(efficiency) && efficiency > 0;
  const rangeAdded = hasEfficiency ? energyKWh * efficiency : null;
  const costPerMi =
    hasEfficiency && rangeAdded > 0 ? sessionCost / rangeAdded : null;

  const overnightWindowHours = 8;
  let overnightText = "—";
  if (Number.isFinite(durationHours)) {
    if (durationHours <= overnightWindowHours) {
      overnightText = `Yes · fits ${overnightWindowHours}h`;
    } else {
      const leftover = durationHours - overnightWindowHours;
      overnightText = `Short by ${formatDuration(leftover)}`;
    }
  }

  els.sessionSummary.textContent = `Filling from ${formatPct(current)} to ${formatPct(target)} on a ${formatNumber(capacity, 1)} kWh pack.`;

  const currentWidth = clampPct(current);
  const targetWidth = clampPct(target);
  els.fillCurrent.style.width = `${currentWidth}%`;
  els.fillGain.style.width = `${targetWidth}%`;
  els.labelCurrent.textContent = formatPct(current);
  els.labelGain.textContent = `+${formatNumber(pctGain, 0)}%`;
  els.labelTarget.textContent = formatPct(target);

  els.outDuration.textContent = formatDuration(durationHours);
  els.outFinish.textContent = formatFinishTime(durationHours);
  els.outCost.textContent = money.format(sessionCost);
  els.outCostDetail.textContent = `at ${moneyExact.format(rate)} / kWh`;
  els.outEnergy.textContent = `${formatNumber(energyKWh, 1)} kWh`;
  els.outEnergyDetail.textContent =
    pctGain === 1
      ? "1 percentage point"
      : `${formatNumber(pctGain, 0)} percentage points`;

  els.outPctRate.textContent = `${formatNumber(pctPerHour, 1)}%/h`;
  els.outCostPerPct.textContent = moneyExact.format(costPerPct);
  els.outRange.textContent = hasEfficiency
    ? `${formatNumber(rangeAdded, 0)} mi`
    : "Add efficiency";
  els.outCostPerMi.textContent =
    costPerMi != null ? moneyExact.format(costPerMi) : "—";
  els.outTen.textContent = formatDuration(hoursForTen);
  els.outOvernight.textContent = overnightText;
}

function formatPct(value) {
  return `${formatNumber(value, Number.isInteger(value) ? 0 : 1)}%`;
}

function formatNumber(value, digits = 1) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(digits, 1),
  }).format(value);
}

function syncSpeedChips() {
  const speed = readNumber(els.speed);
  document.querySelectorAll(".chip[data-speed]").forEach((chip) => {
    const chipSpeed = Number.parseFloat(chip.dataset.speed);
    chip.classList.toggle(
      "is-active",
      Number.isFinite(speed) && Math.abs(speed - chipSpeed) < 0.001,
    );
  });
}

els.form.addEventListener("input", () => {
  syncSpeedChips();
  compute();
});

document.querySelectorAll(".chip[data-speed]").forEach((chip) => {
  chip.addEventListener("click", () => {
    els.speed.value = chip.dataset.speed;
    syncSpeedChips();
    compute();
    els.speed.focus({ preventScroll: true });
  });
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  compute();
});

syncSpeedChips();
compute();
