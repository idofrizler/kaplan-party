document.addEventListener('DOMContentLoaded', (event) => {
    var mymap;

    document.getElementById('share_location').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var long = position.coords.longitude;

                localStorage.setItem('lastKnownLat', lat);
                localStorage.setItem('lastKnownLong', long);

                if(!mymap) {
                    mymap = L.map('map').setView([lat, long], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19
                    }).addTo(mymap);
                    document.getElementById('map').parentElement.style.display = "block";
                    mymap.invalidateSize();
                } else {
                    mymap.setView([lat, long], 13);
                }

                L.marker([lat, long]).addTo(mymap);

                if (!document.cookie.split(';').some((item) => item.trim().startsWith('shared_location='))) {
                    fetch('/share_location', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            latitude: lat,
                            longitude: long
                        })
                    }).then(function(response) {
                        return response.text();
                    }).then(function(data) {
                        document.getElementById('share_location').style.display = 'none';
                        document.getElementById('thank_you').style.display = 'block';
                    });
                }
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    if (document.cookie.split(';').some((item) => item.trim().startsWith('shared_location='))) {
        document.getElementById('share_location').style.display = 'none';
        document.getElementById('thank_you').style.display = 'block';

        var lat = localStorage.getItem('lastKnownLat');
        var long = localStorage.getItem('lastKnownLong');
        if (lat && long) {
            mymap = L.map('map').setView([lat, long], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(mymap);
            document.getElementById('map').parentElement.style.display = "block";
            mymap.invalidateSize();

            L.marker([lat, long]).addTo(mymap);
        }
    }
});
