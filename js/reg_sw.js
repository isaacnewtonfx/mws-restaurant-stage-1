// ==============Registering the Service worker=============
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function(reg) { 
        //console.log("Service Worker Registered"); 

        if (reg.waiting) {

            //console.log("sw is skipping waiting");
            self.skipWaiting();
              
          return;
        }

        if (reg.installing) {
          //console.log("sw is installing");
          return;
        }

        if (reg.active) {
          //console.log("sw is active");
          return;
        }


    });
}
// ====================End of Service worker====================