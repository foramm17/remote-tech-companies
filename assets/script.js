(function () {
  "use strict";

  var CSV_URL = "remoteintech.csv";
  var listEl = document.getElementById("company-list");
  var statusEl = document.getElementById("status");
  var searchEl = document.getElementById("search");
  var countEl = document.getElementById("count");

  var companies = [];

  // Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes ("")
  // and commas/newlines inside quotes.
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    var i = 0;

    while (i < text.length) {
      var c = text[i];

      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }

      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ",") { row.push(field); field = ""; i++; continue; }
      if (c === "\r") { i++; continue; }
      if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }

      field += c; i++;
    }
    // flush last field/row if file has no trailing newline
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function render(items) {
    if (!items.length) {
      listEl.innerHTML = '<li class="status">No companies match your search.</li>';
      updateCount(0);
      return;
    }

    var frag = document.createDocumentFragment();
    items.forEach(function (co) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = co.website;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      var name = document.createElement("span");
      name.className = "company-name";
      name.textContent = co.name;

      var region = document.createElement("span");
      region.className = "company-region";
      region.textContent = co.region;

      a.appendChild(name);
      a.appendChild(region);
      li.appendChild(a);
      frag.appendChild(li);
    });

    listEl.innerHTML = "";
    listEl.appendChild(frag);
    updateCount(items.length);
  }

  function updateCount(n) {
    countEl.textContent = n + (n === 1 ? " company" : " companies");
  }

  function applyFilter() {
    var q = searchEl.value.trim().toLowerCase();
    if (!q) { render(companies); return; }
    render(companies.filter(function (co) {
      return co.name.toLowerCase().indexOf(q) !== -1;
    }));
  }

  fetch(CSV_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then(function (text) {
      var rows = parseCSV(text);
      rows.shift(); // drop header

      companies = rows
        .filter(function (r) { return r[0] && r[0].trim(); })
        .map(function (r) {
          return {
            name: r[0].trim(),
            region: (r[2] || "").trim(),
            website: (r[4] || "").trim()
          };
        })
        .filter(function (co) { return co.website; });

      render(companies);
      searchEl.addEventListener("input", applyFilter);
    })
    .catch(function (err) {
      statusEl.textContent = "Could not load companies. Please try again later.";
      statusEl.className = "status";
      console.error("Failed to load CSV:", err);
    });
})();
