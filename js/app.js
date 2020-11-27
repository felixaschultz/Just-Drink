var getCookie = window.getCookie = function getCookie(cname) {
    var name = cname + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length)
        }
    }
    return ''
}
/* Service Worker for PWA and offline functions */
const CACHE = "v0.1.1";

window.addEventListener('install', function (event) {
  console.log('SW Installed');
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        cache.add(new Request(OFFLINE_URL, { cache: "reload" }))
        cache.addAll([
            "/",
            "/css/style.css?v"+ new Date().getTime(),
            "/css/mobile-style.css?v"+ new Date().getTime(),
            "/js/app.js?v=" + new Date().getTime(),
            "home.html",
            "index.html",
            "/js/orders.json",
            "/js/recommendation.json",
            "/js/search.json",
            "/js/styles.json"
        ]);
      })
  );
});

window.addEventListener('activate', function (event) {
    event.waitUntil(
        (async () => {
            // Enable navigation preload if it's supported.
            // See https://developers.google.com/web/updates/2017/02/navigation-preload
            if ("navigationPreload" in self.registration) {
                await self.registration.navigationPreload.enable();
            }
        })()
    );

    // Tell the active service worker to take control of the page immediately.
    self.clients.claim();
});

window.addEventListener('fetch', function(event) {
    if (event.request.mode === "navigate") {
        event.respondWith(
            (async () => {
                try {
                    // First, try to use the navigation preload response if it's supported.
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) {
                    return preloadResponse;
                    }

                    // Always try the network first.
                    const networkResponse = await fetch(event.request);
                    return networkResponse;
                } catch (error) {
                    // catch is only triggered if an exception is thrown, which is likely
                    // due to a network error.
                    // If fetch() returns a valid HTTP response with a response code in
                    // the 4xx or 5xx range, the catch() will NOT be called.
                    console.log("Fetch failed; returning offline page instead.", error);

                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(OFFLINE_URL);
                    return cachedResponse;
                }
            })()
        );
    }
});

window.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'Intastellar Solutions, International';
  const options = {
    body: 'Yay it works.',
    icon: 'images/icon.png',
    badge: 'images/badge.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

const OFFLINE_URL = "/offline.html";


/* Loads styles in */
var s = new XMLHttpRequest();
s.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var l = JSON.parse(this.responseText);
        l.forEach(function(s){
            var list = document.getElementsByTagName("head")[0];
            var l = document.createElement("link");
            l.rel = "stylesheet";
            l.href = s.style;

            list.insertAdjacentElement('afterbegin', l)
        })
    }
};
s.open("GET", "js/styles.json", true);
s.send();

/* Check login Status */
if(getCookie("auth") != "logged in" && window.location.href.indexOf("login.html") <= -1){
    window.location.href = "login.html";
}else if(getCookie("auth") == "logged in" && window.location.href.indexOf("login.html") > -1){
    window.location.href = "index.html";
}

