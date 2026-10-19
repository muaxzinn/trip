/**
 * Bangkok Trip Planner 2026 - Map Controller Module
 * Manages Leaflet.js map, markers, coordinate linkages, category filtering, and popups.
 */

const MapController = (() => {
  let map = null;
  let markersLayer = null;
  let routeLinesLayer = null;
  let activeFilter = 'all';

  function initMap(containerId = 'leafletMap') {
    if (map) return map;

    const el = document.getElementById(containerId);
    if (!el) return null;

    // Bangkok center coordinates (approx Lat Phrao / Ratchada area)
    map = L.map(containerId, {
      center: [13.765, 100.565],
      zoom: 12,
      scrollWheelZoom: true
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    routeLinesLayer = L.layerGroup().addTo(map);

    return map;
  }

  function getMarkerIcon(category, isSelectedHotel = false) {
    let iconClass = 'icon-transit';
    let iconLetter = '●';

    if (category === 'hotel') {
      iconClass = 'icon-hotel';
      iconLetter = '🏨';
    } else if (category === 'education') {
      iconClass = 'icon-exam';
      iconLetter = '🎓';
    } else if (category === 'attraction') {
      iconClass = 'icon-attraction';
      iconLetter = '🏛️';
    } else if (category === 'transit_pier') {
      iconClass = 'icon-pier';
      iconLetter = '⛴️';
    } else if (category === 'park') {
      iconClass = 'icon-attraction';
      iconLetter = '🌳';
    } else if (category === 'shopping' || category === 'food_street') {
      iconClass = 'icon-food';
      iconLetter = '🛍️';
    } else if (category === 'food' || category === 'food_halal') {
      iconClass = 'icon-food';
      iconLetter = '🍜';
    } else if (category === 'laundry') {
      iconClass = 'icon-laundry';
      iconLetter = '🧺';
    } else if (category === 'convenience') {
      iconClass = 'icon-food';
      iconLetter = '🏪';
    } else if (category === 'transit_station') {
      iconClass = 'icon-transit';
      iconLetter = '🚇';
    }

    const size = isSelectedHotel ? 38 : 28;
    return L.divIcon({
      className: 'custom-map-marker',
      html: `<div class="custom-map-icon ${iconClass}" style="width:${size}px; height:${size}px; font-size:${isSelectedHotel ? 16 : 13}px; ${isSelectedHotel ? 'box-shadow: 0 0 15px #06b6d4; border: 2.5px solid #06b6d4;' : ''}">${iconLetter}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  /**
   * Render all places & hotels on the map
   */
  function renderPlaces(state, selectedHotelId = 'hotel-ratchada', categoryFilter = 'all') {
    if (!map || !markersLayer) return;

    activeFilter = categoryFilter;
    markersLayer.clearLayers();

    const bounds = L.latLngBounds();

    // 1. Render Hotels
    (state.hotels || []).forEach(hotel => {
      if (categoryFilter !== 'all' && categoryFilter !== 'hotels') return;
      if (hotel.latitude && hotel.longitude) {
        const isSelected = hotel.id === selectedHotelId;
        const marker = L.marker([hotel.latitude, hotel.longitude], {
          icon: getMarkerIcon('hotel', isSelected)
        });

        const statusBadge = hotel.coordinatesStatus === 'verified'
          ? '<span class="badge badge-verified">พิกัดยืนยันแล้ว</span>'
          : '<span class="badge badge-estimated">รอตรวจสอบ</span>';

        const popupContent = `
          <div style="min-width: 220px; font-family: 'Prompt', sans-serif;">
            <div style="font-size:0.75rem; color:#06b6d4; font-weight:700; text-transform:uppercase;">โรงแรมที่พัก</div>
            <div style="font-size:1.05rem; font-weight:700; margin:3px 0;">${hotel.name}</div>
            <div style="font-size:0.8rem; color:#64748b; margin-bottom:6px;">${hotel.address}</div>
            <div style="margin-bottom:8px;">${statusBadge}</div>
            <div style="font-size:0.85rem; font-weight:600; color:#10b981; margin-bottom:8px;">ราคา 4 คืน: ${hotel.priceTotal.toLocaleString()} บาท</div>
            <a href="${hotel.mapUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:5px 12px; background:#06b6d4; color:#fff; border-radius:6px; font-size:0.8rem; text-decoration:none; font-weight:600;">เปิดใน Google Maps ↗</a>
          </div>
        `;
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
        bounds.extend([hotel.latitude, hotel.longitude]);
      }
    });

    // 2. Render Places
    (state.places || []).forEach(place => {
      if (!place.latitude || !place.longitude) return;

      // Filter check
      if (categoryFilter === 'hotels') return;
      if (categoryFilter === 'transit' && !place.category.includes('transit')) return;
      if (categoryFilter === 'attractions' && !['attraction', 'park', 'shopping', 'food_street'].includes(place.category)) return;
      if (categoryFilter === 'food' && !['food', 'food_halal', 'convenience', 'food_street'].includes(place.category)) return;
      if (categoryFilter === 'laundry' && place.category !== 'laundry') return;

      const marker = L.marker([place.latitude, place.longitude], {
        icon: getMarkerIcon(place.category, false)
      });

      const statusBadge = place.coordinatesStatus === 'verified'
        ? '<span class="badge badge-verified">พิกัดยืนยันแล้ว</span>'
        : '<span class="badge badge-estimated">พิกัดประมาณการ</span>';

      const popupContent = `
        <div style="min-width: 220px; font-family: 'Prompt', sans-serif;">
          <div style="font-size:0.75rem; color:#06b6d4; font-weight:700;">${place.categoryLabel || place.category}</div>
          <div style="font-size:1rem; font-weight:700; margin:3px 0;">${place.name}</div>
          <div style="font-size:0.8rem; color:#64748b; margin-bottom:5px;">${place.address || ''}</div>
          <div style="margin-bottom:6px;">${statusBadge}</div>
          ${place.openHours ? `<div style="font-size:0.8rem; color:#475569; margin-bottom:4px;">🕒 เวลาทำการ: ${place.openHours}</div>` : ''}
          ${place.priceLevel ? `<div style="font-size:0.8rem; color:#10b981; font-weight:600; margin-bottom:8px;">💰 ราคา: ${place.priceLevel}</div>` : ''}
          <a href="${place.mapUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:5px 12px; background:#06b6d4; color:#fff; border-radius:6px; font-size:0.8rem; text-decoration:none; font-weight:600;">เปิดใน Google Maps ↗</a>
        </div>
      `;
      marker.bindPopup(popupContent);
      markersLayer.addLayer(marker);
      bounds.extend([place.latitude, place.longitude]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }

  /**
   * Draw route sequence for a selected day's itinerary
   */
  function drawDayRoute(dayPlan, hotel, allPlaces) {
    if (!map || !routeLinesLayer) return;

    routeLinesLayer.clearLayers();
    if (!dayPlan || !dayPlan.legs) return;

    const latlngs = [];
    const stopLabels = [];

    // Hotel origin
    if (hotel && hotel.latitude && hotel.longitude) {
      latlngs.push([hotel.latitude, hotel.longitude]);
      stopLabels.push(hotel.name);
    }

    // Match leg destinations with known place coordinates
    dayPlan.legs.forEach(leg => {
      const match = allPlaces.find(p => leg.to.includes(p.name) || p.name.includes(leg.to));
      if (match && match.latitude && match.longitude) {
        latlngs.push([match.latitude, match.longitude]);
        stopLabels.push(match.name);
      }
    });

    // Final return to hotel
    if (hotel && hotel.latitude && hotel.longitude && latlngs.length > 1) {
      latlngs.push([hotel.latitude, hotel.longitude]);
    }

    if (latlngs.length >= 2) {
      // Draw prominent dashed coordinate linkage line
      const polyline = L.polyline(latlngs, {
        color: '#06b6d4',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(routeLinesLayer);

      polyline.bindPopup(`
        <div style="font-family:'Prompt',sans-serif; font-size:0.85rem;">
          <strong>ลำดับการเดินทางประจำวัน (${dayPlan.dayOfWeek})</strong><br>
          <span style="color:#06b6d4;">เส้นเชื่อมต่อพิกัดตรงเพื่อแสดงลำดับสถานที่ (ไม่ใช่เส้นทางตามถนนจริง)</span>
        </div>
      `);

      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }

  function invalidateMapSize() {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 80);
    }
  }

  return {
    initMap,
    renderPlaces,
    drawDayRoute,
    invalidateMapSize
  };
})();
