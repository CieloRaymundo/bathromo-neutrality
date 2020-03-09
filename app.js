/*------ Constants ------*/
var service, map, pos, infoWindow, google, directionsService, directionsDisplay;


const userLocation = 1;
const destination = 1;

/*------ Classes ------*/

class Session {
    constructor() {
        this.bathrooms = []
        this.userLocation = {
            'latitude': 0,
            'longitude': 0
        }
        this.bathroomCount = 0
    }
    addMarker(bathroomObj) {
      this.bathrooms.push(bathroomObj)
      console.log("new location", bathroomObj);
    }
}

/*----- app's state -----*/
const ourSession = new Session();  // Create Session 

window.addEventListener('load', () => {

  document.getElementById('overlay').classList.add('is-visible');
  document.getElementById('modal').classList.add('is-visible');

  updateLocation()
});

console.log("JavaScript is Connected!");

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;

        ourSession.userLocation['latitude'] = lat;
        ourSession.userLocation['longitude'] = long;

        initMap(lat, long);
    });
}

/* Event Listeners */

document.getElementById("nav-trigger").addEventListener("click", () => {
    openSlideMenu()
});

  document.getElementById('btn-modal').addEventListener('click', function() {
  document.getElementById('overlay').classList.add('is-visible');
  document.getElementById('modal').classList.add('is-visible');
});

document.getElementById('close-btn').addEventListener('click', function() {
  document.getElementById('overlay').classList.remove('is-visible');
  document.getElementById('modal').classList.remove('is-visible');
});
document.getElementById('overlay').addEventListener('click', function() {
  document.getElementById('overlay').classList.remove('is-visible');
  document.getElementById('modal').classList.remove('is-visible');
});


document.getElementById("modal-location-trigger").addEventListener("click", () => {
  document.getElementById('overlay').classList.remove('is-visible');
  document.getElementById('modal').classList.remove('is-visible');
  updateLocation()
  getBathrooms(ourSession.userLocation.latitude, ourSession.userLocation.longitude)
})

/* Function Declarations */ 

  /* Modal Functions*/ 
function openSlideMenu() {
  document.getElementById('side-menu').style.width = '250px';
  document.getElementById('main').style.marginLeft = '250px';
}

function closeSlideMenu() {
  document.getElementById('side-menu').style.width = '0';
  document.getElementById('main').style.marginLeft = '0';
}

  /*  Location Functions */ 
function updateLocation() {
    navigator.geolocation.getCurrentPosition(function(position) {
    ourSession.userLocation['latitude'] = position.coords.latitude;
    ourSession.userLocation['longitude'] = position.coords.longitude;
    
    document.getElementById("top").innerText = reverseGeocoding(position.coords.latitude,position.coords.longitude)
    console.log("Updated Location:", position)
  })
}

/* Reverse Geolocation Functions */

// async function reverseGeocoding(lat, lng) {
//     await fetch(`https://us1.locationiq.com/v1/reverse.php?key=48447f262ef7c7&lat=${lat}&lon=${lng}&format=json`)
//         .then(response => response.json())
//         .then(json => { return json.display_name })
//         .catch()
// }