/* Loads orders in */
window.addEventListener("load", function(){
    var sound = new Audio("../sounds/check.mp3");
    if(document.querySelector("form") != null || document.querySelector("form") != undefined){
        document.querySelector("form").addEventListener("submit", function(e){
            e.preventDefault();
            document.cookie = "auth=logged in;";
            window.location.href = "index.html";
        });
    }
    
    var button = document.querySelectorAll(".nav-btn");

    for(var i=0; i<button.length; i++){
        button[i].addEventListener("click", function(e){
            e.preventDefault();
            var label = this.getAttribute("data-label");
            var pages = document.querySelector(".pages");

            if(label == "home"){
                window.location.href = "index.html";
            }

            if(label == "account"){
                
                pages.innerHTML = '<article><header class="small-header"><section class="back close"><span class="back-icon"></span></section><section class="logo-container"><h1 class="logo logo--underline">Just Drink</h1></section></header><main><section class="userinfo"><p>Felix A. Schultz</p><p>info@intastellar.com</p><p class="logout-btn">Logout</p></section><section class="settings-container"><h3>Konto Indstillinger</h3></section></main></article>';

                if(document.querySelector(".logout-btn") != null || document.querySelector(".logout-btn") != undefined){
                    console.log(document.querySelector(".logout-btn"));
                    document.querySelector(".logout-btn").addEventListener("click", function(e){
                        e.preventDefault();
                        document.cookie = "auth=;Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                        window.location.href = "login.html";
                    })
                }

                document.querySelectorAll(".close")[0].addEventListener("click", function(){
                    pages.style.right = "-100%";
                });
            }else if(label == "orders"){
                pages.innerHTML = '<article><header class="small-header"><section class="back close"><span class="back-icon"></span></section><section class="logo-container"><h1 class="logo logo--underline">Just Drink</h1></section><main><h4>Recent orders</h4></header>';
                var order = new XMLHttpRequest();
                order.onreadystatechange = function() {
                    if (this.readyState == 4 && this.status == 200) {
                        var myObj = JSON.parse(this.responseText);
                        myObj.forEach(function(order){
                            var rest = order.resturante;
                            var product = order.product;

                            var price = order.total;
                            var valuta = order.valuta;
                            var amount = order.amount;
                            var logo = order.logo;
                            var type = order.type;
                            var id = order.id;

                            pages.innerHTML += '<section class="userinfo">'+product+'</section>';
                        });
                    }
                    document.querySelectorAll(".close")[0].addEventListener("click", function(){
                        pages.style.right = "-100%";
                    });
                }
                pages.innerHTML += '</main></article>';

                order.open("GET", "js/orders.json", true);
                order.send();
            }

            pages.style.right = "0";
        });
    }

    let recent_orders = document.querySelector(".overview-container");
    let recomendation = document.querySelector(".recomm-container");
    let loader = document.querySelectorAll(".loader");
    let search = document.getElementById("search");

    var orders = new XMLHttpRequest();
    orders.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var myObj = JSON.parse(this.responseText);
        rorders = myObj;
        rorders.forEach(function(order){
            var rest = order.resturante;
            var product = order.product;

            var price = order.total;
            var valuta = order.valuta;
            var amount = order.amount;
            var logo = order.logo;
            var type = order.type;
            var id = order.id;
            var product_image = order.product_image;
            if(loader.length !== 0){
                loader[0].style.display = "none";
                recent_orders.innerHTML += '<article class="roverview order-again" data-id="'+ id +'"><section class="roverview__logo"><img src="'+logo+'"></section><section class="roverview__content"><h2 class="roverview__content-name">'+ rest +'</h2><section class="roverview__content-ratings"></section><section class="roverview__content-product"><img src="'+product_image+'" class="roverview__content-productimage"><p class="roverview_content-info">'+ amount +' x '+ type +' '+ product +'</p><section class="roverview__content-productprice">'+ price +' '+ valuta +'</section></section></section></section></article>';
            }
        });
    }
    };
    orders.open("GET", "js/orders.json", true);
    orders.send();

    var recom = new XMLHttpRequest();
    recom.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var myObj = JSON.parse(this.responseText);
        recom = myObj;
        recom.forEach(function(r){
            var rest = r.resturante;
            var logo = r.logo;
            if(loader.length !== 0){
                loader[1].style.display = "none";
                recomendation.innerHTML += '<article class="recommendation"><section class="recommendation__content"><img class="recommendation__content-logo" src="'+ logo +'"><h2>'+ rest +'</h2></section></article>';
            }
        })
    }
    };
    recom.open("GET", "js/recommendation.json", true);
    recom.send();

    if(window.location.href.indexOf("search.html") > -1){
        var s = new XMLHttpRequest();
        s.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                const urlParams = new URLSearchParams(window.location.search);
                const myParam = urlParams.get('q');
                var zip = myParam;
                var open = JSON.parse(this.responseText);
                //Fedt der er <span id="results-nr">0</span> resturanter i nærheden åben
                open = objs(open,zip, "zip");
                if(open.length >= 1){
                    document.getElementById("results-nr").innerHTML = "Fedt der er "+ open.length +" resturanter i nærheden åben";
                    open.forEach(function(results){
                        let resutrante = results.resturante;
                        let distance = results.distance;
                        let logo = results.logo;
                        let id = results.id;
                        document.getElementById("res").innerHTML += '<a href="resturante.html?id='+ id +'" class="search-results-anchor"><article class="search-results"><section class="search-results-content"><img class="search-logo" src="'+ logo +'"><h3>'+ resutrante +'</h3><p>'+ distance +'</p></section></article></a>';
                    });
                }else{
                    document.getElementById("results-nr").innerHTML = "Åh nej så er flasken tomt, prøv i morgen igen!";
                }
            }
        };
        s.open("GET", "js/search.json", true);
        s.send();
    }else if(window.location.href.indexOf("resturante.html") > -1){
        const urlParams = new URLSearchParams(window.location.search);
        const myParam = urlParams.get('id');
        var zip = myParam;

        var s = new XMLHttpRequest();
        s.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                const urlParams = new URLSearchParams(window.location.search);
                const myParam = urlParams.get('id');
                var zip = myParam;
                var open = JSON.parse(this.responseText);

                if(open.length >= 1){
                    open = objs(open,zip, "id");
                    open.forEach(function(results){
                        let resutrante = results.resturante;
                        let distance = results.distance;
                        let logo = results.logo;
                        let product = results.products;
                        let cover = results.cover;
                        var p = "";

                        for(var i=0; i<product.length; i++){
                            let id = product[i].id;
                            p += '<section><article class="resturante-product border" data-id="'+ id +'"><img class="resturante-productimage" src="'+ product[i].image +'"><h3>'+ product[i].product_name +'</h3><section class="resturante-product-info"><p class="resturante-productprice">'+product[i].price+'</p></section></article></section>';
                        }
                        document.getElementById("res").innerHTML += '<article class="resturante">'+
                            '<section class="resturante-info"><img class="resturante-infocover" src="'+cover+'"><section class="resturante-logoname"><img class="resturante-infologo" src="'+ logo +'"><h2>'+ resutrante +'</h2></section></section>'+p+'</article>';

                        setTimeout(function(){
                            var pbtn = document.querySelectorAll(".resturante-product");
                            for(var i=0; i<pbtn.length; i++){
                                pbtn[i].addEventListener("click", function(e){
                                    let pid = this.getAttribute("data-id");
                                    let overlay = document.querySelector(".product-overview");

                                    if(overlay.style.top !== "0" || overlay.style.top == ""){
                                        overlay.style.top = "0";
                                        let q = new XMLHttpRequest();
                                        q.onreadystatechange = function(){
                                            overlay.innerHTML = "Loading...please wait!";
                                            if(this.readyState == 4 && this.status == 200){
                                                const urlParams = new URLSearchParams(window.location.search);
                                                var id = parseInt(urlParams.get('id'));
                                                var string = JSON.parse(this.responseText);
                                                var product = keySearch(id, string);
                                                /* product = objs(product,pid, "id"); */
                                                var j = parseInt(pid);
                                                products = objs(product.products,j, "id");
                                                var image = products[0].image;
                                                var name = products[0].product_name;
                                                var type = products[0].type;
                                                var price = products[0].price;

                                                overlay.innerHTML = '<article><header class="small-header"> <section class="close"><span class="back-icon"></span></section><section class="logo-container"><h2 class="logo logo--main logo--small">Just Drink</h2></section><section class="cart"></section></header><section class="product-order"><img src="'+image+'"><h2>'+name+'</h2><p>1 x '+type+' '+name+'</p><h2 class="product-orderprice">'+price+'</h2></section><section class="cta-container"><a class="cta" data-item="'+name+'?id='+ pid +'">Tilføj til kurv</a></section></article>';
                                                document.querySelector(".close").addEventListener("click", function(){
                                                    overlay.style.top = "-100%";
                                                });
                                                if(localStorage.getItem("cart")){
                                                    let cart_container = document.querySelectorAll(".cart");
                                                    let scart = JSON.parse(localStorage.getItem("cart"));
                                        
                                                    for(var i=0; i<cart_container.length; i++){
                                                        cart_container[i].innerHTML = "<a class='cart-page' data-label='cart'>"+scart.length+"</a>";
                                                    }
                                                }
                                                if(document.querySelector(".cta") != null || document.querySelector(".cta") != undefined){
                                                    document.querySelector(".cta").addEventListener("click", function(e){
                                                        e.preventDefault();
                                                        let sound = new Audio("../sounds/check.mp3");
                                                        sound.play();
                                                        let item = this.getAttribute("data-item");
                                                        let cart = [];
                                                        if(localStorage.getItem("cart")){
                                                            cart = JSON.parse(localStorage.getItem("cart"));
                                                            cart.push(item);
                                                            localStorage.setItem("cart", JSON.stringify(cart));
                                                        }else{
                                                            cart.push(item);
                                                            localStorage.setItem("cart", JSON.stringify(cart));
                                                        }
                                            
                                                        let cart_container = document.querySelectorAll(".cart");
                                                        let scart = JSON.parse(localStorage.getItem("cart"));
                                            
                                                        for(var i=0; i<cart_container.length; i++){
                                                            cart_container[i].innerHTML = "<a class='cart-page' data-label='cart'>"+scart.length+"</a>";
                                                        }
                                                        document.querySelector(".cta").innerText = "Just Added";

                                                        setTimeout(function(){document.querySelector(".cta").innerText = "Tilføj til kurv";},200);
                                                    });
                                                }
                                            }else{
                                                overlay.innerText = "Loading...please wait!";
                                            }
                                        }

                                        q.open("GET", "js/search.json", true);
                                        q.send();
                                    }else{
                                        overlay.style.top = "-100%";
                                    }
                                })
                            }
                        },10)
                    });
                }else{
                    document.getElementById("results-nr").innerHTML = "Åh nej så er flasken tomt, prøv igen i morgen!";
                }
            }
        }
        s.open("GET", "js/search.json", true);
        s.send();
    }else if(search != undefined || search != null){
        search.addEventListener("submit", function(e){
            e.preventDefault();
            let query = document.getElementById("search-bar").value;
            window.location.href = "search.html?q=" + query;
        });
    }

    if(localStorage.getItem("cart")){
        let cart_container = document.querySelectorAll(".cart");
        let scart = JSON.parse(localStorage.getItem("cart"));

        for(var i=0; i<cart_container.length; i++){
            cart_container[i].innerHTML = "<a class='cart-page' data-label='cart'>"+scart.length+"</a>";
        }
    }

    if(document.querySelector(".cart-page") != null){
        document.querySelector(".cart-page").addEventListener("click", function(){
            let pages = document.querySelector(".pages");
            let label = this.getAttribute("data-label");
            if(label == "cart"){
                pages.innerHTML = '<article><header class="small-header"><section class="back close"><span class="back-icon"></span></section><section class="logo-container"><h1 class="logo logo--underline">Just Drink</h1></section></header><main><section class="orders"></section></main></article>';
    
                document.querySelector(".close").addEventListener("click", function(){
                    pages.style.right = "-100%";
                });
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get('id');
    var zip = myParam;

    var s = new XMLHttpRequest();
    s.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            const urlParams = new URLSearchParams(window.location.search);
            const myParam = urlParams.get('id');
            var zip = myParam;
            var open = JSON.parse(this.responseText);
            if(open.length >= 1){
                setTimeout(function(){
                    var b = document.querySelectorAll(".order-again");
                    for(var i=0; i<b.length; i++){
                        b[i].addEventListener("click", function(e){
                            let pid = this.getAttribute("data-id");
                            let overlay = document.querySelector(".product-overview");

                            if(overlay.style.top !== "0" || overlay.style.top == ""){
                                overlay.style.top = "0";
                                let q = new XMLHttpRequest();
                                q.onreadystatechange = function(){
                                    overlay.innerHTML = "Loading...please wait!";
                                    if(this.readyState == 4 && this.status == 200){
                                        var product = JSON.parse(this.responseText);
                                        product = objs(open,pid, "id");
                                        var image = product[0].product_image;
                                        var name = product[0].product;
                                        var type = product[0].type;
                                        var amount = product[0].amount;
                                        var price = product[0].total + " " + product[0].valuta;
                                        overlay.innerHTML = '<article><header class="small-header"> <section class="close"><span class="back-icon"></span></section><section class="logo-container"><h2 class="logo logo--main logo--small">Just Drink</h2></section><section class="cart"></section></header><section class="product-order"><img src="'+image+'"><h2>'+name+'</h2><p>'+amount+' x '+type+' '+name+'</p><h2 class="product-orderprice">'+price+'</h2></section><section class="cta-container"><a class="cta" data-item="'+name+'?id='+ pid +'">Tilføj til kurv</a></section></article>';
                                        document.querySelector(".close").addEventListener("click", function(){
                                            overlay.style.top = "-100%";
                                        });

                                        if(document.querySelector(".cta") != null || document.querySelector(".cta") != undefined){
                                            document.querySelector(".cta").addEventListener("click", function(e){
                                                e.preventDefault();
                                                let item = this.getAttribute("data-item");
                                                let cart = [];
                                                sound.play();
                                                if(localStorage.getItem("cart")){
                                                    cart = JSON.parse(localStorage.getItem("cart"));
                                                    cart.push(item);
                                                    localStorage.setItem("cart", JSON.stringify(cart));
                                                }else{
                                                    cart.push(item);
                                                    localStorage.setItem("cart", JSON.stringify(cart));
                                                }
                                    
                                                let cart_container = document.querySelectorAll(".cart");
                                                let scart = JSON.parse(localStorage.getItem("cart"));
                                    
                                                for(var i=0; i<cart_container.length; i++){
                                                    cart_container[i].innerHTML = "<a class='cart-page' data-label='cart'>"+scart.length+"</a>";
                                                }
                                                document.querySelector(".cta").innerText = "Just Added";
                                                setTimeout(function(){document.querySelector(".cta").innerText = "Tilføj til kurv";},200);
                                            });
                                        }
                                    }else{
                                        overlay.innerText = "Loading...please wait!";
                                    }
                                }

                                q.open("GET", "js/orders.json", true);
                                q.send();
                            }else{
                                overlay.style.top = "-100%";
                            }
                        })
                    }
                },10)
            }
        }
    }
    s.open("GET", "js/orders.json", true);
    s.send();
    

    if(document.querySelector(".back") !== null && document.querySelector(".close") == null){
        document.querySelector(".back").addEventListener("click", function(e){
            e.preventDefault();
            console.log(e);
            window.history.back();
        });
    }

    function objs(source, name, field) {
        var r = [];
        var searchField = field;
        var searchVal = name;
        for (var i=0 ; i < source.length ; i++)
        {
            if (source[i][searchField] == searchVal) {
                r.push(source[i]);
            }
        }
    
        return r;
    }

    function keySearch(n, a){
        for (var i=0; i < a.length; i++) {
            if (a[i].id === n) {
                return a[i];
            }
        }
    }
    debugger;
});