let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  

  // Create IndexedDb before anything else runs
  DBHelper.createIndexedDb(function(){

    initMap();

  })

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
fillReviewsHTML = () => {

  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.setAttribute("tabindex","-1");
  title.setAttribute("id","reviewsHeading");
  container.appendChild(title);



  const id = self.restaurant.id;  

  fetch('http://localhost:1337/reviews/?restaurant_id=' + id)
  .then(function(response) {
    return response.json();
  })
  .then(function(reviewsJson) {
    //console.log(JSON.stringify(reviewsJson));

    if (!reviewsJson) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }


    const ul = document.getElementById('reviews-list');
    reviewsJson.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
    


    //Append deferred reviews to the page
    DBHelper.loadDeferredReviewsByRestaurantId(id, function(error, deferredReviews){

      deferredReviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
      });

    });

  })
  .catch(error => {

    // On error, show a friendly message
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'A network problem occured fetching reviews';
    container.appendChild(noReviews);
    
    console.error(error)
  });

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
  friendlyDate = new Date(review.createdAt);
  date.innerHTML = friendlyDate;
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


  btnAddReview = document.getElementById("btnAddReview");
  btnAddReview.addEventListener("click",function(e){


    let restaurant_id = self.restaurant.id;
    let reviewer_name = document.getElementById('reviewer_name').value;
    let reviewer_rating_elem = document.getElementById('reviewer_rating');
    let reviewer_rating = reviewer_rating_elem.options[reviewer_rating_elem.selectedIndex].value;
    let comment_text = document.getElementById('comment_text').value;

    const status_elem = document.getElementById('status_msg');
    
    
    if (comment_text == "" || reviewer_name == "") {
      status_elem.innerHTML = "Sorry, all fields are required";
      status_elem.style.display = "block";
    }else{

      // post the comment to the server
      postData = {
        restaurant_id : restaurant_id,
        name: reviewer_name,
        rating: reviewer_rating,
        comments: comment_text      
      }

      fetch("http://localhost:1337/reviews/", 
      { method: "POST", 
        body: JSON.stringify(postData) 
      })
      .then(function(response){
        return response.json();
      })
      .then(function(responseJson){
        console.log(responseJson);

        const ul = document.getElementById('reviews-list');
        ul.appendChild(createReviewHTML(responseJson));

        status_elem.innerHTML = "Your review has been added";
        status_elem.style.display = "block";
        status_elem.style.color = "green";

      }).catch(e=>{

        //Handle network error here and inform the user that they are offline
        //console.log(e);

        d = new Date();
        postData.createdAt = d.getTime();
        
        //Save deferred review to IndexedDb
        DBHelper.saveDeferredReviewToDb(postData);

        //Todo: Use a WebWorker to check for network availability and resubmit the stored deferred reviews. 
        //Delete them from local storage when successfully submitted
        let worker = new Worker('js/worker.js');
        worker.onmessage = (e) => { 
          
          if (e.data.isConnected){

            //Terminate the worker here
            worker.terminate();

            // The connection is now established
            console.log("The connection is now established!!!");

            // Post all deferred reviews to the server
            DBHelper.loadDeferredReviews(function(deferredReviews){

              successfullyPosted = [];

              deferredReviews.forEach(review => {

                fetch("http://localhost:1337/reviews/", 
                { method: "POST", 
                  body: JSON.stringify(review) 
                })
                .then(function(response){
                  return response.json();
                })
                .then(function(responseJson){

                  successfullyPosted.push(responseJson.id);

                  if (successfullyPosted.length == deferredReviews.length){
                    
                    //show status message to the user
                    status_elem.innerHTML = "All your deferred reviews have been posted successfully";
                    status_elem.style.display = "block";
                    status_elem.style.color = "green";   

                  }  
                  

                }).catch(e=>{
                  console.log("An error occured posting deferred review");
                });


              });        
        
            });

          }
          
        }
        worker.addEventListener('error', (e) => { 
          console.log("An error occured on the worker");
          console.log(e);
        })

        
        //append the deferred review to the reviews list
        const ul = document.getElementById('reviews-list');
        ul.appendChild(createReviewHTML(postData));

        //show status message to the user
        status_elem.innerHTML = "We realize you are offline. We will automatically post your review when you are back online";
        status_elem.style.display = "block";
        status_elem.style.color = "brown";
      })

    }


    //Clear inputs
    document.getElementById('reviewer_name').value = "";
    document.getElementById('comment_text').value = "";
    

  });

}

