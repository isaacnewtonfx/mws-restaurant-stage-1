/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    //return `http://localhost:${port}/data/restaurants.json`;
    return `http://localhost:${port}/restaurants`;
  }


  /**
   * Create IndexDB Database and Object Stores.
   */
  static createIndexedDb(callback){

    let IDBOpenRequest = window.indexedDB.open("AppDB", 1);

    IDBOpenRequest.onupgradeneeded = function(event) {

      let db = event.target.result;

      //Create Restaurants Object Store
      let restaurantObjectStore = db.createObjectStore("Restaurants", { keyPath: "id" });
      restaurantObjectStore.createIndex("id", "id", { unique: true });


      //Create Deferred Reviews Object Store
      let deferredReviewsObjectStore = db.createObjectStore("DeferredReviews", { keyPath: "id",autoIncrement:true });
      deferredReviewsObjectStore.createIndex("id", "id", { unique: true });

    }

    IDBOpenRequest.onsuccess = function(event) {

      //Call the callback when done
      callback();
    }

    IDBOpenRequest.onerror = function(event) {
      const error = 'error opening AppDB indexedDb';
      callback(error,null);
    };

  }





  /**
   * Save all restaurants to indexedDB.
   */
  static saveRestaurantsToDb(restaurants){

    console.log("inside saving restaurants to db");

    let IDBOpenRequest = window.indexedDB.open("AppDB", 1);
    
    IDBOpenRequest.onerror = function(event) {
        console.log("IDBrequest Error")
    };

    IDBOpenRequest.onsuccess = function(event) {
      
      const db = event.target.result;
      const restaurantObjectStore = db.transaction("Restaurants", "readwrite").objectStore("Restaurants");

      restaurantObjectStore.transaction.oncomplete = function(event) {

        // add data to the objectStore.
        var restaurantObjectStore = db.transaction("Restaurants", "readwrite").objectStore("Restaurants");

        // add restaurants to object store
        for (var key in restaurants) {
           restaurantObjectStore.add(restaurants[key]);
        }
 
      };
    };

  }


  /**
   * Save deferred reviews to indexedDB.
   */
  static saveDeferredReviewToDb(review){

    console.log("inside saving deferred reviews to db");

    let IDBOpenRequest = window.indexedDB.open("AppDB", 1);
    
    IDBOpenRequest.onerror = function(event) {
        console.log("IDBrequest Error")
    };

    IDBOpenRequest.onsuccess = function(event) {
      
      const db = event.target.result;
      const deferredReviewsObjectStore = db.transaction("DeferredReviews", "readwrite").objectStore("DeferredReviews");

      deferredReviewsObjectStore.transaction.oncomplete = function(event) {

        // add data to the objectStore.
        var deferredReviewsObjectStore = db.transaction("DeferredReviews", "readwrite").objectStore("DeferredReviews");

        // add deferred review to object store
        deferredReviewsObjectStore.add(review);
        
      };
    };

  }


/**
   * Fetch deferred reviews by restaurant ID.
   */
  static loadDeferredReviewsByRestaurantId(restaurant_id, callback){

    let IDBOpenRequest = window.indexedDB.open("AppDB", 1);
    let reviews = [];

    IDBOpenRequest.onsuccess = function(event) {
      const db = event.target.result;


      try {

        const deferredReviewsObjectStore = db.transaction("DeferredReviews", "readwrite").objectStore("DeferredReviews");
        const getAllRequest = deferredReviewsObjectStore.getAll();

        getAllRequest.onsuccess = function(event) {

          reviews = event.target.result;
          const deferredReviews = reviews.filter(r => r.restaurant_id == restaurant_id);

          //success
          callback(null,deferredReviews);
        };

        getAllRequest.onerror = function(event) {
          const error = 'error loading restaurants from indexedDb';
          callback(error,null);
        };

      } catch (error) {
        console.log(error);  
        callback(error,null); 
      }

    }


    IDBOpenRequest.onerror = function(event) {
      const error = 'error opening AppDB indexedDb';
      callback(error,null);
    };

  }




/**
   * Fetch deferred reviews
   */
  static loadDeferredReviews(callback){

    let IDBOpenRequest = window.indexedDB.open("AppDB", 1);
    let reviews = [];

    IDBOpenRequest.onsuccess = function(event) {
      const db = event.target.result;


      try {

        const deferredReviewsObjectStore = db.transaction("DeferredReviews", "readwrite").objectStore("DeferredReviews");
        const getAllRequest = deferredReviewsObjectStore.getAll();

        getAllRequest.onsuccess = function(event) {

          reviews = event.target.result;

          //success
          callback(reviews);
        };

        getAllRequest.onerror = function(event) {
          const error = 'error loading restaurants from indexedDb';
          callback(error,null);
        };

      } catch (error) {
        console.log(error);  
        callback(error,null); 
      }

    }


    IDBOpenRequest.onerror = function(event) {
      const error = 'error opening AppDB indexedDb';
      callback(error,null);
    };

  }



    /**
   * Fetch all restaurants from indexedDB.
   */
  static loadRestaurantsFromDb(callback){

      let IDBOpenRequest = window.indexedDB.open("AppDB", 1);
      let restaurants = [];


      IDBOpenRequest.onsuccess = function(event) {

       // console.log("IDBrequest Success");

        const db = event.target.result;

        // handle error when Restaurants Object Store is not created yet
        try {

          const restaurantObjectStore = db.transaction("Restaurants", "readwrite").objectStore("Restaurants");
          const getAllRequest = restaurantObjectStore.getAll();

          getAllRequest.onsuccess = function(event) {
            restaurants = event.target.result;
  
            //success
            callback(null,restaurants);
          };
  
          getAllRequest.onerror = function(event) {
            const error = 'error loading restaurants from indexedDb';
            callback(error,null);
          };

        } catch (error) {
          console.log(error);  
          callback(error,null); 
        }

    }

    IDBOpenRequest.onerror = function(event) {
      const error = 'error opening AppDB indexedDb';
      callback(error,null);
    };

}


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    // First check if restaurants exists in indexedDb else fallback on online resource

   this.loadRestaurantsFromDb( (error, restaurants) => {

      if(restaurants && restaurants.length>0){

        // loading restaurants from IndexedDb
        console.log('loading restaurants from IndexedDb');
        callback(null, restaurants);

      }else{

        // loading restaurants from Online
        console.log('loading restaurants from Online');

        let xhr = new XMLHttpRequest();
        xhr.open('GET', DBHelper.DATABASE_URL);
        xhr.onload = () => {
          if (xhr.status === 200) { // Got a success response from server!
            const json = JSON.parse(xhr.responseText);
            //console.log(json);
            //const restaurants = json.restaurants;
    
            // save restaurants to indexedDb
            this.saveRestaurantsToDb(json);
    
            callback(null, json);
          } else { // Oops!. Got an error from server.
            const error = (`Request failed. Returned status of ${xhr.status}`);
            callback(error, null);
          }
        };
        xhr.send();
        
      }

   });

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        console.log('checking the cause of error at reviewer end');
        console.log(restaurants);
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

