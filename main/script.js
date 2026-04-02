// MAIN
import { getUserData, parseUsersInside, formatUsersDisplay, escapeHtml, deviceKey } from "../src/admin.js";
import { checkPath } from "../src/path_checker.js";

// ── État global ─────────────────────────────────────────────────
let currentKebab = null;
let currentUserData = null;
let allKebabs = [];
let allTags = [];
let activeTagFilter = "__all__";
let acTimeout = null;   // debounce autocomplete

// ── Initialisation ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    const key = deviceKey();
    if (sessionStorage.getItem(key) !== "validated") {
        location.replace("../refused.html"); return;
    }

    // 3 requêtes en parallèle
    const [userData, kebabsRes, tagsRes] = await Promise.all([
        getUserData(),
        sb.from("KebabsData")
            .select("*, KebabShares(*)")
            .order("created_at", { ascending: false }),
        sb.from("KebabTags").select("*").order("name")
    ]);

    currentUserData = userData;
    allKebabs = kebabsRes.data || [];
    allTags = tagsRes.data || [];

    document.getElementById("main-loader").classList.add("hide");
    document.body.classList.add("validated");

    if (!userData || userData.rank < 1) {
        document.getElementById("access-denied").style.display = "block";
        document.getElementById("access-loading").style.display = "none";
        return;
    }

    initFormListeners();
    initAutocomplete();
    renderTagFilter();
    renderKebabs(allKebabs);

    document.getElementById("staff-panel").style.display = "block";
    document.getElementById("access-loading").style.display = "none";

    if (userData.rank >= 3) {
        document.getElementById("admin-button").style.display = "block";
    }
});

// ── Listeners formulaire ────────────────────────────────────────
function initFormListeners() {
    document.getElementById("kebab-title-input").addEventListener("input", e => {
        document.getElementById("title-counter").textContent = `${e.target.value.length}/20`;
    });

    document.getElementById("kebab-short-desc-input").addEventListener("input", e => {
        document.getElementById("short-desc-counter").textContent =
            `${e.target.value.length}/200`;
    });

    // Prévisualisation : visible uniquement quand ya du contenu
    document.getElementById("kebab-full-desc-input").addEventListener("input", e => {
        const val = e.target.value;
        const wrapper = document.getElementById("preview-wrapper");
        const preview = document.getElementById("kebab-full-desc-preview");
        if (val.trim()) {
            wrapper.style.display = "block";
            preview.innerHTML = markdownToHtml(val);
        } else {
            wrapper.style.display = "none";
            preview.innerHTML = "";
        }
    });
}

// ── Autocomplete pour le partage d'email ────────────────────────
function initAutocomplete() {
    const input = document.getElementById("share-email-input");
    const dropdown = document.getElementById("share-email-dropdown");

    input.addEventListener("input", () => {
        clearTimeout(acTimeout);
        const val = input.value.trim();
        if (val.length < 2) { dropdown.style.display = "none"; return; }

        acTimeout = setTimeout(async () => {
            const { data } = await sb
                .from("UsersData")
                .select("email, pseudo")
                .ilike("email", `%${val}%`)
                .neq("email", currentUserData.email)
                .limit(6);

            if (!data?.length) { dropdown.style.display = "none"; return; }

            dropdown.innerHTML = data.map(u => `
                <div class="autocomplete-item"
                    onclick="selectShareEmail('${escapeHtml(u.email)}')">
                    <strong>${escapeHtml(u.pseudo || u.email)}</strong>
                    <small>${escapeHtml(u.email)}</small>
                </div>
            `).join("");
            dropdown.style.display = "block";
        }, 280);
    });

    // Fermer le dropdown si clic ailleurs
    document.addEventListener("click", e => {
        if (!e.target.closest(".autocomplete-wrapper")) {
            dropdown.style.display = "none";
        }
    });
}

window.selectShareEmail = function (email) {
    document.getElementById("share-email-input").value = email;
    document.getElementById("share-email-dropdown").style.display = "none";
};

// ── Filtre par tag ──────────────────────────────────────────────
function renderTagFilter() {
    const bar = document.getElementById("tag-filter-bar");
    bar.querySelectorAll(".tag-pill:not([data-tag='__all__'])").forEach(p => p.remove());

    for (const tag of allTags) {
        const pill = document.createElement("button");
        pill.className = "tag-pill";
        pill.dataset.tag = tag.name;
        pill.textContent = tag.name;
        pill.style.setProperty("--tag-color", tag.color);
        pill.onclick = () => filterByTag(tag.name, pill);
        bar.appendChild(pill);
    }
}

window.filterByTag = function (tagName, el) {
    activeTagFilter = tagName;
    document.querySelectorAll(".tag-pill").forEach(p => p.classList.remove("active"));
    el.classList.add("active");
    renderKebabs(tagName === "__all__"
        ? allKebabs
        : allKebabs.filter(k =>
            (k.tags || "").split(",").map(t => t.trim()).includes(tagName)
        )
    );
};