async function reverseGeocoding(lat, lng) {
    let myResponse = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=48447f262ef7c7&lat=${lat}&lon=${lng}&format=json`);
    myResponse = await myResponse.json().display_name // Parse it
    // console.log(users.reduce(function(a,b) {
    //     return a.length > b.length ? a : b; // whichever is bigger,keep finding the biggest
    // }));
    return myResponse;
};


/* Google Maps Functions */

function initMap() {
    const directionsService = new google.maps.DirectionsService;
    const directionsDisplay = new google.maps.DirectionsRenderer;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            console.log('My General Position:', position);

            const ourMap = new google.maps.Map(document.getElementById('map'), { // Our Map object
                zoom: 14,
                center: {
                    lat: ourSession.userLocation['latitude'],
                    lng: ourSession.userLocation['longitude']
                }
                //center: {lat: 40.699765, lng: -73.941055}
            });


            const currentLocation = new google.maps.Marker({
                position: {
                    lat: ourSession.userLocation['latitude'],
                    lng: ourSession.userLocation['longitude']
                },
                map: ourMap,
                title: 'Current Location',
                icon: 'http://maps.google.com/mapfiles/ms/micons/blue.png'
            });

            google.maps.event.addListener(currentLocation, 'click', function() {
                ourMap.setZoom(17);
                ourMap.setCenter(currentLocation.getPosition());
            });

            directionsDisplay.setMap(ourMap);

            var onChangeHandler = function() {
                calculateAndDisplayRoute(directionsService, directionsDisplay);
            };
            
            
            function calculateAndDisplayRoute(directionsService, directionsDisplay) {
                directionsService.route({
                    origin: document.getElementById('start').value,
                    destination: document.getElementById('end').value,
                    travelMode: 'DRIVING'
                }, function(response, status) {
                    if (status === 'OK') {
                        directionsDisplay.setDirections(response);
                    } else {
                        window.alert('Directions request failed due to ' + status);
                    }
                });
            }

            getBathrooms(ourSession.userLocation['latitude'], ourSession.userLocation['longitude'])
                .then(bathrooms => bathrooms.forEach(bathroom => {

                    const infowindow = new google.maps.InfoWindow();
                    const contentString = `This location is ${reverseGeocoding(bathroom['latitude'], bathroom['longitude'])}`;;
                    const newMarker = new google.maps.Marker({
                        position: {
                            lat: bathroom['latitude'],
                            lng: bathroom['longitude'],
                        },
                        map: ourMap,
                        title: ourSession.bathrooms[bathroom.name],
                    })

                    google.maps.event.addListener(newMarker, 'click', function() {
                        computeTotalDistance(directionsRenderer.getDirections());

                        displayRoute(currentLocation, newMarker.getPosition(), directionsService,
                            directionsRenderer);
                     
                                    });

                    return makeInfoWindowEvent(ourMap, infowindow, contentString, newMarker)
                    return newMarker;
                }));
        });
    }
}

function getBathrooms(lat, long) {
    const url = `https://www.refugerestrooms.org/api/v1/restrooms/by_location?per_page=30&unisex=true&lat=${lat}&lng=${long}`;

    return (fetch(url)
        .then(res => res.json())
        .then(bathrooms => bathrooms.map(bathroom => {
            ourSession.bathroomCount += 1
            ourSession.bathrooms.push((({
                id,
                name,
                street,
                city,
                state,
                latitude,
                longitude,
                distance,
                approved,
                unisex,
                comment
            }) => ({
                id,
                name,
                street,
                city,
                state,
                latitude,
                longitude,
                distance,
                approved,
                unisex,
                comment
            }))(bathroom))
            
            return (({
                id,
                name,
                street,
                city,
                state,
                latitude,
                longitude,
                distance,
                approved,
                unisex,
                comment
            }) => ({
                id,
                name,
                street,
                city,
                state,
                latitude,
                longitude,
                distance,
                approved,
                unisex,
                comment
            }))(bathroom);
        }))
    );
}

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    directionsService.route({
        origin: document.getElementById('start').value,
        destination: document.getElementById('end').value,
        travelMode: 'DRIVING'
    }, function(response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed', status);
            console.log(status)
        }
    });
}


function displayRoute(origin, destination, service, display) {
        service.route({
          origin: origin,
          destination: destination,
          waypoints: [{location: 'Adelaide, SA'}, {location: 'Broken Hill, NSW'}],
          travelMode: 'WALKING',
          avoidTolls: true
        }, function(response, status) {
          if (status === 'OK') {
            display.setDirections(response);
          } else {
            alert('Could not display directions due to: ' + status);
          }
        });
      }

      function computeTotalDistance(result) {
        var total = 0;
        var myroute = result.routes[0];
        for (var i = 0; i < myroute.legs.length; i++) {
          total += myroute.legs[i].distance.value;
        }
        total = total / 1000;
        document.getElementById('total').innerHTML = total + ' km';
      }
      
/*  Function Delcarations  -->  News + Relevant Info  */



function makeInfoWindowEvent(map, infowindow, contentString, newMarker) {
    google.maps.event.addListener(newMarker, 'click', function() {
        infowindow.setContent(contentString);
        infowindow.open(map, marker);
    });
}

function reverseGeocoding(lat, long) {

    fetch(`https://us1.locationiq.com/v1/reverse.php?key=48447f262ef7c7&lat=${lat}&lon=${long}&format=json`)
        .then(response => response.json())
        .then(json => {
            // console.log(json.display_name)
            return json.display_name;
        })
}

/*  Function Delcarations  -->  News + Relevant Info  */


/* Reverse Geocoding API */




//
