// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://carbon-tracer.onrender.com";

  // ================= TAB NAVIGATION =================
  window.showTab = function(tab) {
    document.getElementById('home').classList.add('hidden');
    document.getElementById('about').classList.add('hidden');
    document.getElementById(tab).classList.remove('hidden');
  };

  // ================= COLLAPSIBLE =================
  window.toggle = function(el) {
    const next = el.nextElementSibling;
    if (next) next.classList.toggle('hidden');
  };

  // ================= REPORT =================
  window.generateReport = async function() {
    if (!selectedLatLng) return;

    const { lat, lng } = selectedLatLng;

    document.getElementById("report").classList.remove("hidden");
    document.getElementById("analysis").innerText = "Generating analysis...";
    document.getElementById("recommend").innerText = "Processing recommendations...";

    try {
      const res = await fetch(
        `${API_BASE}/analyze?lat=${lat}&lng=${lng}`
      );
      const data = await res.json();

      document.getElementById("analysis").innerText = data.analysis;
      document.getElementById("recommend").innerText = data.recommendation;

      // Future images
      const imgs = document.querySelectorAll(".future-img");
      imgs[0].src = data.future.positiveImage;
      imgs[1].src = data.future.negativeImage;

    } catch (err) {
      console.error(err);
      document.getElementById("analysis").innerText = "Error fetching data.";
    }
  };

  // ================= IMAGE MODAL =================
  window.zoom = function(src) {
    const modal = document.getElementById("modal");
    modal.style.display = "flex";
    document.getElementById("modalImg").src = src;
  };

  window.closeModal = function() {
    document.getElementById("modal").style.display = "none";
  };

  // ================= ABOUT =================
  fetch(`${API_BASE}/about`)
    .then(res => res.text())
    .then(data => {
      document.getElementById("aboutText").innerText = data;
    })
    .catch(() => {
      document.getElementById("aboutText").innerText =
        "Could not load about content.";
    });

  // ================= MAP =================
  let map = null;
  let marker = null;
  window.selectedLatLng = null;

  window.openMap = function() {
    const modal = document.getElementById("mapModal");
    modal.classList.add("active");

    if (!map) {
      map = L.map("map").setView([22.5726, 88.3639], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(map);

      map.on("click", function (e) {
        selectedLatLng = e.latlng;

        if (marker) {
          marker.setLatLng(e.latlng);
        } else {
          marker = L.marker(e.latlng).addTo(map);
        }
      });
    }

    setTimeout(() => map.invalidateSize(), 200);
  };

  window.closeMap = function() {
    document.getElementById("mapModal").classList.remove("active");
  };

  // ================= CONFIRM LOCATION =================
  window.confirmLocation = async function () {
    if (!selectedLatLng) {
      alert("Please select a location.");
      return;
    }

    const { lat, lng } = selectedLatLng;

    let placeName = "Unknown Location";

    try {
      const res = await fetch(
        `${API_BASE}/reverse-geocode?lat=${lat}&lng=${lng}`
      );
      const data = await res.json();
      placeName = data.name || "Unknown Location";
    } catch (err) {
      console.error(err);
    }

    const gridX = Math.floor(lat * 10);
    const gridY = Math.floor(lng * 10);

    // ✅ THIS IS YOUR FIXED DISPLAY FLOW
    document.getElementById("locationText").innerText =
      `Selected Location: ${placeName}\nCoordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})\nGrid: (${gridX}, ${gridY})`;

    document.getElementById("proceedBtn").disabled = false;

    closeMap();
  };

  // ================= CANCEL =================
  window.cancelSelection = function() {
    if (marker && map) {
      map.removeLayer(marker);
      marker = null;
    }

    selectedLatLng = null;

    document.getElementById("locationText").innerText =
      "No location selected.";

    document.getElementById("proceedBtn").disabled = true;
  };

  // ================= SEARCH =================
  window.searchLocation = async function() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    const query = input.value;
    if (!query) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (!data.length) return;

      const { lat, lon } = data[0];

      map.setView([lat, lon], 15);

      selectedLatLng = { lat, lng: lon };

      if (marker) {
        marker.setLatLng([lat, lon]);
      } else {
        marker = L.marker([lat, lon]).addTo(map);
      }

    } catch (err) {
      console.error(err);
    }
  };

  // ================= AUTOCOMPLETE =================
  const searchInput = document.getElementById("searchInput");
  const resultsDiv = document.getElementById("searchResults");

  let debounceTimer;

  if (searchInput) {

    searchInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") searchLocation();
    });

    searchInput.addEventListener("input", function () {
      const query = this.value;

      clearTimeout(debounceTimer);

      if (query.length < 3) {
        resultsDiv.innerHTML = "";
        return;
      }

      debounceTimer = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    });
  }

  async function fetchSuggestions(query) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await res.json();

      resultsDiv.innerHTML = "";

      data.forEach(place => {
        const item = document.createElement("div");
        item.className = "search-item";
        item.innerText = place.display_name;

        item.onclick = () => selectLocation(place);

        resultsDiv.appendChild(item);
      });

    } catch (err) {
      console.error(err);
    }
  }

  function selectLocation(place) {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    map.setView([lat, lon], 15);

    selectedLatLng = { lat, lng: lon };

    if (marker) {
      marker.setLatLng([lat, lon]);
    } else {
      marker = L.marker([lat, lon]).addTo(map);
    }

    searchInput.value = place.display_name;
    resultsDiv.innerHTML = "";
  }

  document.addEventListener("click", function (e) {
    const wrapper = document.querySelector(".search-wrapper");
    if (wrapper && !wrapper.contains(e.target)) {
      resultsDiv.innerHTML = "";
    }
  });

});
