// ADMIN
import { getUserData, escapeHtml, deviceKey } from "../src/admin.js";
import { checkPath } from "../src/path_checker.js";

const ranks = {
    0: "Pas un tacos",
    1: "Petit Tacos",
    2: "Le classique T1",
    3: "Simple, un T2",
    4: "Le bon T4",
    5: "T4 bien géchar"
};

// Vérification synchrone rapide
if (sessionStorage.getItem(deviceKey()) !== "validated") {
    location.replace("../refused.html");
}

let currentPersonName = null;

document.addEventListener("DOMContentLoaded", async () => {
    globalThis.adminUserData = await getUserData("");

    if (adminUserData?.rank >= 3) {
        // Initialiser le canal broadcast (nécessaire pour pouvoir envoyer)
        globalThis.notifChannel = sb.channel("potimarrons-notifications").subscribe();
        await initApp();
        document.querySelectorAll(".staff-panel").forEach(p => p.style.display = "block");

        // Section maintenance : rank 5 uniquement
        if (adminUserData.rank >= 5) {
            document.getElementById("maintenance-section").style.display = "block";
            await refreshMaintenanceStatus();
        }

        document.getElementById("access-loading").style.display = "none";
        document.getElementById("access-denied").style.display = "none";
    } else {
        document.getElementById("access-denied").style.display = "block";
        document.getElementById("access-loading").style.display = "none";
    }

    document.getElementById("main-loader").classList.add("hide");
    document.body.classList.add("validated");
});

