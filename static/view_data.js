window.onload = function() {
    var date = new Date();

    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var today = date.getFullYear()+"-"+(month)+"-"+(day) ;

    document.getElementById("date").value = today;
};

document.addEventListener('DOMContentLoaded', (event) => {
    let mymap = L.map('map').setView([32.073315118136485, 34.79072242479297], 13);
    let circle = L.circle([32.073315118136485, 34.79072242479297], {radius: 1000}).addTo(mymap);
    let markers = L.layerGroup().addTo(mymap);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(mymap);

    mymap.on('click', function(e) {
        mymap.removeLayer(circle);
        circle = L.circle(e.latlng, {radius: document.getElementById('radius').value}).addTo(mymap);
    });

    document.getElementById('submit').addEventListener('click', function() {
        fetch('/get_location_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: circle.getLatLng().lat,
                longitude: circle.getLatLng().lng,
                radius: document.getElementById('radius').value,
                date: document.getElementById('date').value
            })
        }).then(function(response) {
            return response.json();
        }).then(function(data) {
            // remove any existing markers from the map
            mymap.removeLayer(markers);
            markers = L.layerGroup().addTo(mymap);

            // for each location in the received data, add a marker to the map
            if (Array.isArray(data.locations)) {
                data.locations.forEach(function(location) {
                    L.marker([location.latitude, location.longitude]).addTo(markers);
                });
            }

            // display the device count to the user
            let deviceCountDiv = document.getElementById('device_count');
            deviceCountDiv.textContent = 'Device count: ' + data.device_count;
            deviceCountDiv.style.display = 'block';
        });
    });
});
