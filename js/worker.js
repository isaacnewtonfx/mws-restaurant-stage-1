// this.onmessage = function(e) {
//   console.log(e);
//   postMessage("Hi from worker thread!");
// }

// Check on connection avaialbilty here

function isConnected() {

  console.log("Checking connection");

  return fetch("http://localhost:1337/restaurants/")
  .then(function(response){ 

    postMessage({isConnected: true});

  }).catch(e=>{
    console.log("Connection is not available");
    setTimeout(isConnected, 10000);
  });

}

// initial call
isConnected();