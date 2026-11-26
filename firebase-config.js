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
    // Tarifas Moto / Envío
    base: 1200,
    perKm: 600,
    minimum: 1500,
    stopFee: 400,
    // Tarifas Auto (doble por defecto, editables en admin.html)
    autoBase: 2400,
    autoPerKm: 1200,
    autoMinimum: 3000,
    autoStopFee: 800,
    // Recargos y administración
    nightPct: 25,
    rainMode: false,
    rainPct: 20,
    adminPct: 15,
    adminAlias: "",
    adminHolder: "",
    adminPhone: ""
};

export const DEFAULT_CITIES = [
    { id: "san-vicente", nombre: "San Vicente", provincia: "Misiones", lat: -26.9968, lng: -54.4818 },
    { id: "dos-de-mayo", nombre: "Dos de Mayo", provincia: "Misiones", lat: -27.0333, lng: -54.6667 },
    { id: "aristobulo-del-valle", nombre: "Aristóbulo del Valle", provincia: "Misiones", lat: -27.0950, lng: -54.8969 },
    { id: "el-soberbio", nombre: "El Soberbio", provincia: "Misiones", lat: -27.2983, lng: -54.1986 },
    { id: "san-pedro", nombre: "San Pedro", provincia: "Misiones", lat: -26.6219, lng: -54.1086 },
    { id: "obera", nombre: "Oberá", provincia: "Misiones", lat: -27.4871, lng: -55.1199 },
    { id: "posadas", nombre: "Posadas", provincia: "Misiones", lat: -27.3671, lng: -55.8961 }
];

export const SAN_VICENTE_CENTER = [-26.9968, -54.4818];

export const PUNTOS_LOCALES = [
    { nombre: "Plaza San Martín", lat: -26.9968, lng: -54.4818, cityId: "san-vicente" },
    { nombre: "Terminal de Ómnibus", lat: -26.9922, lng: -54.4862, cityId: "san-vicente" },
    { nombre: "Hospital SAMIC", lat: -27.0018, lng: -54.4775, cityId: "san-vicente" }
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

export function normalizarIdCiudad(nombre) {
    return String(nombre || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "san-vicente";
}

export function esHorarioNocturno(dateObj = new Date()) {
    const h = dateObj.getHours();
    return h >= 0 && h < 6;
}

export function calcularTarifaDinamica(distanciaKm, config = DEFAULT_CONFIG, opts = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const isAuto = opts.vehicleType === "auto";
    const hasStop = Boolean(opts.hasStop);
    const refDate = opts.scheduledDate ? new Date(opts.scheduledDate) : new Date();
    const isNight = !isNaN(refDate.getTime()) && esHorarioNocturno(refDate);
    const isRain = Boolean(cfg.rainMode);

    const baseVal = Number(isAuto ? (cfg.autoBase ?? cfg.base * 2) : cfg.base);
    const perKmVal = Number(isAuto ? (cfg.autoPerKm ?? cfg.perKm * 2) : cfg.perKm);
    const minVal = Number(isAuto ? (cfg.autoMinimum ?? cfg.minimum * 2) : cfg.minimum);
    const stopVal = Number(isAuto ? (cfg.autoStopFee ?? cfg.stopFee * 2) : cfg.stopFee);

    let subtotal = baseVal + Number(distanciaKm) * perKmVal;
    if (hasStop) subtotal += stopVal;

    let recargoPct = 0;
    if (isNight) recargoPct += Number(cfg.nightPct || 0);
    if (isRain) recargoPct += Number(cfg.rainPct || 0);

    const totalBruto = subtotal * (1 + recargoPct / 100);
    const redondeado = Math.ceil(totalBruto / 100) * 100;
    const finalPrice = Math.max(minVal, redondeado);

    return {
        total: finalPrice,
        vehicleType: isAuto ? "auto" : "moto",
        stopFeeApplied: stopVal,
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
