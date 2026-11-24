import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getDatabase,
    ref,
    get,
    set,
    push,
    update,
    remove,
    onValue,
    runTransaction,
    query,
    limitToLast
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCsGCAlnCmnh8150oHtjMVk4McU0L71TOQ",
    authDomain: "moto-sanvicente.firebaseapp.com",
    databaseURL: "https://moto-sanvicente-default-rtdb.firebaseio.com",
    projectId: "moto-sanvicente",
    storageBucket: "moto-sanvicente.firebasestorage.app",
    messagingSenderId: "168625716940",
    appId: "1:168625716940:web:cef89828e36ee0be110c69"
};

export const DEFAULT_CONFIG = {
    base: 1200,         // Bajada de bandera ($)
    perKm: 600,         // Valor por km ($)
    minimum: 1500,      // Tarifa mínima ($)
    stopFee: 400,       // Adicional por parada intermedia ($)
    nightPct: 25,       // Recargo nocturno 00:00 a 06:00 (%)
    rainMode: false,    // Modo lluvia activable desde admin.html
    rainPct: 20         // Recargo por lluvia (%)
};

export const SAN_VICENTE_CENTER = [-26.9968, -54.4818];

export const PUNTOS_LOCALES = [
    { nombre: "Plaza San Martín", lat: -26.9968, lng: -54.4818 },
    { nombre: "Terminal de Ómnibus", lat: -26.9922, lng: -54.4862 },
    { nombre: "Hospital SAMIC", lat: -27.0018, lng: -54.4775 },
    { nombre: "Cruce Ruta 14 y Libertador", lat: -26.9945, lng: -54.4840 },
    { nombre: "Zona Industrial / Ruta 13", lat: -26.9890, lng: -54.4745 }
];

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export const isConfigured = true;
export {
    db, auth,
    ref, get, set, push, update, remove, onValue, runTransaction, query, limitToLast,
    signInWithEmailAndPassword, signOut, onAuthStateChanged
};

export function esHorarioNocturno(dateObj = new Date()) {
    const h = dateObj.getHours();
    return h >= 0 && h < 6;
}

export function calcularTarifaDinamica(distanciaKm, config = DEFAULT_CONFIG, opts = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const hasStop = Boolean(opts.hasStop);
    const refDate = opts.scheduledDate ? new Date(opts.scheduledDate) : new Date();
    const isNight = !isNaN(refDate.getTime()) && esHorarioNocturno(refDate);
    const isRain = Boolean(cfg.rainMode);

    let subtotal = Number(cfg.base) + Number(distanciaKm) * Number(cfg.perKm);
    if (hasStop) subtotal += Number(cfg.stopFee);

    let recargoPct = 0;
    if (isNight) recargoPct += Number(cfg.nightPct || 0);
    if (isRain) recargoPct += Number(cfg.rainPct || 0);

    const totalBruto = subtotal * (1 + recargoPct / 100);
    const redondeado = Math.ceil(totalBruto / 100) * 100;
    const finalPrice = Math.max(Number(cfg.minimum), redondeado);

    return {
        total: finalPrice,
        isNight,
        isRain,
        hasStop,
        nightPct: Number(cfg.nightPct || 0),
        rainPct: Number(cfg.rainPct || 0)
    };
}

export function generarPin() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

export function limpiarTelefonoWhatsApp(tel) {
    const digits = String(tel || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("54")) return digits;
    if (digits.startsWith("0")) return "549" + digits.slice(1);
    return "549" + digits;
}

export function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function escHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export function formatHoraFecha(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}
