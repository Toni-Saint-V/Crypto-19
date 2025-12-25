"use strict";

async function loadSnapshot() {
  const el = document.getElementById("snapshot-raw");
  if (!el) {
    console.warn("[CBP] snapshot-raw element not found");
    return;
  }

  try {
    const res = await fetch("/api/dashboard/snapshot", { cache: "no-store" });
    if (!res.ok) {
      el.textContent = "[CBP] snapshot HTTP " + res.status;
      return;
    }
    const data = await res.json();
    el.textContent = JSON.stringify(data, null, 2);
    console.log("[CBP] Snapshot loaded", data);
  } catch (err) {
    console.error("[CBP] Failed to load snapshot", err);
    el.textContent = "[CBP] ошибка загрузки snapshot: " + String(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSnapshot();
});

// чтобы файл оставался ES-модулем
export {};
