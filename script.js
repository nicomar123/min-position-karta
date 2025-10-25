const map = L.map('map').setView([59.3293, 18.0686], 6);
const statusEl = document.querySelector('.status');
const noteForm = document.getElementById('noteForm');
const noteInput = document.getElementById('noteInput');
const noteList = document.getElementById('noteList');
let activeMarker = null;
const savedNotes = new Map();

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

function setStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function clearStatus() {
  statusEl.textContent = '';
  delete statusEl.dataset.type;
}

function createMarker(latlng, note) {
  const marker = L.marker(latlng, { draggable: true }).addTo(map);
  marker.bindPopup(note || 'Ingen anteckning ännu');
  marker.on('moveend', () => {
    const updated = marker.getLatLng();
    if (savedNotes.has(marker)) {
      savedNotes.get(marker).coords = updated;
      renderNotes();
    }
  });
  marker.on('click', () => {
    activeMarker = marker;
    map.panTo(marker.getLatLng());
    marker.openPopup();
  });
  return marker;
}

function renderNotes() {
  noteList.innerHTML = '';
  savedNotes.forEach((value, marker) => {
    const li = document.createElement('li');
    li.className = 'note-item';
    const text = document.createElement('div');
    text.innerHTML = `<strong>${value.note}</strong><span>${value.coords.lat.toFixed(4)}, ${value.coords.lng.toFixed(4)}</span>`;
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Ta bort';
    removeButton.addEventListener('click', () => {
      map.removeLayer(marker);
      savedNotes.delete(marker);
      renderNotes();
      clearStatus();
    });
    li.append(text, removeButton);
    noteList.appendChild(li);
  });
  if (!savedNotes.size) {
    const empty = document.createElement('li');
    empty.className = 'note-item';
    empty.textContent = 'Inga anteckningar ännu. Lägg till en markering på kartan!';
    noteList.appendChild(empty);
  }
}

function addNote(marker, noteText) {
  savedNotes.set(marker, { note: noteText, coords: marker.getLatLng() });
  marker.bindPopup(noteText);
  renderNotes();
}

function handleLocationFound(position) {
  const { latitude, longitude } = position.coords;
  const latlng = [latitude, longitude];
  map.flyTo(latlng, 14);
  if (activeMarker) {
    activeMarker.setLatLng(latlng);
  } else {
    activeMarker = createMarker(latlng);
  }
  setStatus('Position hittad! Lägg till en anteckning för platsen.');
}

function handleLocationError(error) {
  console.error(error);
  setStatus('Kunde inte hämta din plats. Tillåt platsåtkomst i webbläsaren.', 'error');
}

document.getElementById('locateBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Geolokalisering stöds inte i denna webbläsare.', 'error');
    return;
  }
  setStatus('Försöker hitta din position...');
  navigator.geolocation.getCurrentPosition(handleLocationFound, handleLocationError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
});

document.getElementById('clearBtn').addEventListener('click', () => {
  savedNotes.forEach((_, marker) => map.removeLayer(marker));
  savedNotes.clear();
  activeMarker = null;
  renderNotes();
  setStatus('Alla markeringar borttagna.');
});

map.on('click', event => {
  const marker = createMarker(event.latlng);
  activeMarker = marker;
  setStatus('Markering skapad! Lägg till en anteckning.');
});

noteForm.addEventListener('submit', event => {
  event.preventDefault();
  const noteText = noteInput.value.trim();
  if (!activeMarker) {
    setStatus('Skapa eller flytta en markering först.', 'error');
    return;
  }
  addNote(activeMarker, noteText);
  noteInput.value = '';
  noteInput.focus();
  setStatus('Anteckning sparad!');
});

renderNotes();
