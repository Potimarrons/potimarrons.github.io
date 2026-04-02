// SRC/ADMIN.JS

/**
 * Récupère les données d'un utilisateur depuis UsersData.
 * Si email est vide, utilise l'utilisateur de la session courante.
 */
export async function getUserData(email = "") {
    let targetEmail = email;
    if (!targetEmail) {
        const { data: { session } } = await sb.auth.getSession();
        if (!session?.user) return null;
        targetEmail = session.user.email;
    }

    const { data, error } = await sb
        .from("UsersData")
        .select("*")
        .eq("email", targetEmail)
        .single();

    return error ? null : data;
}

/**
 * Vérifie si l'utilisateur courant a le rang minimum requis.
 * @param {number} rank - Rang minimum requis.
 * @param {object|null} userData - Données utilisateur déjà chargées (optimisation).
 */
export async function is_admin(rank, userData = null) {
    const u = userData || await getUserData();
    return (u?.rank ?? 0) >= rank;
}

/**
 * Génère une clé unique basée sur le navigateur/appareil.
 * Utilisée comme clé sessionStorage.
 */
export function deviceKey() {
    const base = [
        navigator.platform,
        navigator.hardwareConcurrency,
        navigator.deviceMemory,
        screen.width,
        screen.height,
        window.devicePixelRatio,
        "potimarron-fibo-42"
    ].join("|");
    return btoa(base).slice(0, 64);
}

/**
 * Parse une liste "Prénom (note), Prénom2" en noms propres + notes.
 * Exemple : "Laila (amie partie en Espagne), Ahmed"
 * → { names: "Laila, Ahmed", notes: '{"Laila":"amie partie en Espagne"}' }
 */
export function parseUsersInside(raw) {
    const entries = raw.split(",").map(e => e.trim()).filter(Boolean);
    const names = [];
    const notes = {};

    for (const entry of entries) {
        const match = entry.match(/^([^(]+?)(?:\s*\(([^)]+)\))?\s*$/);
        if (!match) continue;
        const name = match[1].trim();
        const note = match[2]?.trim();
        if (name) {
            names.push(name);
            if (note) notes[name] = note;
        }
    }

    return { names: names.join(", "), notes: JSON.stringify(notes) };
}

/**
 * Formate users_inside + users_notes pour l'affichage HTML.
 * Ajoute la note entre parenthèses en style "muted".
 */
export function formatUsersDisplay(names = "", notesJson = "{}") {
    let notes = {};
    try { notes = JSON.parse(notesJson || "{}"); } catch { /* ignore */ }

    return names
        .split(", ")
        .filter(Boolean)
        .map(name => {
            const n = name.trim();
            const note = notes[n];
            return note
                ? `${escapeHtml(n)}<span class="user-note"> (${escapeHtml(note)})</span>`
                : escapeHtml(n);
        })
        .join(", ");
}

/** Échappe les caractères HTML dangereux. */
export function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}