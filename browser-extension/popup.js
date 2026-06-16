document.addEventListener("DOMContentLoaded", async () => {
  const titleInput = document.getElementById("beacon-title");
  const urlInput = document.getElementById("beacon-url");
  const sectorSelect = document.getElementById("sector-select");
  const saveBtn = document.getElementById("save-btn");
  const statusDiv = document.getElementById("status");

  // Ganti dengan URL produksi saat rilis
  const API_BASE_URL = "http://localhost:3000";
  
  let pageDescription = "";
  let pageImageUrl = "";

  // 1. Fetch metadata dari tab yang aktif
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab) {
      titleInput.value = tab.title;
      urlInput.value = tab.url;

      // Extract metadata (description & image)
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const getMeta = (name) => {
            const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"], meta[name="twitter:${name.replace('og:', '')}"]`);
            return el ? el.getAttribute("content") : "";
          };
          return {
            description: getMeta("description") || getMeta("og:description") || "",
            image: getMeta("og:image") || getMeta("image") || ""
          };
        }
      }, (results) => {
        if (results && results[0] && results[0].result) {
          pageDescription = results[0].result.description || "";
          pageImageUrl = results[0].result.image || "";
        }
      });
    }
  });

  // 2. Fetch daftar sector pengguna
  try {
    const res = await fetch(`${API_BASE_URL}/api/extension/sectors`, {
      credentials: "include"
    });
    if (res.ok) {
      const data = await res.json();
      sectorSelect.innerHTML = ""; // Bersihkan loading
      if (data.sectors && data.sectors.length > 0) {
        data.sectors.forEach(s => {
          const opt = document.createElement("option");
          opt.value = s.id;
          opt.textContent = s.name;
          sectorSelect.appendChild(opt);
        });
      } else {
        sectorSelect.innerHTML = '<option value="">No sectors found</option>';
      }
    } else {
      sectorSelect.innerHTML = '<option value="">Failed to load sectors</option>';
    }
  } catch (e) {
    sectorSelect.innerHTML = '<option value="">Error loading sectors</option>';
  }

  // 3. Handle Save
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    statusDiv.textContent = "Saving to OrbStation...";
    statusDiv.style.color = "#a1a1aa";

    try {
      const response = await fetch(`${API_BASE_URL}/api/beacons/quick-save`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: titleInput.value,
          url: urlInput.value,
          sectorId: sectorSelect.value,
          description: pageDescription,
          imageUrl: pageImageUrl
        })
      });

      if (response.ok) {
        statusDiv.textContent = "Saved successfully! ✅";
        statusDiv.style.color = "#4ade80";
        setTimeout(() => window.close(), 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save");
      }
    } catch (err) {
      statusDiv.textContent = `Error: ${err.message}`;
      statusDiv.style.color = "#f87171";
      saveBtn.disabled = false;
    }
  });
});
