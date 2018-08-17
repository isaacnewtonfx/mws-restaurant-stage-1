let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiaXNhYWNuZXd0b24iLCJhIjoiY2preTJoeTJyMGFuYzN3cDQ0Y2ppamFobCJ9.fzlfT9wqluy3ejxuGYXbAA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
  

      // Now call function to attach tab control events to elements
      attachTabControlEventsToElements();  
  
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.setAttribute("aria-label","restaurant address, " + restaurant.address);
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.setAttribute("alt","");
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.setAttribute("aria-label","restaurant cuisine, " + restaurant.cuisine_type);
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    
    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    row_aria_label = "";
    if(time.innerHTML.includes(",")){

      _time_from =  time.innerHTML.split(",")[0];
      _time_to =  time.innerHTML.split(",")[1];

      time_from = " opening from " +  _time_from.split("-")[0] + " to" + _time_from.split("-")[1];
      time_to = " and from" + _time_to.split("-")[0] + " to" + _time_to.split("-")[1];

      row_aria_label = "on " + day.innerHTML + time_from + time_to;

    }else{
      time_from = " opening from " +  time.innerHTML.split("-")[0];
      time_to = " to" + time.innerHTML.split("-")[1];
      row_aria_label = "on " + day.innerHTML + time_from + time_to;
    }

    row.setAttribute("aria-label", row_aria_label);
    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.setAttribute("tabindex","-1");
  title.setAttribute("id","reviewsHeading");
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.setAttribute("aria-label","review rating");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  li.setAttribute("tabindex",0);

  li.setAttribute("aria-label", "reviewer name, " + review.name + 
                  ", review date," + review.date + ",review rating," 
                  + review.rating + ",review comment," + review.comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


// This function will handle the order of the tab control for ARIA
function attachTabControlEventsToElements(){

  homeNav = document.getElementById("homeNav");
  homeNav.addEventListener("keydown",function(e){
    if(event.shiftKey && event.keyCode == 9) { 
      //shift was down when tab was pressed
      return
    }else if(e.keyCode == 9){
      e.preventDefault();
      document.getElementById("restaurant-name").focus();
    }
  });
  
  restHoursTable = document.getElementById("restaurant-hours");
  restHoursTable.addEventListener("keydown",function(e){
    e.preventDefault();
    document.getElementById("map-container2").focus();
  });


  mapZoomOutBtn = document.getElementsByClassName("leaflet-control-zoom-out")[0];
  mapZoomOutBtn.addEventListener("keydown",function(e){
    if(event.shiftKey && event.keyCode == 9) { 
      //shift was down when tab was pressed
      return
    }else if(e.keyCode == 9){
      e.preventDefault();
      document.getElementById("reviewsHeading").focus();
    }
  });

  reviewsHeading = document.getElementById("reviewsHeading");
  reviewsHeading.addEventListener("keydown",function(e){
    if(event.shiftKey && event.keyCode == 9) { 
      //shift was down when tab was pressed
      e.preventDefault();
      document.getElementsByClassName("leaflet-control-zoom-out")[0].focus();
    }
  });

  // reviewsUL = document.getElementById("reviews-list");
  // reviewsUL.addEventListener("keydown",function(e){
  //   if(event.shiftKey && event.keyCode == 9) { 
  //     //shift was down when tab was pressed
  //     e.preventDefault();
  //     document.getElementById("reviewsHeading").focus();
  //   }
  // });



}
