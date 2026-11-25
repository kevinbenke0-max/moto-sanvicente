(function () {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch(() => {});
        });
    }

    const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    if (isStandalone) return;

    let deferredPrompt = null;
    let installBtn = null;

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    function createInstallButton() {
        if (installBtn) return installBtn;
        const bar = document.querySelector(".topbar-actions");
        if (!bar) return null;

        installBtn = document.createElement("button");
        installBtn.type = "button";
        installBtn.className = "mode-switch-link";
        installBtn.textContent = "📲 Instalar";
        installBtn.style.borderColor = "var(--accent)";
        installBtn.style.color = "var(--accent-bright)";
        bar.prepend(installBtn);

        installBtn.addEventListener("click", async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice && choice.outcome === "accepted") {
                    installBtn.remove();
                    installBtn = null;
                }
                deferredPrompt = null;
            } else if (isIos) {
                alert("Para instalar en iPhone:\n1. Tocá el botón Compartir (⬆️) abajo.\n2. Elegí 'Agregar a inicio'.");
            }
        });

        return installBtn;
    }

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        createInstallButton();
    });

    window.addEventListener("appinstalled", () => {
        if (installBtn) {
            installBtn.remove();
            installBtn = null;
        }
        deferredPrompt = null;
    });

    if (isIos) {
        window.addEventListener("DOMContentLoaded", () => {
            createInstallButton();
        });
    }
})();
