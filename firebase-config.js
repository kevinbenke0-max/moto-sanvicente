import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    push,
    update,
    onValue,
    runTransaction,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 👇 PEGÁ ACÁ LAS CREDENCIALES DE TU NUEVO PROYECTO DE FIREBASE
const firebaseConfig = {
    apiKey: "PEGA_AQUI_TU_API_KEY",
    authDomain: "TU-PROYECTO.firebaseapp.com",
    databaseURL: "https://TU-PROYECTO-default-rtdb.firebaseio.com",
    projectId: "TU-PROYECTO",
    storageBucket: "TU-PROYECTO.firebasestorage.app",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:000000000000"
};

// 💰 CONFIGURACIÓN DE TARIFAS (SAN VICENTE, MISIONES)
export const TARIFAS = {
    BASE: 1200,      // Bajada de bandera ($)
    POR_KM: 600,     // Valor por kilómetro recorrido ($)
    MINIMO: 1500     // Viaje mínimo ($)
};

// 📍 COORDENADAS CENTRO DE SAN VICENTE, MISIONES
export const SAN_VICENTE_CENTER = [-26.9968, -54.4818];

export const PUNTOS_LOCALES = [
    { nombre: "Plaza San Martín", lat: -26.9968, lng: -54.4818 },
    { nombre: "Terminal de Ómnibus", lat: -26.9922, lng: -54.4862 },
    { nombre: "Hospital SAMIC", lat: -27.0018, lng: -54.4775 },
    { nombre: "Cruce Ruta 14 y Libertador", lat: -26.9945, lng: -54.4840 },
    { nombre: "Zona Industrial / Ruta 13", lat: -26.9890, lng: -54.4745 }
];

export const isConfigured =
    firebaseConfig.apiKey !== "PEGA_AQUI_TU_API_KEY" &&
    Boolean(firebaseConfig.databaseURL) &&
    !firebaseConfig.databaseURL.includes("TU-PROYECTO");

let db = null;
if (isConfigured) {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
}

export { db, ref, set, push, update, onValue, runTransaction, query, orderByChild, equalTo };

export function calcularTarifa(distanciaKm) {
    const bruto = TARIFAS.BASE + distanciaKm * TARIFAS.POR_KM;
    const redondeado = Math.ceil(bruto / 100) * 100; // Redondea a centenas
    return Math.max(TARIFAS.MINIMO, redondeado);
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
