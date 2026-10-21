document.addEventListener("DOMContentLoaded", () => {
    if (!(["localhost", "127.0.0.1", "::1", "[::1]"].includes(window.location.hostname.toLowerCase()))) return;
    Promise.all([window.LapinousContentReady || Promise.resolve(), window.LapinousPuzzlesReady || Promise.resolve(), window.LapinousShopReady || Promise.resolve()]).then(() => {
    // Modifier la visibilité locale ; l’export du contenu applique ces choix au site publié.
    const visibilitySection=document.createElement('section');visibilitySection.className='dash-section';
    visibilitySection.innerHTML='<h2>Visibilité du jeu</h2><p>Visible pour tous, réservé à l’administration locale ou masqué. Exporte le contenu JSON pour publier ces choix.</p><div id="visibilitySettings" class="dash-form"></div>';
    document.querySelector('main').prepend(visibilitySection);
    function renderVisibility(){const settings=window.LapinousVisibility.get();document.getElementById('visibilitySettings').innerHTML=Object.entries(window.LapinousVisibility.definitions).map(([key,def])=>'<label>'+def[0]+' <select data-visibility="'+key+'">'+[['public','Visible pour tous'],['admin','Admin local uniquement'],['hidden','Masqué']].map(([value,label])=>'<option value="'+value+'" '+(settings[key]===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label>').join('');}
    renderVisibility();
    visibilitySection.addEventListener('change',event=>{const key=event.target.dataset.visibility;if(key)window.LapinousVisibility.save({...window.LapinousVisibility.get(),[key]:event.target.value});});
    const toastContainer = document.getElementById("toastContainer");

    function showToast(message, type = "") {
        const el = document.createElement("div");
        el.className = "toast" + (type ? " " + type : "");
        el.textContent = message;
        el.title = "Cliquer pour fermer";
        el.style.cursor = "pointer";
        el.style.pointerEvents = "auto";
        const dismiss = () => { el.classList.add("toast-leaving"); setTimeout(() => el.remove(), 260); };
        el.addEventListener("click", dismiss);
        toastContainer.appendChild(el);
        // Durée : 30 s pour un message court, 50 s pour un message long
        setTimeout(dismiss, String(message).length > 60 ? 50000 : 30000);
    }

    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }

    // Aperçu immédiat de la photo choisie, avant même d'enregistrer, pour
    // vérifier qu'elle convient (pas besoin de sauvegarder pour la voir).
    window.previewRowImage = function (input) {
        const img = input.parentElement.querySelector(".file-preview");
        if (!img) return;
        const file = input.files[0];
        if (!file) { img.style.display = "none"; return; }
        img.src = URL.createObjectURL(file);
        img.style.display = "block";
    };

    function renderDashboard() {
        const rates = loadEggRates();
        ["commun", "rare", "epique", "legendaire", "mythique", "divin"].forEach((r) => {
            const input = document.getElementById("rate-" + r);
            if (input) input.value = rates[r];
        });
        const windows = loadEventWindows();
        ["halloween", "noel", "paques", "nouvel_an_chinois"].forEach((e) => {
            const input = document.getElementById("window-" + e);
            if (input) input.value = windows[e];
        });
        renderSpeciesTable();
        renderBossTable();
        renderPuzzleAdmin();
        renderCharts();
    }

    function origin(key, isOverride, isAz) {
        return isOverride ? "modifié localement" : isAz ? "code" : "lapinous-content.json";
    }

    // ---- Tableau des lapins ----
    // Disponibilité saisonnière : "aucun" = toujours dispo, sinon uniquement
    // pendant la ou les périodes cochées (voir currentActiveEvents() dans script.js,
    // qui applique exactement les mêmes règles pour les joueurs).
    const EVENT_OPTIONS = [
        { value: "", label: "Aucun (toujours dispo)" },
        { value: "halloween", label: "🎃 Halloween uniquement" },
        { value: "noel", label: "🎄 Noël uniquement" },
        { value: "paques", label: "🐣 Pâques uniquement" },
        { value: "nouvel_an_chinois", label: "🏮 Nouvel An chinois uniquement" },
        { value: "paques,noel", label: "🐣🎄 Pâques + Noël (légendes)" },
    ];
    function speciesEventValue(s) {
        if (!s || !s.event) return "";
        return Array.isArray(s.event) ? s.event.join(",") : s.event;
    }

    function speciesRowHtml(key, s) {
        const img = (s && (s.faceImg || s.coteImg)) || "./assets/img/lapins_jouables/sans_evenements/mystery.svg";
        return `
            <td><img src="${img}" class="row-thumb" onerror="this.onerror=null;this.src='./assets/img/lapins_jouables/sans_evenements/mystery.svg';">
                <label class="file-preview-wrap"><input type="text" data-field="faceImg" aria-label="Chemin image de face" value="${html(s?.faceImg || img)}"><img class="file-preview" alt="aperçu face" style="display:none;"></label>
                <label class="file-preview-wrap"><input type="text" data-field="coteImg" aria-label="Chemin image trois quarts" value="${html(s?.coteImg || s?.faceImg || img)}"><img class="file-preview" alt="aperçu 3/4" style="display:none;"></label></td>
            <td><input type="text" data-field="key" value="${key || ""}" ${key ? "readonly" : ""} placeholder="identifiant"></td>
            <td><input type="text" data-field="name" value="${s?.name || ""}"></td>
            <td><input type="text" data-field="nickname" value="${s?.nickname || ""}"></td>
            <td>
                <span class="rarity-dot" style="background:${RARITY_META[s?.rarity || "commun"].color};"></span>
                <select data-field="rarity" onchange="this.previousElementSibling.style.background=({commun:'#b8bcc4',rare:'#6ebf77',epique:'#5b8fd6',legendaire:'#a35bd6',mythique:'#f5c34d',divin:'#d64545'})[this.value]||'#b8bcc4';">
                    ${["commun", "rare", "epique", "legendaire", "mythique", "divin"].map((r) => `<option value="${r}" ${s?.rarity === r ? "selected" : ""}>${RARITY_META[r].label}</option>`).join("")}
                </select>
            </td>
            <td><select data-field="event">
                    ${EVENT_OPTIONS.map((opt) => `<option value="${opt.value}" ${speciesEventValue(s) === opt.value ? "selected" : ""}>${opt.label}</option>`).join("")}
                </select></td>
            <td><textarea data-field="personality">${s?.personality || ""}</textarea></td>
            <td><textarea data-field="story">${s?.story || ""}</textarea></td>
            <td><input type="text" data-field="accessory" value="${s?.accessory || ""}"></td>
            <td><input type="text" data-field="likes" value="${(s?.likes || []).join(", ")}"></td>
            <td><input type="text" data-field="dislikes" value="${(s?.dislikes || []).join(", ")}"></td>
            <td><input type="text" data-field="quote" value="${s?.quote || ""}"></td>
            <td><textarea data-field="power">${s?.power || ""}</textarea></td>
            <td class="row-actions">
                <button class="slot-btn save" data-save-species>${key ? "💾" : "➕ Ajouter"}</button>
                ${key && key !== "az" ? `<button class="slot-btn clear" data-undo-species="${key}">↩️</button>` : ""}
            </td>`;
    }

    function readRowValues(tr, textareaFields = []) {
        const values = {};
        tr.querySelectorAll("[data-field]").forEach((el) => {
            const field = el.dataset.field;
            if (el.type === "file") { values[field] = el.files[0] || null; return; }
            values[field] = el.value;
        });
        return values;
    }

    function renderSpeciesTable() {
        const custom = loadCustomSpecies();
        const tbody = document.getElementById("speciesTableBody");
        tbody.innerHTML = "";
        Object.entries(getSpecies())
            .sort((a, b) => a[1].name.localeCompare(b[1].name))
            .forEach(([key, s]) => {
                const tr = document.createElement("tr");
                tr.dataset.key = key;
                tr.title = `Origine : ${origin(key, !!custom[key], key === "az")}`;
                tr.dataset.search = [key, s.name, s.nickname, s.rarity, speciesEventValue(s), s.personality, s.story, s.accessory, s.quote, s.power, (s.likes || []).join(" "), (s.dislikes || []).join(" ")].join(" ").toLowerCase();
                tr.innerHTML = speciesRowHtml(key, s);
                tbody.appendChild(tr);
            });
        // Ligne vide pour ajouter un nouveau lapin
        const newTr = document.createElement("tr");
        newTr.className = "new-row";
        newTr.innerHTML = speciesRowHtml("", null);
        tbody.appendChild(newTr);

        tbody.querySelectorAll("[data-save-species]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const tr = btn.closest("tr");
                const v = readRowValues(tr);
                const key = (v.key || "").trim().replace(/\s+/g, "_");
                if (!key) { showToast("Il faut un identifiant pour ce lapin.", "warn"); return; }
                const existing = getSpecies()[key];
                let faceImg = existing?.faceImg || "./assets/img/lapins_jouables/sans_evenements/mystery.svg";
                let coteImg = existing?.coteImg || faceImg;
                if (v.faceImg) faceImg = v.faceImg.trim();
                if (v.coteImg) coteImg = v.coteImg.trim();
                const entry = {
                    ...existing,
                    name: v.name.trim() || key,
                    nickname: v.nickname.trim(),
                    rarity: v.rarity,
                    event: v.event ? (v.event.includes(",") ? v.event.split(",") : v.event) : null,
                    personality: v.personality.trim(),
                    story: v.story.trim(),
                    accessory: v.accessory.trim(),
                    likes: v.likes.split(",").map((s) => s.trim()).filter(Boolean),
                    dislikes: v.dislikes.split(",").map((s) => s.trim()).filter(Boolean),
                    quote: v.quote.trim(),
                    power: v.power.trim(),
                    faceImg, coteImg,
                };
                if (!entry.event) delete entry.event;
                const c = loadCustomSpecies();
                c[key] = entry;
                localStorage.setItem(CUSTOM_SPECIES_KEY, JSON.stringify(c));
                renderDashboard();
                showToast(`Lapin "${entry.name}" enregistré ✅`, "success");
            });
        });
        tbody.querySelectorAll("[data-undo-species]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const c = loadCustomSpecies();
                delete c[btn.dataset.undoSpecies];
                localStorage.setItem(CUSTOM_SPECIES_KEY, JSON.stringify(c));
                renderDashboard();
                showToast("Modification locale annulée.");
            });
        });
    }

    // ---- Tableau des boss ----
    function bossRowHtml(key, b) {
        const img = (b && (b.faceImg || b.coteImg)) || "./assets/img/lapins_jouables/sans_evenements/mystery.svg";
        const personality = b ? (Array.isArray(b.personality) ? b.personality.join(", ") : b.personality || "") : "";
        return `
            <td><img src="${img}" class="row-thumb" onerror="this.onerror=null;this.src='./assets/img/lapins_jouables/sans_evenements/mystery.svg';">
                <label class="file-preview-wrap"><input type="text" data-field="faceImg" aria-label="Chemin image de face" value="${html(b?.faceImg || img)}"><img class="file-preview" alt="aperçu face" style="display:none;"></label>
                <label class="file-preview-wrap"><input type="text" data-field="coteImg" aria-label="Chemin image trois quarts" value="${html(b?.coteImg || b?.faceImg || img)}"><img class="file-preview" alt="aperçu 3/4" style="display:none;"></label></td>
            <td><input type="text" data-field="key" value="${key || ""}" ${key ? "readonly" : ""} placeholder="identifiant"></td>
            <td><input type="text" data-field="name" value="${b?.name || ""}"></td>
            <td><input type="text" data-field="nickname" value="${b?.nickname || ""}"></td>
            <td><input type="text" data-field="rang" value="${b?.rang || ""}"></td>
            <td><textarea data-field="story">${b?.story || ""}</textarea></td>
            <td><input type="text" data-field="arme" value="${b?.arme || ""}"></td>
            <td><input type="text" data-field="personality" value="${personality}"></td>
            <td><input type="text" data-field="likes" value="${(b?.likes || []).join(", ")}"></td>
            <td><input type="text" data-field="dislikes" value="${(b?.dislikes || []).join(", ")}"></td>
            <td><input type="text" data-field="quote" value="${b?.quote || ""}"></td>
            <td><textarea data-field="power">${b?.power || ""}</textarea></td>
            <td><input type="number" data-field="difficulty" value="${b?.difficulty ?? ""}" min="1"></td>
            <td class="row-actions">
                <button class="slot-btn save" data-save-boss>${key ? "💾" : "➕ Ajouter"}</button>
                ${key ? `<button class="slot-btn clear" data-undo-boss="${key}">↩️</button>` : ""}
            </td>`;
    }

    function renderBossTable() {
        const customBosses = loadCustomBosses();
        const tbody = document.getElementById("bossTableBody");
        tbody.innerHTML = "";
        Object.entries(getBosses())
            .sort((a, b) => (a[1].difficulty || 0) - (b[1].difficulty || 0))
            .forEach(([key, b]) => {
                const tr = document.createElement("tr");
                tr.dataset.key = key;
                tr.title = `Origine : ${origin(key, !!customBosses[key], false)}`;
                tr.innerHTML = bossRowHtml(key, b);
                tbody.appendChild(tr);
            });
        const newTr = document.createElement("tr");
        newTr.className = "new-row";
        newTr.innerHTML = bossRowHtml("", null);
        tbody.appendChild(newTr);

        tbody.querySelectorAll("[data-save-boss]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const tr = btn.closest("tr");
                const v = readRowValues(tr);
                const key = (v.key || "").trim().replace(/\s+/g, "_");
                if (!key) { showToast("Il faut un identifiant pour ce boss.", "warn"); return; }
                const existing = getBosses()[key];
                let faceImg = existing?.faceImg || "./assets/img/lapins_jouables/sans_evenements/mystery.svg";
                let coteImg = existing?.coteImg || faceImg;
                if (v.faceImg) faceImg = v.faceImg.trim();
                if (v.coteImg) coteImg = v.coteImg.trim();
                const entry = {
                    name: v.name.trim() || key,
                    nickname: v.nickname.trim(),
                    rang: v.rang.trim(),
                    story: v.story.trim(),
                    arme: v.arme.trim(),
                    personality: v.personality.split(",").map((s) => s.trim()).filter(Boolean),
                    likes: v.likes.split(",").map((s) => s.trim()).filter(Boolean),
                    dislikes: v.dislikes.split(",").map((s) => s.trim()).filter(Boolean),
                    quote: v.quote.trim(),
                    power: v.power.trim(),
                    difficulty: parseInt(v.difficulty, 10) || 20,
                    faceImg, coteImg,
                    friends: existing?.friends || [], rivals: existing?.rivals || [],
                };
                const c = loadCustomBosses();
                c[key] = entry;
                localStorage.setItem(CUSTOM_BOSSES_KEY, JSON.stringify(c));
                renderDashboard();
                showToast(`Boss "${entry.name}" enregistré ✅`, "success");
            });
        });
        tbody.querySelectorAll("[data-undo-boss]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const c = loadCustomBosses();
                delete c[btn.dataset.undoBoss];
                localStorage.setItem(CUSTOM_BOSSES_KEY, JSON.stringify(c));
                renderDashboard();
                showToast("Modification locale annulée.");
            });
        });
    }

    document.getElementById("saveEggRatesBtn").addEventListener("click", () => {
        const rates = {
            commun: parseFloat(document.getElementById("rate-commun").value) || 0,
            rare: parseFloat(document.getElementById("rate-rare").value) || 0,
            epique: parseFloat(document.getElementById("rate-epique").value) || 0,
            legendaire: parseFloat(document.getElementById("rate-legendaire").value) || 0,
            mythique: parseFloat(document.getElementById("rate-mythique").value) || 0,
            divin: parseFloat(document.getElementById("rate-divin").value) || 0,
        };
        const total = Object.values(rates).reduce((sum, value) => sum + value, 0);
        if (Math.abs(total - 100) > 0.5) {
            showToast(`Le total doit faire 100% (actuellement ${total}%).`, "warn");
            return;
        }
        saveEggRates(rates);
        showToast("Taux d'apparition des œufs mis à jour ✅", "success");
    });

    document.getElementById("saveEventWindowsBtn").addEventListener("click", () => {
        const windows = {
            halloween: parseInt(document.getElementById("window-halloween").value, 10) || 0,
            noel: parseInt(document.getElementById("window-noel").value, 10) || 0,
            paques: parseInt(document.getElementById("window-paques").value, 10) || 0,
            nouvel_an_chinois: parseInt(document.getElementById("window-nouvel_an_chinois").value, 10) || 0,
        };
        saveEventWindows(windows);
        showToast("Durées des événements mises à jour ✅", "success");
    });


    // ---- Export/Import du CONTENU (lapins + boss + taux d'œufs) ----
    // Contient TOUT (le contenu de base + tes modifications locales), pas
    // seulement les extras. C'est ce fichier qu'il faut déposer à la racine
    // du projet sous le nom "lapinous-content.json" pour que tous les
    // joueurs voient tes changements. Volontairement séparé de la
    // sauvegarde du joueur : aucune donnée de progression ici.
    document.getElementById("exportContentBtn").addEventListener("click", async () => {
        const bundle = {
            type: "lapinous-content",
            exportedAt: Date.now(),
            species: getSpecies(),
            bosses: getBosses(),
            opponents: Object.fromEntries(Object.entries(getOpponents()).filter(([,enemy])=>enemy.kind === "vegetable")),
            eggRates: loadEggRates(),
            eventWindows: loadEventWindows(),
            visibility: window.LapinousVisibility.get(),
        };
        delete bundle.species.az; // Azazel reste géré par le code, pas par le contenu
        try { const mode=await window.LapinousLocalFiles.exportJSON('lapinous-content.json',bundle);showToast(mode==='written'?'Contenu enregistré dans le projet. Recharge le jeu.':'Contenu téléchargé.','success'); } catch(error){if(error.name!=='AbortError')showToast(error.message,'warn');}
    });

    document.getElementById("importContentInput").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const bundle = JSON.parse(reader.result);
                const species = bundle.species || bundle.customSpecies; // compat anciens exports
                const bosses = bundle.bosses || bundle.customBosses;
                if (bundle.opponents) localStorage.setItem("lapinous_custom_opponents", JSON.stringify(bundle.opponents));
                if (species) localStorage.setItem(CUSTOM_SPECIES_KEY, JSON.stringify(species));
                if (bosses) localStorage.setItem(CUSTOM_BOSSES_KEY, JSON.stringify(bosses));
                if (bundle.visibility) { window.LapinousVisibility.save(bundle.visibility); renderVisibility(); }
                if (bundle.eggRates) saveEggRates(bundle.eggRates);
                if (bundle.eventWindows) saveEventWindows(bundle.eventWindows);
                renderDashboard();
                showToast("Contenu importé avec succès ✨ (visible ici, pense à réexporter pour lapinous-content.json)", "success");
            } catch (err) {
                showToast("Fichier de contenu invalide.", "warn");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    });


    // ============================================================
    // PUZZLES — tableau + menu déroulant illustré pour lier X lapins
    // ============================================================
    function puzzleSpeciesDropdown(selected = []) {
        const set = new Set(selected || []);
        const options = Object.entries(getSpecies())
            .filter(([key, sp]) => !sp.hidden || key === "az")
            .sort((a, b) => (a[1].name || a[0]).localeCompare(b[1].name || b[0]))
            .map(([key, sp]) => {
                const img = sp.faceImg || sp.coteImg || "./assets/img/lapins_jouables/sans_evenements/mystery.svg";
                return `<label class="puzzle-species-option">
                    <input type="checkbox" value="${key}" ${set.has(key) ? "checked" : ""}>
                    <img src="${img}" alt="" onerror="this.onerror=null;this.src='./assets/img/lapins_jouables/sans_evenements/mystery.svg';">
                    <span><strong>${sp.name || key}</strong><small>${key}</small></span>
                </label>`;
            }).join("");
        return `<details class="puzzle-species-dropdown">
            <summary>🐰 ${set.size} lapin${set.size > 1 ? "s" : ""} lié${set.size > 1 ? "s" : ""} — choisir</summary>
            <div class="puzzle-species-menu">${options}</div>
        </details>`;
    }

    const PUZZLE_EVENT_CHOICES = [
        { value: "nouvel_an_chinois", label: "🏮 Nouvel An chinois" },
        { value: "halloween", label: "🎃 Halloween" },
        { value: "noel", label: "🎄 Noël" },
        { value: "paques", label: "🐣 Pâques" },
    ];
    // Valeur de l'événement d'un puzzle (mêmes règles que puzzleEvents() dans script.js)
    function puzzleEventValue(puz) {
        let ev = puz.event;
        if (ev === undefined || ev === null) {
            if (puz.id === "reve") ev = ["noel", "halloween", "paques"];
            else if (puz.id === "noel") ev = "noel";
            else if (["pacques", "paques"].includes(puz.id)) ev = "paques";
            else if (["halloween", "fantome", "frankenstein", "lapin-bete", "squelette", "vampire-vs-nonne"].includes(puz.id)) ev = "halloween";
            else ev = "";
        }
        const list = (Array.isArray(ev) ? ev : String(ev).split(/[,+]/)).map((e) => String(e).trim().toLowerCase().replace("pacques", "paques")).filter(Boolean);
        return list.join(",");
    }

    // Une carte garde l’illustration lisible et rassemble les champs du même puzzle.
    function puzzleAdminRow(puz,index){
        return `<details class="puzzle-admin-card" data-puzzle-index="${index}"><summary class="catalog-card-summary">
            <img class="puzzle-admin-cover" src="${puz.image || './assets/img/lapins_jouables/sans_evenements/mystery.svg'}" alt="${puz.title || ''}" loading="lazy"><strong>${puz.title || puz.id}</strong></summary>
            <div class="puzzle-admin-fields"><button type="button" class="catalog-card-return" onclick="this.parentElement.parentElement.open=false">↩ Retour à l’image</button><label>Titre<input class="name-input" data-puzzle-field="title" value="${puz.title || ''}"></label>
            <label>Identifiant<input class="name-input" data-puzzle-field="id" value="${puz.id || ''}"></label>
            <label>Image<input class="name-input" data-puzzle-field="image" value="${puz.image || ''}"></label>
            <details class="puzzle-admin-events"><summary>Événements</summary>${PUZZLE_EVENT_CHOICES.map(opt=>`<label><input type="checkbox" data-puzzle-event value="${opt.value}" ${puzzleEventValue(puz).split(',').includes(opt.value)?'checked':''}>${opt.label}</label>`).join('')}<small>Rien coché : toujours disponible</small></details>
            ${puzzleSpeciesDropdown(puz.linkedSpecies)}
            <div class="puzzle-card-actions"><button class="slot-btn save" data-save-puzzle>💾 Enregistrer</button><button class="slot-btn clear" data-delete-puzzle>🗑️ Supprimer</button></div></div></details>`;
    }

    function renderPuzzleAdmin() {
        const box = document.getElementById("puzzleAdminList");
        if (!box || !window.getPuzzleCatalog) return;
        const puzzles = window.getPuzzleCatalog() || [];
        box.innerHTML = puzzles.length ? '<label class="puzzle-event-filter">Événement <select id="puzzleEventFilter"><option value="">Tous</option><option value="none">Sans événement</option>'+PUZZLE_EVENT_CHOICES.map(opt=>'<option value="'+opt.value+'">'+opt.label+'</option>').join('')+'</select></label><div class="puzzle-admin-cards">'+puzzles.map(puzzleAdminRow).join('')+'</div>' : '<p class="dash-note">Aucun puzzle pour le moment.</p>';

        box.querySelector('#puzzleEventFilter')?.addEventListener('change',event=>{box.querySelectorAll('[data-puzzle-index]').forEach(card=>{const events=puzzleEventValue(puzzles[Number(card.dataset.puzzleIndex)]).split(',').filter(Boolean);card.hidden=event.target.value==='none'?events.length>0:Boolean(event.target.value)&&!events.includes(event.target.value);});});
        box.querySelectorAll('[data-save-puzzle]').forEach((btn) => btn.addEventListener('click', () => {
            const row = btn.closest('[data-puzzle-index]');
            const idx = Number(row.dataset.puzzleIndex);
            const list = [...(window.getPuzzleCatalog() || [])];
            const current = { ...(list[idx] || {}) };
            row.querySelectorAll('[data-puzzle-field]').forEach((el) => current[el.dataset.puzzleField] = el.value.trim());
            current.event = Array.from(row.querySelectorAll('[data-puzzle-event]:checked')).map((el) => el.value).join(',');
            current.linkedSpecies = Array.from(row.querySelectorAll('.puzzle-species-menu input:checked')).map((el) => el.value);
            if (!current.id) { showToast('Il faut un identifiant de puzzle.', 'warn'); return; }
            list[idx] = current;
            window.saveCustomPuzzles(list);
            renderPuzzleAdmin();
            showToast(`Puzzle "${current.title || current.id}" enregistré ✅`, 'success');
        }));
        box.querySelectorAll('[data-delete-puzzle]').forEach((btn) => btn.addEventListener('click', () => {
            const row = btn.closest('[data-puzzle-index]');
            const idx = Number(row.dataset.puzzleIndex);
            const list = [...(window.getPuzzleCatalog() || [])];
            const removed = list.splice(idx, 1)[0];
            window.saveCustomPuzzles(list);
            renderPuzzleAdmin();
            showToast(`Puzzle "${removed?.title || removed?.id || ''}" supprimé.`);
        }));
        box.querySelectorAll('.puzzle-species-menu input').forEach((cb) => cb.addEventListener('change', () => {
            const details = cb.closest('.puzzle-species-dropdown');
            const count = details.querySelectorAll('input:checked').length;
            details.querySelector('summary').textContent = `🐰 ${count} lapin${count > 1 ? 's' : ''} lié${count > 1 ? 's' : ''} — choisir`;
        }));
    }

    document.getElementById('addPuzzleBtn')?.addEventListener('click', () => {
        const list = [...(window.getPuzzleCatalog() || [])];
        list.push({ id: `puzzle_${Date.now()}`, title: 'Nouveau puzzle', image: './assets/img/puzzle/', event: '', linkedSpecies: [] });
        window.saveCustomPuzzles(list);
        renderPuzzleAdmin();
    });

    document.getElementById('exportPuzzlesBtn')?.addEventListener('click', async () => {
        const bundle = { type: 'lapinous-puzzles', version: 1, levels: window.getPuzzleLevels ? window.getPuzzleLevels() : [], puzzles: window.getPuzzleCatalog ? window.getPuzzleCatalog() : [] };
        try{const mode=await window.LapinousLocalFiles.exportJSON('lapinous-puzzles.json',bundle);showToast(mode==='written'?'Puzzles enregistrés dans le projet.':'Puzzles téléchargés.','success');}catch(error){if(error.name!=='AbortError')showToast(error.message,'warn');}
    });

    document.getElementById('importPuzzlesInput')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { try {
            const data = JSON.parse(reader.result);
            if (!Array.isArray(data.puzzles)) throw new Error('puzzles manquants');
            window.saveCustomPuzzles(data.puzzles);
            if (Array.isArray(data.levels)) window.saveCustomPuzzleLevels(data.levels);
            renderPuzzleAdmin(); showToast('Puzzles importés ✅', 'success');
        } catch (err) { showToast('Fichier de puzzles invalide.', 'warn'); } };
        reader.readAsText(file); e.target.value = '';
    });

    document.getElementById('resetPuzzlesBtn')?.addEventListener('click', () => {
        window.clearCustomPuzzles?.();
        renderPuzzleAdmin();
        showToast("Modifications locales des puzzles annulées.");
    });

    // ---- Sécurité : changer le code du Dashboard ----
    document.getElementById("changeCodeForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target;
        const code1 = f.newCode.value.trim();
        const code2 = f.newCode2.value.trim();
        if (code1.length < 4) { showToast("Le code doit faire au moins 4 caractères.", "warn"); return; }
        if (code1 !== code2) { showToast("Les deux codes ne correspondent pas.", "warn"); return; }
        await window.LapinousDashboardAccess.changeDashboardCode(code1);
        f.reset();
        showToast("Code du Dashboard mis à jour ✅", "success");
    });

    // ============================================================
    // CAMEMBERTS (Chart.js)
    // ============================================================
    const PALETTE = ["#d8c89c", "#e0b254", "#9db88a", "#88b6d8", "#a68fbf", "#b3815a", "#7f6850"];
    const chartInstances = {};

    let lastClickedSlice = {};
    function drawPie(canvasId, labels, data, groups, colors) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || typeof Chart === "undefined") return;
        if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
        lastClickedSlice[canvasId] = null;
        hideSliceDetail(canvasId);
        chartInstances[canvasId] = new Chart(ctx, {
            type: "pie",
            data: { labels, datasets: [{ data, backgroundColor: colors || PALETTE }] },
            options: {
                plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } } },
                onClick: (evt, elements) => {
                    if (!groups || elements.length === 0) return;
                    const idx = elements[0].index;
                    if (lastClickedSlice[canvasId] === idx) {
                        lastClickedSlice[canvasId] = null;
                        hideSliceDetail(canvasId);
                        return;
                    }
                    lastClickedSlice[canvasId] = idx;
                    showSliceDetail(canvasId, labels[idx], groups[idx] || []);
                },
                onHover: (evt, elements) => {
                    evt.native.target.style.cursor = groups && elements.length ? "pointer" : "default";
                },
            },
        });
    }

    function hideSliceDetail(canvasId) {
        const box = document.getElementById("detail-" + canvasId);
        if (box) box.style.display = "none";
    }

    function showSliceDetail(canvasId, label, items) {
        const box = document.getElementById("detail-" + canvasId);
        if (!box) return;
        box.innerHTML = items.length
            ? `<strong>${label} (${items.length})</strong><ul>${items
                  .map((it) => {
                      const name = typeof it === "string" ? it : it.name;
                      const img = typeof it === "string" ? null : it.img;
                      return `<li>${img ? `<img src="${img}" class="slice-thumb" onerror="this.style.display='none'">` : ""}${name}</li>`;
                  })
                  .join("")}</ul>`
            : `<strong>${label}</strong><p>Aucun.</p>`;
        box.style.display = "block";
    }

    function checkImageExists(src) {
        return new Promise((resolve) => {
            if (!src) return resolve(false);
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }

    // Une seule répartition par rareté pour le total et chaque événement.
    // Un événement est une disponibilité : il ne remplace jamais la rareté.
    function rarityBreakdown(entries) {
        const order = ['commun', 'rare', 'epique', 'legendaire', 'mythique', 'divin', 'secret'];
        const buckets = new Map(order.map(key => [key, []]));
        entries.forEach(s => {
            const key = s.rarity || 'commun';
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key).push({name: s.name, img: s.faceImg || s.coteImg});
        });
        const keys = [...buckets.keys()].filter(key => buckets.get(key).length);
        return {
            labels: keys.map(key => RARITY_META[key]?.label || key),
            data: keys.map(key => buckets.get(key).length),
            groups: keys.map(key => buckets.get(key)),
            colors: keys.map(key => RARITY_META[key]?.color || '#b8bcc4')
        };
    }

    async function renderCharts() {
        const species = getSpecies();
        const total = rarityBreakdown(Object.values(species));
        drawPie('chart-rarity', total.labels, total.data, total.groups, total.colors);

        // Boss par difficulté (buckets)
        const bosses = getBosses();
        const buckets = { "Facile (<30)": 0, "Moyen (30-55)": 0, "Difficile (55-75)": 0, "Très difficile (>75)": 0 };
        const bucketNames = { "Facile (<30)": [], "Moyen (30-55)": [], "Difficile (55-75)": [], "Très difficile (>75)": [] };
        Object.values(bosses).forEach((b) => {
            const d = b.difficulty || 0;
            const label = d < 30 ? "Facile (<30)" : d < 55 ? "Moyen (30-55)" : d < 75 ? "Difficile (55-75)" : "Très difficile (>75)";
            buckets[label]++;
            bucketNames[label].push({ name: b.name, img: b.faceImg || b.coteImg });
        });
        drawPie("chart-difficulty", Object.keys(buckets), Object.values(buckets), Object.keys(buckets).map((k) => bucketNames[k]));

        // Camemberts dédiés par événement : répartition par rareté au sein
        // de chaque événement (Halloween / Noël / Pâques), pour voir en un
        // coup d'œil ce que contient chacune.
        function hasEvent(s, tag) {
            if (!s.event) return false;
            const events = Array.isArray(s.event) ? s.event : String(s.event).split(",").map((e) => e.trim());
            return events.includes(tag);
        }
        ["halloween", "noel", "paques", "nouvel_an_chinois"].forEach((tag) => {
            const entries = Object.values(species).filter((s) => hasEvent(s, tag));
            const { labels, data, groups, colors } = rarityBreakdown(entries);
            drawPie("chart-event-" + tag, labels, data, groups, colors);
        });


        // Complétion des visuels (test réel de chargement d'image face ET côté séparément)
        const speciesEntries = Object.entries(species).filter(([, s]) => !s.hidden);
        const speciesFaceResults = await Promise.all(speciesEntries.map(([, s]) => checkImageExists(s.faceImg)));
        const speciesCoteResults = await Promise.all(speciesEntries.map(([, s]) => checkImageExists(s.coteImg)));
        const speciesFullyFound = speciesEntries.filter((_, i) => speciesFaceResults[i] && speciesCoteResults[i]).length;
        const speciesCompleteNames = speciesEntries.filter((_, i) => speciesFaceResults[i] && speciesCoteResults[i]).map(([, s]) => s.name);
        const speciesIncompleteNames = speciesEntries.filter((_, i) => !(speciesFaceResults[i] && speciesCoteResults[i])).map(([, s]) => s.name);
        drawPie("chart-species-img", ["Complet", "Incomplet"], [speciesFullyFound, speciesEntries.length - speciesFullyFound], [speciesCompleteNames, speciesIncompleteNames], ["#9db88a", "#d8c89c"]);
        renderMissingList(
            "missing-species-list",
            speciesEntries
                .map(([, s], i) => ({ name: s.name, face: speciesFaceResults[i], cote: speciesCoteResults[i] }))
                .filter((e) => !e.face || !e.cote)
        );

        const bossEntries = Object.entries(bosses);
        const bossFaceResults = await Promise.all(bossEntries.map(([, b]) => checkImageExists(b.faceImg)));
        const bossCoteResults = await Promise.all(bossEntries.map(([, b]) => checkImageExists(b.coteImg)));
        const bossFullyFound = bossEntries.filter((_, i) => bossFaceResults[i] && bossCoteResults[i]).length;
        const bossCompleteNames = bossEntries.filter((_, i) => bossFaceResults[i] && bossCoteResults[i]).map(([, b]) => b.name);
        const bossIncompleteNames = bossEntries.filter((_, i) => !(bossFaceResults[i] && bossCoteResults[i])).map(([, b]) => b.name);
        drawPie("chart-boss-img", ["Complet", "Incomplet"], [bossFullyFound, bossEntries.length - bossFullyFound], [bossCompleteNames, bossIncompleteNames], ["#9db88a", "#d8c89c"]);
        renderMissingList(
            "missing-boss-list",
            bossEntries
                .map(([, b], i) => ({ name: b.name, face: bossFaceResults[i], cote: bossCoteResults[i] }))
                .filter((e) => !e.face || !e.cote)
        );
    }

    function renderMissingList(elId, missingEntries) {
        const el = document.getElementById(elId);
        if (!el) return;
        if (missingEntries.length === 0) {
            el.innerHTML = `<li class="missing-none">✅ Toutes les images sont là !</li>`;
            return;
        }
        el.innerHTML = missingEntries
            .map((e) => {
                const parts = [];
                if (!e.face) parts.push("face");
                if (!e.cote) parts.push("3/4 (côté)");
                return `<li>❌ ${e.name} — photo ${parts.join(" et ")} manquante</li>`;
            })
            .join("");
    }

    const RARITY_ORDER = ["commun", "rare", "epique", "legendaire", "mythique", "divin", "secret"];
    let sortState = { key: null, dir: 1 };
    function sortSpeciesTable(field) {
        sortState.dir = sortState.key === field ? -sortState.dir : 1;
        sortState.key = field;
        const tbody = document.getElementById("speciesTableBody");
        const rows = Array.from(tbody.querySelectorAll("tr")).filter((tr) => tr.dataset.key);
        const newRow = tbody.querySelector("tr.new-row");
        rows.sort((a, b) => {
            const va = field === "rarity" ? RARITY_ORDER.indexOf(getSpecies()[a.dataset.key]?.rarity) : speciesEventValue(getSpecies()[a.dataset.key]);
            const vb = field === "rarity" ? RARITY_ORDER.indexOf(getSpecies()[b.dataset.key]?.rarity) : speciesEventValue(getSpecies()[b.dataset.key]);
            if (va < vb) return -1 * sortState.dir;
            if (va > vb) return 1 * sortState.dir;
            return 0;
        });
        rows.forEach((r) => tbody.insertBefore(r, newRow));
    }
    document.getElementById("sortRarityBtn").addEventListener("click", () => sortSpeciesTable("rarity"));
    document.getElementById("sortEventBtn").addEventListener("click", () => sortSpeciesTable("event"));

    const speciesSearchInput = document.getElementById("speciesSearch");
    const speciesEventFilter = document.getElementById("speciesEventFilter");
    function applySpeciesFilters() {
        const q = (speciesSearchInput?.value || "").trim().toLowerCase();
        const eventFilter = speciesEventFilter?.value || "";
        document.querySelectorAll("#speciesTableBody tr").forEach((tr) => {
            if (!tr.dataset.search) return; // ligne d'ajout, toujours visible
            const s = getSpecies()[tr.dataset.key];
            const ev = speciesEventValue(s);
            const events = ev ? ev.split(",").map((x) => x.trim()).filter(Boolean) : [];
            const matchesText = q === "" || tr.dataset.search.includes(q);
            const matchesEvent = !eventFilter
                || (eventFilter === "none" && events.length === 0)
                || (eventFilter === "multi" && events.length > 1)
                || events.includes(eventFilter);
            tr.style.display = matchesText && matchesEvent ? "" : "none";
        });
    }
    if (speciesSearchInput) speciesSearchInput.addEventListener("input", applySpeciesFilters);
    if (speciesEventFilter) speciesEventFilter.addEventListener("change", applySpeciesFilters);

    renderDashboard();
    // Édition par cartes des articles et tableau distinct des accompagnateurs.
    const shopSection=document.createElement('section');shopSection.className='dash-section';
    shopSection.innerHTML='<h2>🛍️ Articles magasin</h2><div id="shopItemCards" class="puzzle-admin-cards"></div><div class="save-io-row"><button id="saveShopCatalog" class="io-btn">Enregistrer localement</button><button id="exportShopCatalog" class="io-btn">Exporter lapinous-shop.json</button><button id="addShopItem" class="io-btn">Ajouter un article</button></div><p id="shopCatalogStatus" role="status"></p>';
    const companionSection=document.createElement('section');companionSection.className='dash-section';companionSection.innerHTML='<h2>🐰 Accompagnateurs</h2><div id="companionEditor"></div>';
    document.querySelector('main').append(shopSection,companionSection);
    const shopSettingsSection=document.createElement('section');shopSettingsSection.className='dash-section';
    shopSettingsSection.innerHTML='<h2>Fonds et options du magasin</h2><div id="shopSettingsFields" class="dash-form"></div><button type="button" id="saveShopSettings">Enregistrer localement</button><button type="button" id="exportShopSettings">Exporter le catalogue</button>';
    document.querySelector('main').appendChild(shopSettingsSection);
    let shopData=null;
    function html(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
    function renderShopEditor(){
        // Traduit les champs affichés ; les valeurs du catalogue restent compatibles avec le jeu.
        function renderItemField(key){
            const labels={id:'Identifiant',name:'Nom',emoji:'Symbole',price:'Prix en carottes',kind:'Type de produit',stat:'Besoin',category:'Rayon',restoreAmount:'Points rendus',image:'Chemin de l’image',description:'Description'};
            const choices={kind:{restore:'Soin ou aliment',reset:'Extracteur de fragments'},stat:{'':'Aucun',food:'Nourriture',energy:'Sommeil',cleanliness:'Propreté'},category:{'':'Articles',market:'Marché',prepared:'Plats préparés',legacy_food:'Ancienne nourriture',retired:'Masqué'}};
            const value=itemForFields[key]??'';
            let control;
            if(choices[key]){const options={...choices[key]};if(!Object.hasOwn(options,value))options[value]='Autre';control='<select data-item-field="'+key+'">'+Object.entries(options).map(([id,label])=>'<option value="'+html(id)+'" '+(id===String(value)?'selected':'')+'>'+html(label)+'</option>').join('')+'</select>';}
            else control='<input data-item-field="'+key+'" value="'+html(value)+'" '+(['price','restoreAmount'].includes(key)?'type="number" min="'+(key==='price'?1:0)+'"':'')+'>';
            return '<label>'+labels[key]+control+'</label>';
        }
        let itemForFields;

        document.getElementById('shopItemCards').innerHTML=shopData.items.map((item,index)=>{itemForFields=item;return '<details class="puzzle-admin-card" data-shop-index="'+index+'"><summary class="catalog-card-summary"><img class="puzzle-admin-cover" src="'+html(item.image)+'" alt=""><strong>'+html(item.name)+'</strong><span>'+item.price+' 🥕</span></summary><div class="puzzle-admin-fields"><button type="button" class="catalog-card-return" onclick="this.parentElement.parentElement.open=false">↩ Retour à l’image</button>'+['id','name','emoji','price','kind','stat','category','restoreAmount','image','description'].map(renderItemField).join('')+'<button type="button" data-remove-item="'+index+'">Supprimer cet article</button></div></details>';}).join('');
        let recipesBox=document.getElementById('shopRecipeCards');
        if(!recipesBox){recipesBox=document.createElement('div');recipesBox.id='shopRecipeCards';recipesBox.className='puzzle-admin-cards';const heading=document.createElement('h3');heading.textContent='Recettes du Chef';document.getElementById('shopItemCards').after(heading,recipesBox);}
        recipesBox.innerHTML=(shopData.recipes||[]).map((recipe,index)=>'<details class="puzzle-admin-card" data-recipe-index="'+index+'"><summary class="catalog-card-summary"><img src="'+html(recipe.image)+'" alt=""><strong>'+html(recipe.name)+'</strong></summary><div class="puzzle-admin-fields"><button type="button" class="catalog-card-return" onclick="this.parentElement.parentElement.open=false">Retour</button>'+['id','item','name','emoji','image','description','price','restoreAmount'].map(key=>'<label>'+({id:'Identifiant',item:'Identifiant du plat',name:'Nom',emoji:'Symbole',image:'Image',description:'Description',price:'Prix',restoreAmount:'Nourriture'}[key])+'<input data-recipe-field="'+key+'" value="'+html(recipe[key]||'')+'"></label>').join('')+'<label>Pr?paration<select data-recipe-field="preparation"><option value="cutting" '+(recipe.preparation==='cutting'?'selected':'')+'>D?coupe</option><option value="cooking" '+(recipe.preparation==='cooking'?'selected':'')+'>Wok</option></select></label>'+Object.entries(recipe.ingredients).map(([id,count])=>'<label>'+html(shopData.items.find(item=>item.id===id)?.name||id)+'<input type="number" min="1" data-recipe-ingredient="'+html(id)+'" value="'+count+'"></label>').join('')+'</div></details>').join('');
        document.getElementById('shopSettingsFields').innerHTML=['recipesEnabled','carrotPurchasesEnabled'].map(key=>'<label>'+({recipesEnabled:'Activer la preparation des plats',carrotPurchasesEnabled:'Activer les achats de carottes'}[key])+'<input type="checkbox" data-shop-option="'+key+'" '+(shopData[key]?'checked':'')+'></label>').join('')+Object.entries({inventory:'Fond de l’apothicairerie',pantry:'Fond du garde-manger',market:'Fond du Marche',items:'Fond des articles',evolution:'Fond des evolutions',fragments:'Fond des fragments',cart:'Fond du panier'}).map(([key,label])=>'<label>'+label+'<input data-shop-background="'+key+'" value="'+html(shopData.backgrounds?.[key]||'')+'"></label>').join('');
        document.getElementById('shopSettingsFields').innerHTML+='<h3>Boites des mini-jeux</h3>'+Object.entries(shopData.gameBoxes||{}).map(([key,value])=>'<label>'+html({puzzles:'Puzzles',memory:'Memory',lapidoku:'Lapidoku',quiz:'Quiz des lapins'}[key]||key)+'<input data-game-box="'+html(key)+'" value="'+html(value)+'"></label>').join('');
        const roles={cashier:shopData.cashier,apothecary:shopData.apothecary,...Object.fromEntries(Object.entries(shopData.companions||{}).map(([key,value])=>['companions.'+key,value]))};
        document.getElementById('companionEditor').innerHTML=Object.entries(roles).map(([role,data])=>'<details class="companion-group"><summary>'+html(data?.name||role)+'</summary><div class="pm-table-wrap"><table class="companion-editor-table"><thead><tr><th>Propriété</th><th>Valeur / image</th></tr></thead><tbody>'+Object.entries(data||{}).map(([key,value])=>'<tr><td>'+html(key)+'</td><td>'+(String(value).match(/\.(png|gif|webp|svg)$/i)?'<img src="'+html(value)+'" alt="" loading="lazy">':'')+'<input data-role="'+role+'" data-pose="'+key+'" '+(typeof value==='boolean'?'type="checkbox" '+(value?'checked':''):'value="'+html(value)+'"')+'></td></tr>').join('')+'</tbody></table></div></details>').join('');
    }
    function collectShopEditor(){shopData.gameBoxes||={};document.querySelectorAll('[data-game-box]').forEach(input=>shopData.gameBoxes[input.dataset.gameBox]=input.value.trim());document.querySelectorAll('[data-shop-option]').forEach(input=>shopData[input.dataset.shopOption]=input.checked);shopData.backgrounds||={};document.querySelectorAll('[data-shop-background]').forEach(input=>shopData.backgrounds[input.dataset.shopBackground]=input.value.trim());document.querySelectorAll('[data-recipe-index]').forEach(card=>{const recipe=shopData.recipes[Number(card.dataset.recipeIndex)];card.querySelectorAll('[data-recipe-field]').forEach(input=>{recipe[input.dataset.recipeField]=['price','restoreAmount'].includes(input.dataset.recipeField)?Number(input.value):input.value;});card.querySelectorAll('[data-recipe-ingredient]').forEach(input=>recipe.ingredients[input.dataset.recipeIngredient]=Number(input.value));});document.querySelectorAll('[data-shop-index]').forEach(card=>{const item=shopData.items[Number(card.dataset.shopIndex)];card.querySelectorAll('[data-item-field]').forEach(input=>{const key=input.dataset.itemField;if(key==='stat'&&!input.value)delete item.stat;else item[key]=['price','restoreAmount'].includes(key)?(input.value?Number(input.value):undefined):input.value;});});document.querySelectorAll('[data-role]').forEach(input=>{const role=input.dataset.role;const target=role.startsWith('companions.')?shopData.companions[role.slice(11)]:shopData[role];target[input.dataset.pose]=input.type==='checkbox'?input.checked:typeof target[input.dataset.pose]==='number'?Number(input.value):input.value;});return window.LapinousShop.validateCatalog(shopData);}
    fetch('./lapinous-shop.json',{cache:'no-store'}).then(response=>response.json()).then(data=>{try{shopData=JSON.parse(localStorage.getItem('lapinous_shop_catalog'))||data;}catch{shopData=data;}renderShopEditor();}).catch(()=>{document.getElementById('shopCatalogStatus').textContent='Catalogue inaccessible.';});
    shopSection.addEventListener('click',event=>{if(event.target.dataset.removeItem!==undefined){collectShopEditor();shopData.items.splice(Number(event.target.dataset.removeItem),1);renderShopEditor();}});
    document.getElementById('addShopItem').onclick=()=>{collectShopEditor();shopData.items.push({id:'article_'+Date.now(),name:'Nouvel article',emoji:'🌿',description:'',price:15,kind:'restore',stat:'food',image:''});renderShopEditor();};
    document.getElementById('saveShopCatalog').onclick=()=>{try{localStorage.setItem('lapinous_shop_catalog',JSON.stringify(collectShopEditor()));document.getElementById('shopCatalogStatus').textContent='Enregistré. Recharge le jeu pour tester.';}catch(error){document.getElementById('shopCatalogStatus').textContent=error.message;}};
    document.getElementById('exportShopCatalog').onclick=async()=>{try{const mode=await window.LapinousLocalFiles.exportJSON('lapinous-shop.json',collectShopEditor());document.getElementById('shopCatalogStatus').textContent=mode==='written'?'Catalogue enregistré dans le projet. Recharge le jeu.':'Catalogue téléchargé.';}catch(error){if(error.name!=='AbortError')document.getElementById('shopCatalogStatus').textContent=error.message;}};
    document.getElementById('saveShopSettings').onclick=()=>document.getElementById('saveShopCatalog').click();
    document.getElementById('exportShopSettings').onclick=()=>document.getElementById('exportShopCatalog').click();
    // Les mêmes sections restent en place dans les accordéons ; leurs contrôles gardent leurs événements.
    const navigation=document.createElement('nav');navigation.className='dashboard-jump-menu';navigation.setAttribute('aria-label','Sections du Dashboard');
    document.querySelector('.dash-header').appendChild(navigation);
    // La sécurité reste la dernière section, y compris après ajout du magasin.
    const securitySection=[...document.querySelectorAll('main>.dash-section')].find(section=>section.querySelector('h2')?.textContent.includes('Sécurité'));
    if(securitySection)document.querySelector('main').appendChild(securitySection);
    document.querySelectorAll('main>.dash-section').forEach((section,index)=>{
        const heading=section.querySelector('h2');const title=heading?.textContent||'Section';const accordion=document.createElement('details');accordion.className='dashboard-accordion';accordion.id='dashboard-section-'+index;accordion.open=index===0;
        const summary=document.createElement('summary');summary.textContent=title;heading?.remove();section.replaceWith(accordion);accordion.append(summary,section);
        const button=document.createElement('button');button.type='button';button.textContent=title;button.onclick=()=>{accordion.open=true;accordion.scrollIntoView({behavior:'smooth',block:'start'});};navigation.appendChild(button);
        accordion.addEventListener('toggle',()=>{if(accordion.open)Object.values(chartInstances).forEach(chart=>chart.resize());});
    });
    });
});