// ── Init ────────────────────────────────────────────────────────
async function initApp() {

    // ── Utilisateurs ───────────────────────────────────────────
    window.see_users = async function () {
        document.body.style.overflow = "hidden";
        const popup = document.getElementById("users-popup");
        const list = document.getElementById("users-list");

        popup.style.display = "block";
        list.innerHTML = "<p>Chargement...</p>";

        const { data, error } = await sb
            .from("UsersData")
            .select("email, pseudo, rank, created_at, last_sign_in_at, avatar_color")
            .order("rank", { ascending: false });

        if (error || !data?.length) {
            list.innerHTML = "<p>Aucun utilisateur.</p>";
            return;
        }

        list.innerHTML = "";
        data.forEach(u => {
            const div = document.createElement("div");
            div.className = "user-item";

            const dot = u.avatar_color
                ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;
                   background:${u.avatar_color};margin-right:.4rem;"></span>`
                : "";

            div.innerHTML = `
                <span>
                    <strong>${dot}${escapeHtml(u.pseudo || u.email)}</strong>
                    <small style="margin-left:.3rem;color:var(--muted)">
                        ${ranks[u.rank] ?? `Rang ${u.rank}`}
                    </small><br>
                    <small style="color:var(--muted)">${escapeHtml(u.email)}</small><br>
                    <small>Créé le ${new Date(u.created_at).toLocaleString("fr-FR")}</small>
                </span>
                <button class="user-info" onclick="display_info('${escapeHtml(u.email)}')">
                    <i class="fa-solid fa-info"></i>
                </button>
            `;
            list.appendChild(div);
        });
    };

    window.display_info = async function (email) {
        const targetUser = await getUserData(email);
        if (!targetUser) { alert("Utilisateur introuvable."); return; }

        // Sélect rang
        const select = document.getElementById("user-rank-select");
        const isSuperAdmin = adminUserData.email === "csj.potin@gmail.com";
        const canChangeRank = isSuperAdmin
            || (adminUserData.rank >= 4
                && adminUserData.rank > targetUser.rank
                && targetUser.email !== adminUserData.email);

        select.innerHTML = "";
        for (let r = 0; r <= 5; r++) {
            const opt = document.createElement("option");
            opt.value = r;
            opt.textContent = ranks[r];
            if (r === targetUser.rank) opt.selected = true;
            if (!isSuperAdmin && r >= adminUserData.rank) {
                opt.disabled = true;
                opt.textContent += " 🔒";
            }
            select.appendChild(opt);
        }
        select.disabled = !canChangeRank;

        select.onchange = async () => {
            const newRank = Number(select.value);
            if (newRank === targetUser.rank) return;
            if (!confirm(`Changer le rang de ${targetUser.email} vers "${ranks[newRank]}" ?`)) {
                select.value = targetUser.rank; return;
            }
            const { error } = await sb.rpc("update_user_rank", {
                target_email: targetUser.email, new_rank: newRank
            });
            if (error) {
                alert("Erreur : " + error.message);
                select.value = targetUser.rank; return;
            }
            targetUser.rank = newRank;
            alert(`Rang de ${targetUser.email} changé vers "${ranks[newRank]}".`);
        };

        document.getElementById("session-id").innerHTML =
            `<span style="color:#d1ffe7">${escapeHtml(targetUser.pseudo)}</span>`;
        document.getElementById("user-email").textContent = targetUser.email;
        document.getElementById("user-created-at").textContent =
            new Date(targetUser.created_at).toLocaleString("fr-FR");
        document.getElementById("user-connected-at").textContent =
            new Date(targetUser.last_sign_in_at).toLocaleString("fr-FR");
        document.getElementById("user-token").innerHTML =
            `<span style="color:#8f8f8f">${escapeHtml(targetUser.token_used || "—")}</span>`;
        document.getElementById("user-bio").textContent =
            targetUser.bio?.trim() || "(aucune bio renseignée)";

        // Notes admin
        const notesArea = document.getElementById("user-admin-notes");
        const saveBtn = document.getElementById("save-admin-notes-btn");
        notesArea.value = targetUser.admin_notes || "";
        notesArea.disabled = adminUserData.rank < 3;
        saveBtn.style.display = adminUserData.rank >= 3 ? "inline-flex" : "none";

        saveBtn.onclick = async () => {
            const { error } = await sb.rpc("update_user_admin_notes", {
                target_email: targetUser.email,
                notes: notesArea.value
            });
            if (error) { alert("Erreur : " + error.message); return; }
            targetUser.admin_notes = notesArea.value;
            alert("Notes sauvegardées.");
        };

        document.getElementById("user-info-popup").style.display = "block";
    };

    window.banUser = () => alert("Fonctionnalité non encore disponible.");

    // ── Tokens ─────────────────────────────────────────────────
    window.create_token = async function () {
        const user = prompt("La personne à qui le token est destiné :");
        if (!user?.trim()) return;
        const { error } = await sb.from("TokensData").insert({ user_sent: user.trim() });
        if (error) {
            alert(error.message.includes("row-level security")
                ? "Vous n'avez pas les droits pour créer un token."
                : "Erreur : " + error.message);
            return;
        }
        await see_unused_tokens();
    };

    window.delete_token = async function (token) {
        if (!confirm("Supprimer ce token ?")) return;
        const { error } = await sb.from("TokensData").delete().eq("token", token);
        if (error) { alert("Erreur : " + error.message); return; }
        await see_unused_tokens();
    };

    window.see_unused_tokens = async function () {
        document.body.style.overflow = "hidden";
        const popup = document.getElementById("tokens-popup");
        const list = document.getElementById("tokens-list");

        document.getElementById("create-token-btn").style.display =
            adminUserData.rank >= 4 ? "flex" : "none";

        popup.style.display = "block";
        list.innerHTML = "<p>Chargement...</p>";

        const { data } = await sb
            .from("TokensData").select("*")
            .eq("used", false).order("created_at", { ascending: false });

        const now = Date.now();
        const valid = (data || []).filter(t => new Date(t.expires_at).getTime() >= now);

        if (!valid.length) { list.innerHTML = "<p>Aucun token inutilisé.</p>"; return; }

        list.innerHTML = valid.map(t => `
            <div class="token-item">
                <span>
                    Pour <strong>${escapeHtml(t.user_sent)}</strong> :
                    <code>${escapeHtml(t.token)}</code><br>
                    <small>Expire le ${new Date(t.expires_at).toLocaleString("fr-FR")}</small>
                </span>
                ${adminUserData.rank >= 5
                ? `<button class="token-delete" onclick="delete_token('${escapeHtml(t.token)}')">
                           <i class="fa-solid fa-trash"></i>
                       </button>` : ""}
            </div>
        `).join("");
    };

    // ── Kebabs admin (métadonnées) ──────────────────────────────
    let selectedKebabMeta = null;

    window.see_kebabs_admin = async function () {
        document.body.style.overflow = "hidden";
        const popup = document.getElementById("kebabs-admin-popup");
        const list = document.getElementById("kebabs-admin-list");

        popup.style.display = "block";
        list.innerHTML = "<p>Chargement...</p>";

        const { data, error } = await sb.rpc("get_kebabs_admin_metadata");

        if (error || !data) {
            list.innerHTML = `<p>Erreur : ${escapeHtml(error?.message || "inconnue")}</p>`;
            return;
        }
        if (!data.length) { list.innerHTML = "<p>Aucun kebab enregistré.</p>"; return; }

        list.innerHTML = "";
        data.forEach(k => {
            const div = document.createElement("div");
            div.className = "user-item kebab-meta-item";

            const tagStr = (k.tags || "").split(",").map(t => t.trim()).filter(Boolean)
                .map(t => `<span class="tag-mini">${escapeHtml(t)}</span>`).join("");

            const publicBadge = k.is_public
                ? `<span class="public-admin-badge"><i class="fa-solid fa-globe"></i> Public</span>`
                : "";

            div.innerHTML = `
                <span>
                    <strong>${escapeHtml(k.title)}</strong>
                    ${publicBadge}${tagStr ? `<span style="margin-left:.3rem">${tagStr}</span>` : ""}
                    <br>
                    <small>Par : ${escapeHtml(k.owner_email)}</small><br>
                    <small>
                        ${k.shares_count} partage(s) —
                        créé le ${new Date(k.created_at).toLocaleString("fr-FR")}
                    </small>
                </span>
                <button class="user-info" title="Voir les partages"
                    onclick="showKebabSharesAdmin(
                        '${escapeHtml(k.kebab_id)}',
                        '${escapeHtml(k.title).replace(/'/g, "\\'")}',
                        '${escapeHtml(k.owner_email)}')">
                    <i class="fa-solid fa-share-nodes"></i>
                </button>
            `;
            list.appendChild(div);
        });
    };

    window.showKebabSharesAdmin = async function (kebabId, title, ownerEmail) {
        const popup = document.getElementById("kebab-shares-admin-popup");
        const list = document.getElementById("kebab-shares-admin-list");

        document.getElementById("kebab-shares-admin-title").textContent = title;
        document.getElementById("kebab-shares-admin-owner").textContent = `Propriétaire : ${ownerEmail}`;

        selectedKebabMeta = { kebab_id: kebabId, title, owner_email: ownerEmail };
        popup.style.display = "block";
        list.innerHTML = "<p>Chargement...</p>";

        const { data, error } = await sb
            .from("KebabShares")
            .select("id, shared_with_email, can_edit, created_at")
            .eq("kebab_id", kebabId)
            .order("created_at");

        if (error || !data?.length) {
            list.innerHTML = "<p>Aucun partage pour ce kebab.</p>"; return;
        }

        list.innerHTML = data.map(s => `
            <div class="share-item-admin">
                <span>
                    <strong>${escapeHtml(s.shared_with_email)}</strong>
                    <span class="share-perm${s.can_edit ? " can-edit" : ""}">
                        ${s.can_edit ? "Modification" : "Lecture seule"}
                    </span><br>
                    <small>Depuis le ${new Date(s.created_at).toLocaleString("fr-FR")}</small>
                </span>
                <button class="token-delete" title="Supprimer ce partage"
                    onclick="adminDeleteShare('${s.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join("");
    };

    window.adminDeleteShare = async function (shareId) {
        if (!confirm("Supprimer ce partage ?")) return;
        const { error } = await sb.from("KebabShares").delete().eq("id", shareId);
        if (error) { alert("Erreur : " + error.message); return; }
        if (selectedKebabMeta) {
            await showKebabSharesAdmin(
                selectedKebabMeta.kebab_id,
                selectedKebabMeta.title,
                selectedKebabMeta.owner_email
            );
        }
    };

    // ── Personnes impliquées + profils ──────────────────────────
    window.see_users_inside = async function () {
        document.body.style.overflow = "hidden";
        const popup = document.getElementById("users-inside-popup");
        const list = document.getElementById("users-inside-list");

        popup.style.display = "block";
        list.innerHTML = "<p>Chargement...</p>";

        // Chargement parallèle : kebabs + profils existants
        const [kebabsRes, personsRes] = await Promise.all([
            sb.from("KebabsData").select("users_inside").order("created_at", { ascending: false }),
            sb.from("PersonsData").select("name, avatar_color")
        ]);

        if (!kebabsRes.data?.length) {
            list.innerHTML = "<p>Aucune donnée disponible.</p>"; return;
        }

        const counts = {};
        const personColors = {};
        (personsRes.data || []).forEach(p => { personColors[p.name] = p.avatar_color; });

        kebabsRes.data.forEach(row => {
            (row.users_inside || "").split(",")
                .map(n => n.replace(/\(.*?\)/g, "").trim()).filter(Boolean)
                .forEach(name => { counts[name] = (counts[name] || 0) + 1; });
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (!sorted.length) { list.innerHTML = "<p>Aucune personne impliquée.</p>"; return; }

        list.innerHTML = sorted.map(([name, count]) => {
            const color = personColors[name] || "#555";
            const hasProfile = Boolean(personColors[name]);
            return `
                <div class="user-item">
                    <span style="display:flex;align-items:center;gap:.6rem;">
                        <span style="width:12px;height:12px;border-radius:50%;
                            background:${color};flex-shrink:0;"></span>
                        <span>
                            <strong>${escapeHtml(name)}</strong>
                            <small style="margin-left:.4rem;color:var(--muted)">
                                ${count} kebab${count > 1 ? "s" : ""}
                            </small>
                            ${hasProfile
                    ? `<small style="margin-left:.4rem;color:#4caf50">
                                       <i class="fa-solid fa-circle-check"></i> Profil existant
                                   </small>`
                    : ""}
                        </span>
                    </span>
                    <button class="user-info" title="Voir / éditer le profil"
                        onclick="openPersonProfile('${escapeHtml(name)}')">
                        <i class="fa-solid fa-id-card"></i>
                    </button>
                </div>
            `;
        }).join("");
    };

    window.openPersonProfile = async function (name) {
        const popup = document.getElementById("person-profile-popup");
        document.getElementById("person-profile-name").textContent = name;
        document.getElementById("person-physical").value = "";
        document.getElementById("person-mental").value = "";
        document.getElementById("person-friends").value = "";
        document.getElementById("person-notes").value = "";

        const defaultColor = "#c0392b";
        document.getElementById("person-avatar-color").value = defaultColor;
        document.getElementById("person-avatar-dot").style.background = defaultColor;
        document.getElementById("person-created-info").textContent = "";

        // Charger le profil existant si disponible
        const { data } = await sb
            .from("PersonsData").select("*").eq("name", name).single();

        if (data) {
            document.getElementById("person-physical").value = data.physical || "";
            document.getElementById("person-mental").value = data.mental || "";
            document.getElementById("person-friends").value = data.friends || "";
            document.getElementById("person-notes").value = data.notes || "";

            const col = data.avatar_color || defaultColor;
            document.getElementById("person-avatar-color").value = col;
            document.getElementById("person-avatar-dot").style.background = col;

            document.getElementById("person-created-info").textContent =
                `Profil créé le ${new Date(data.created_at).toLocaleString("fr-FR")} — `
                + `modifié le ${new Date(data.updated_at).toLocaleString("fr-FR")}`;
        }

        currentPersonName = name;
        popup.style.display = "block";
    };

    window.updatePersonDot = function (color) {
        document.getElementById("person-avatar-dot").style.background = color;
    };

    window.savePersonProfile = async function () {
        if (!currentPersonName) return;

        const { error } = await sb.rpc("upsert_person_profile", {
            p_name: currentPersonName,
            p_physical: document.getElementById("person-physical").value,
            p_mental: document.getElementById("person-mental").value,
            p_friends: document.getElementById("person-friends").value,
            p_notes: document.getElementById("person-notes").value,
            p_avatar_color: document.getElementById("person-avatar-color").value
        });

        if (error) { alert("Erreur : " + error.message); return; }
        alert("Profil de " + currentPersonName + " sauvegardé !");
        document.getElementById("person-profile-popup").style.display = "none";
        currentPersonName = null;
        // Rafraîchir la liste
        if (document.getElementById("users-inside-popup").style.display !== "none") {
            await see_users_inside();
        }
    };

    // ── Fermeture popups ────────────────────────────────────────
    window.closeUsersPopup = () => {
        document.body.style.overflow = "";
        document.getElementById("users-popup").style.display = "none";
    };
    window.closeUserInfoPopup = () => {
        document.getElementById("user-info-popup").style.display = "none";
    };
    window.closeTokensPopup = () => {
        document.body.style.overflow = "";
        document.getElementById("tokens-popup").style.display = "none";
    };
    window.closeKebabsAdminPopup = () => {
        document.body.style.overflow = "";
        document.getElementById("kebabs-admin-popup").style.display = "none";
    };
    window.closeKebabSharesAdminPopup = () => {
        document.getElementById("kebab-shares-admin-popup").style.display = "none";
        selectedKebabMeta = null;
    };
    window.closeUsersInsidePopup = () => {
        document.body.style.overflow = "";
        document.getElementById("users-inside-popup").style.display = "none";
    };
    window.closePersonProfilePopup = () => {
        document.getElementById("person-profile-popup").style.display = "none";
        currentPersonName = null;
    };

    // ── Maintenance ────────────────────────────────────────────
    let _maintIsOn = false;

    window.refreshMaintenanceStatus = async function () {
        const { data } = await sb
            .from("SiteSettings").select("value, updated_at, updated_by")
            .eq("key", "maintenance").single();

        _maintIsOn = data?.value === "true";
        const btn = document.getElementById("maintenance-toggle-btn");
        const label = document.getElementById("maintenance-label");
        const status = document.getElementById("maintenance-status");

        if (_maintIsOn) {
            label.textContent = "Désactiver la maintenance";
            btn.style.background = "rgba(192,57,43,.2)";
            btn.style.borderColor = "var(--red)";
            btn.style.color = "#ff8a80";
            status.innerHTML =
                `⚠️ Site en maintenance depuis le
                 ${new Date(data.updated_at).toLocaleString("fr-FR")}
                 par <em>${escapeHtml(data.updated_by)}</em>`;
        } else {
            label.textContent = "Activer la maintenance";
            btn.style.background = "";
            btn.style.borderColor = "";
            btn.style.color = "";
            status.textContent = "Site accessible normalement.";
        }
    }

    window.toggleMaintenance = async function () {
        const next = !_maintIsOn;
        const confirm = window.confirm(
            next
                ? "Activer la maintenance ? Tous les utilisateurs de rang < 5 seront bloqués."
                : "Désactiver la maintenance ? Le site redevient accessible à tous."
        );
        if (!confirm) return;

        const { error } = await sb.rpc("toggle_maintenance", { enable: next });
        if (error) { alert("Erreur : " + error.message); return; }
        await refreshMaintenanceStatus();
    };

    // ── Notifications broadcast ────────────────────────────────
    window.send_notification = async function (type = "info") {
        const labels = { info: "Info", warning: "Avertissement", error: "Urgent" };
        const msg = prompt(`Message [${labels[type]}] à envoyer à tous les utilisateurs connectés :`);
        if (!msg?.trim()) return;

        await globalThis.notifChannel.send({
            type: "broadcast",
            event: "admin_notification",
            payload: { message: msg.trim(), type }
        });
        alert("Notification envoyée !");
    };
}

checkPath(3);