// ── Grille de kebabs ────────────────────────────────────────────
function renderKebabs(kebabs) {
    const box = document.getElementById("kebabs-box");
    box.innerHTML = "";

    if (!kebabs.length) {
        box.innerHTML = `<p class="muted" style="width:100%;text-align:center;padding:1rem;">
            Aucun kebab à afficher.</p>`;
        return;
    }

    kebabs.forEach(k => box.appendChild(createKebabFolder(k)));
}

function createKebabFolder(kebab) {
    const folder = document.createElement("div");
    folder.className = "kebab-folder";

    const tagNames = (kebab.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    const tagDots = tagNames.map(t => {
        const td = allTags.find(x => x.name === t);
        const color = td?.color || "#888";
        return `<span class="tag-dot" style="background:${color}" title="${escapeHtml(t)}"></span>`;
    }).join("");

    const publicBadge = kebab.is_public
        ? `<span class="folder-public-badge" title="Kebab public">
               <i class="fa-solid fa-globe"></i>
           </span>`
        : "";

    folder.innerHTML = `
        <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
        <div class="folder-title">${escapeHtml(kebab.title)}</div>
        ${tagDots ? `<div class="folder-tags">${tagDots}</div>` : ""}
        ${publicBadge}
    `;

    folder.addEventListener("click", () => {
        currentKebab = kebab;
        openKebabDetail(kebab);
    });

    return folder;
}

// ── Popup détail ────────────────────────────────────────────────
function openKebabDetail(kebab) {
    document.body.style.overflow = "hidden";

    const isOwner = kebab.owner_email === currentUserData.email;
    const shares = kebab.KebabShares || [];
    const myShare = shares.find(s => s.shared_with_email === currentUserData.email);
    const canEdit = isOwner || myShare?.can_edit === true;

    document.getElementById("kebab-title").textContent = kebab.title;
    document.getElementById("kebab-users").innerHTML =
        formatUsersDisplay(kebab.users_inside, kebab.users_notes);
    document.getElementById("kebab-short-desc").innerHTML =
        markdownToHtml(kebab.short_description || "");
    document.getElementById("kebab-full-desc").innerHTML =
        markdownToHtml(kebab.complete_description || "");
    document.getElementById("kebab-created").textContent =
        new Date(kebab.created_at).toLocaleString("fr-FR");
    document.getElementById("kebab-last-edit").textContent =
        new Date(kebab.last_edit_at).toLocaleString("fr-FR");

    // Tags
    const tagsEl = document.getElementById("kebab-tags-display");
    const tagNames = (kebab.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    tagsEl.innerHTML = tagNames.length
        ? tagNames.map(t => {
            const td = allTags.find(x => x.name === t);
            const color = td?.color || "#888";
            return `<span class="tag-badge"
                style="background:${color}22;border-color:${color};color:${color}">
                ${escapeHtml(t)}
            </span>`;
        }).join("")
        : `<span class="muted">Aucun tag</span>`;

    // Badge public
    const titleEl = document.getElementById("kebab-title");
    if (kebab.is_public) {
        titleEl.innerHTML =
            escapeHtml(kebab.title)
            + ` <span class="kebab-public-badge"><i class="fa-solid fa-globe"></i> Public</span>`;
    } else {
        titleEl.textContent = kebab.title;
    }

    // Boutons
    document.getElementById("open-form-kebab-btn").style.display =
        canEdit ? "inline-flex" : "none";
    document.getElementById("delete-kebab-btn").style.display =
        isOwner ? "inline-flex" : "none";

    // Section partages (propriétaire uniquement)
    const sharesSection = document.getElementById("kebab-shares-section");
    if (isOwner) {
        sharesSection.style.display = "block";
        renderSharesList(shares);
        // Reset champs partage
        document.getElementById("share-email-input").value = "";
        document.getElementById("share-can-edit").checked = false;
        document.getElementById("share-email-dropdown").style.display = "none";
    } else {
        sharesSection.style.display = "none";
    }

    document.getElementById("kebabs-popup").style.display = "flex";
}

function renderSharesList(shares) {
    const list = document.getElementById("kebab-shares-list");
    const badge = document.getElementById("shares-count");
    badge.textContent = shares.length ? `(${shares.length})` : "";

    if (!shares.length) {
        list.innerHTML = `<span class="muted">Pas encore partagé avec d'autres.</span>`;
        return;
    }

    list.innerHTML = shares.map(s => `
        <div class="share-item">
            <span class="share-email">${escapeHtml(s.shared_with_email)}</span>
            <span class="share-perm${s.can_edit ? " can-edit" : ""}">
                ${s.can_edit ? "Modification" : "Lecture seule"}
            </span>
            <button class="share-remove" onclick="removeShare('${s.id}')"
                title="Retirer le partage">×</button>
        </div>
    `).join("");
}

window.addShare = async function () {
    const email = document.getElementById("share-email-input").value.trim().toLowerCase();
    const canEdit = document.getElementById("share-can-edit").checked;

    if (!email) { alert("Veuillez entrer un email."); return; }
    if (email === currentUserData.email) {
        alert("Vous ne pouvez pas vous partager un kebab à vous-même."); return;
    }

    const { error } = await sb.from("KebabShares").insert({
        kebab_id: currentKebab.kebab_id,
        shared_with_email: email,
        created_by_email: currentUserData.email,
        can_edit: canEdit
    });

    if (error) {
        alert(error.code === "23505"
            ? "Cet email a déjà accès à ce kebab."
            : "Erreur : " + error.message);
        return;
    }

    document.getElementById("share-email-input").value = "";
    document.getElementById("share-can-edit").checked = false;
    document.getElementById("share-email-dropdown").style.display = "none";

    const { data: newShares } = await sb
        .from("KebabShares").select("*").eq("kebab_id", currentKebab.kebab_id);

    currentKebab.KebabShares = newShares || [];
    _syncKebabInCache(currentKebab);
    renderSharesList(currentKebab.KebabShares);
};

window.removeShare = async function (shareId) {
    if (!confirm("Retirer ce partage ?")) return;
    const { error } = await sb.from("KebabShares").delete().eq("id", shareId);
    if (error) { alert("Erreur : " + error.message); return; }
    currentKebab.KebabShares = (currentKebab.KebabShares || []).filter(s => s.id !== shareId);
    _syncKebabInCache(currentKebab);
    renderSharesList(currentKebab.KebabShares);
};

function _syncKebabInCache(kebab) {
    const idx = allKebabs.findIndex(k => k.kebab_id === kebab.kebab_id);
    if (idx >= 0) allKebabs[idx] = kebab;
}

window.closeKebabPopup = function () {
    document.body.style.overflow = "";
    document.getElementById("kebabs-popup").style.display = "none";
    currentKebab = null;
};

// ── Formulaire création/édition ─────────────────────────────────
window.openKebabForm = function (action) {
    document.getElementById("form-title").textContent =
        action === "add" ? "Nouveau Kebab" : "Modifier le Kebab";

    // Réinitialiser la prévisualisation
    document.getElementById("preview-wrapper").style.display = "none";

    if (action === "add") {
        document.getElementById("kebab-title-input").value = "";
        document.getElementById("kebab-users-input").value = "";
        document.getElementById("kebab-short-desc-input").value = "";
        document.getElementById("kebab-full-desc-input").value = "";
        document.getElementById("kebab-is-public").checked = false;
        document.getElementById("title-counter").textContent = "0/20";
        document.getElementById("short-desc-counter").textContent = "0/200";
        renderTagCheckboxes([]);
    } else {
        const k = currentKebab;

        // Reconstituer "Prénom (note)" pour l'édition
        let notesObj = {};
        try { notesObj = JSON.parse(k.users_notes || "{}"); } catch { /* */ }
        const rawUsers = (k.users_inside || "").split(", ").filter(Boolean).map(name => {
            const note = notesObj[name.trim()];
            return note ? `${name} (${note})` : name;
        }).join(", ");

        document.getElementById("kebab-title-input").value = k.title || "";
        document.getElementById("kebab-users-input").value = rawUsers;
        document.getElementById("kebab-short-desc-input").value = k.short_description || "";
        document.getElementById("kebab-full-desc-input").value = k.complete_description || "";
        document.getElementById("kebab-is-public").checked = k.is_public || false;
        document.getElementById("title-counter").textContent = `${(k.title || "").length}/20`;
        document.getElementById("short-desc-counter").textContent =
            `${(k.short_description || "").length}/200`;

        // Prévisualisation si ya du contenu
        if (k.complete_description?.trim()) {
            document.getElementById("preview-wrapper").style.display = "block";
            document.getElementById("kebab-full-desc-preview").innerHTML =
                markdownToHtml(k.complete_description);
        }

        const selectedTags = (k.tags || "").split(",").map(t => t.trim()).filter(Boolean);
        renderTagCheckboxes(selectedTags);
    }

    document.getElementById("kebabs-popup").style.display = "none";
    document.getElementById("kebabs-form").style.display = "flex";
};

function renderTagCheckboxes(selectedTags) {
    const container = document.getElementById("tags-checkboxes");
    container.innerHTML = "";

    for (const tag of allTags) {
        const label = document.createElement("label");
        label.className = "tag-checkbox-label";
        label.style.setProperty("--tag-color", tag.color);

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = tag.name;
        cb.checked = selectedTags.includes(tag.name);

        label.appendChild(cb);
        label.appendChild(document.createTextNode(tag.name));
        container.appendChild(label);
    }
}

function getSelectedTags() {
    return [...document.querySelectorAll("#tags-checkboxes input:checked")]
        .map(cb => cb.value);
}

window.createTag = async function () {
    const name = document.getElementById("new-tag-name").value.trim();
    const color = document.getElementById("new-tag-color").value;

    if (!name) { alert("Nom de tag requis."); return; }
    if (name.length > 20) { alert("Maximum 20 caractères."); return; }

    const { data, error } = await sb.from("KebabTags")
        .insert({ name, color, created_by: currentUserData.email })
        .select().single();

    if (error) {
        alert(error.code === "23505" ? "Ce tag existe déjà." : "Erreur : " + error.message);
        return;
    }

    allTags.push(data);
    allTags.sort((a, b) => a.name.localeCompare(b.name));
    document.getElementById("new-tag-name").value = "";

    const currentSelected = getSelectedTags();
    renderTagCheckboxes([...currentSelected, data.name]);
    renderTagFilter();
};

window.saveKebab = async function () {
    const title = document.getElementById("kebab-title-input").value.trim();
    const rawUsers = document.getElementById("kebab-users-input").value.trim();
    const shortDesc = document.getElementById("kebab-short-desc-input").value.trim();
    const fullDesc = document.getElementById("kebab-full-desc-input").value.trim();
    const tagsStr = getSelectedTags().join(",");
    const isPublic = document.getElementById("kebab-is-public").checked;

    if (!title || !rawUsers || !fullDesc) {
        alert("Veuillez remplir tous les champs obligatoires (titre, personnes, description).");
        return;
    }

    const { names, notes } = parseUsersInside(rawUsers);

    const payload = {
        title,
        users_inside: names,
        users_notes: notes,
        short_description: shortDesc,
        complete_description: fullDesc,
        tags: tagsStr,
        is_public: isPublic
    };

    if (currentKebab === null) {
        const { error } = await sb.from("KebabsData").insert({
            ...payload, owner_email: currentUserData.email
        });
        if (error) { alert("Erreur lors de la création : " + error.message); return; }
    } else {
        const { error } = await sb.from("KebabsData")
            .update({ ...payload, last_edit_at: new Date().toISOString() })
            .eq("kebab_id", currentKebab.kebab_id);
        if (error) { alert("Erreur lors de la modification : " + error.message); return; }
    }

    alert("Kebab enregistré.");
    currentKebab = null;
    document.getElementById("kebabs-form").style.display = "none";
    window.location.reload();
};

window.deleteKebab = async function () {
    if (!confirm(`Supprimer "${currentKebab.title}" définitivement ?`)) return;
    const { error } = await sb.from("KebabsData")
        .delete().eq("kebab_id", currentKebab.kebab_id);
    if (error) { alert("Erreur : " + error.message); return; }
    alert("Kebab supprimé.");
    closeKebabPopup();
    window.location.reload();
};

window.closeKebabForm = function () {
    document.getElementById("kebabs-form").style.display = "none";
};

window.redirect = function () {
    window.location.href = "../admin/index.html";
};

// ── Markdown → HTML ─────────────────────────────────────────────
function markdownToHtml(text) {
    if (!text) return "";
    return text
        .replace(/\[color=(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\]([\s\S]*?)\[\/color\]/g,
            "<span class='markdown color' style='color:$1'>$2</span>")
        .replace(/\[box=(info|warning|success|error)\]([\s\S]*?)\[\/box\]/g,
            "<div class='markdown box $1'>$2</div>")
        .replace(/(?<!\\)==([^=]+)==/g, "<span class='markdown highlight'>$1</span>")
        .replace(/(?<!\\)!!([^!]+)!!/g, "<span class='markdown warning'>$1</span>")
        .replace(/(?<!\\)~~([^~]+)~~/g, "<span class='markdown strike'>$1</span>")
        .replace(/(?<!\\)`([^`]+)`/g, "<span class='markdown code'>$1</span>")
        .replace(/(?<!\\)\*\*([^*]+)\*\*/g, "<span class='markdown bold'>$1</span>")
        .replace(/(?<!\\)__([^_]+)__/g, "<span class='markdown underline'>$1</span>")
        .replace(/(?<!\\)\*([^*]+)\*/g, "<span class='markdown italic'>$1</span>")
        .replace(/\(\(([^)]+)\)\)/g, "<span class='markdown muted'>$1</span>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g,
            "<a href='$2' target='_blank' rel='noopener noreferrer' class='markdown link'>$1</a>")
        .replace(/\n/g, "<br>")
        .replace(/\\([*_`~!=[\]()])/g, "$1");
}

checkPath(1);