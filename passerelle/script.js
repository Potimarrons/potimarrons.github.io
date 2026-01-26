document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "k") {
        document.body.classList.toggle("reveal-secret");
    }
});