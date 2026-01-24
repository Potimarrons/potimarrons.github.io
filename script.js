let mybutton = document.getElementById("scrollTopBtn");
window.addEventListener("scroll", () => {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        mybutton.classList.add("show");
    } else {
        mybutton.classList.remove("show");
    }
});

window.topFunction = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}