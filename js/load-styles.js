var s = new XMLHttpRequest();
s.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var l = JSON.parse(this.responseText);
        l.forEach(function(s){
            var l = document.createElement("link");
            l.rel = "stylesheet";
            l.href = s.style;

            document.head.appendChild(l);
        })
    }
};
s.open("GET", "js/styles.json", true);
s.send();