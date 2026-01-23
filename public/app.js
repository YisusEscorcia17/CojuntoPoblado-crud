const $ = (id) => document.getElementById(id);

// Estado global
const state = {
  editingId: null,
  usuario: null,
  isAdmin: false,
  currentPage: 1,
  pageSize: 50,
  totalRecords: 0,
  allRecords: []
};

// Verificar autenticación
async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) {
      window.location.href = "/login.html";
      return;
    }
    
    const user = await res.json();
    state.usuario = user.usuario;
    state.isAdmin = user.rol === "admin";
    
    // Actualizar UI según rol
    updateUIByRole();
  } catch (err) {
    window.location.href = "/login.html";
  }
}

// Actualizar UI según rol
function updateUIByRole() {
  const adminElements = document.querySelectorAll("[data-admin-only]");
  const headerInfo = document.querySelector(".header-info");
  
  adminElements.forEach((el) => {
    el.style.display = state.isAdmin ? "" : "none";
  });
  
  if (headerInfo) {
    const roleIcon = state.isAdmin ? "👨‍💼" : "👁️";
    const roleName = state.isAdmin ? "Administrador" : "Vigilante";
    const roleBadgeColor = state.isAdmin ? "var(--accent)" : "var(--ok)";
    
    headerInfo.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
          <span style="color: var(--muted);">${state.usuario}</span>
          <span style="background: ${roleBadgeColor}; color: var(--bg); padding: 4px 10px; border-radius: 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${roleName}</span>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
          ${state.isAdmin ? '<a href="/usuarios.html" class="btn ghost" style="padding: 8px 12px; font-size: 12px; white-space: nowrap; text-decoration: none;">👥 Usuarios</a>' : ''}
          <button id="btnCambiarCredenciales" class="btn ghost" style="padding: 8px 12px; font-size: 12px; white-space: nowrap;">⚙️ Credenciales</button>
          <button id="btnLogout" class="btn ghost" style="padding: 8px 12px; font-size: 12px; white-space: nowrap;">🚪 Salir</button>
        </div>
      </div>
    `;
    
    document.getElementById("btnLogout").addEventListener("click", logout);
    document.getElementById("btnCambiarCredenciales").addEventListener("click", abrirModalCambiarCredenciales);
  }
}

// Logout
async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login.html";
}

const form = $("form");
const tbody = $("tbody");

// Sistema de notificaciones toast
function showToast(text, type = "info") {
  if (!text) return;
  
  const container = document.getElementById("toastContainer");
  if (!container) return;
  
  // Crear el toast
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  // Icono según el tipo
  const icons = {
    ok: "✅",
    err: "❌",
    info: "ℹ️",
    warning: "⚠️"
  };
  
  const icon = icons[type] || icons.info;
  
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-text">${text}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  
  // Agregar al contenedor
  container.appendChild(toast);
  
  // Animar entrada
  setTimeout(() => toast.classList.add("show"), 10);
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Alias para setMsg (por compatibilidad)
function setMsg(text, type = "") {
  if (!text) return;
  showToast(text, type || "info");
}

function moneyCOP(value) {
  const n = Number(value || 0);
  return n.toLocaleString("es-CO");
}

function toggleDeuda() {
  const morosoEl = $("moroso");
  const deudaInput = $("deudaMoroso");
  if (!morosoEl || !deudaInput) return;

  const isMoroso = morosoEl.checked;
  deudaInput.disabled = !isMoroso;

  if (!isMoroso) {
    deudaInput.value = 0;
  } else {
    if (deudaInput.value === "" || deudaInput.value == null) deudaInput.value = 0;
  }
}

function readForm() {
  const placaCarro = $("placaCarro").value.trim().toUpperCase();
  const placaMoto = $("placaMoto").value.trim().toUpperCase();
  
  // Validar campos obligatorios
  const nombrePropietario = $("nombrePropietario").value.trim();
  const correo = $("correo").value.trim();
  const cedula = $("cedula").value.trim();
  const torre = $("torre").value.trim();
  const apartamento = $("apartamento").value.trim();
  
  if (!nombrePropietario) {
    showToast("El nombre del propietario es obligatorio", "err");
    $("nombrePropietario").focus();
    return null;
  }
  
  if (!correo) {
    showToast("El correo electrónico es obligatorio", "err");
    $("correo").focus();
    return null;
  }
  
  // Validar formato de correo
  if (!correo.includes("@") || !correo.includes(".")) {
    showToast("El correo debe tener un formato válido (ejemplo@dominio.com)", "err");
    $("correo").focus();
    return null;
  }
  
  if (!cedula) {
    showToast("La cédula es obligatoria", "err");
    $("cedula").focus();
    return null;
  }
  
  if (!torre) {
    showToast("La torre es obligatoria", "err");
    $("torre").focus();
    return null;
  }
  
  if (!apartamento) {
    showToast("El apartamento es obligatorio", "err");
    $("apartamento").focus();
    return null;
  }

  return {
    nombrePropietario,
    correo,
    cedula,
    torre,
    apartamento,
    cantidadCarros: Number.parseInt($("cantidadCarros").value || "0", 10),
    cantidadMotos: Number.parseInt($("cantidadMotos").value || "0", 10),
    placaCarro: placaCarro || null,
    placaMoto: placaMoto || null,
    moroso: $("moroso").checked,
    deudaMoroso: Number.parseInt($("deudaMoroso").value || "0", 10)
  };
}

function fillForm(row) {
  $("id").value = row.id;
  $("nombrePropietario").value = row.nombrePropietario ?? "";
  $("correo").value = row.correo ?? "";
  $("cedula").value = row.cedula ?? "";
  $("torre").value = row.torre ?? "";
  $("apartamento").value = row.apartamento ?? "";
  $("cantidadCarros").value = row.cantidadCarros ?? 0;
  $("cantidadMotos").value = row.cantidadMotos ?? 0;

  $("placaCarro").value = (row.placaCarro ?? "");
  $("placaMoto").value = (row.placaMoto ?? "");
  $("moroso").checked = !!row.moroso;
  $("deudaMoroso").value = row.deudaMoroso ?? 0;

  toggleDeuda();

  $("formTitle").textContent = "Editar propietario";
  $("btnGuardar").textContent = "Actualizar";
  $("btnCancelar").hidden = false;
  state.editingId = row.id;
}

function resetForm() {
  form.reset();
  $("cantidadCarros").value = 0;
  $("cantidadMotos").value = 0;

  $("placaCarro").value = "";
  $("placaMoto").value = "";

  $("moroso").checked = false;
  $("deudaMoroso").value = 0;
  toggleDeuda();

  $("id").value = "";
  $("formTitle").textContent = "Agregar propietario";
  $("btnGuardar").textContent = "Guardar";
  $("btnCancelar").hidden = true;
  state.editingId = null;
  setMsg("");
}

function badgeMoroso(isMoroso) {
  if (isMoroso) return `<span class="badge bad">Sí</span>`;
  return `<span class="badge ok">No</span>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadList() {
  const q = $("q").value.trim();
  const fMoroso = $("fMoroso").value;

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (fMoroso !== "") params.set("moroso", fMoroso);

  const res = await fetch(`/api/propietarios?${params.toString()}`);
  const allRows = await res.json();
  
  // Guardar todos los registros
  state.allRecords = allRows;
  state.totalRecords = allRows.length;
  
  // Aplicar paginación
  renderPage();
}

function renderPage() {
  const start = (state.currentPage - 1) * state.pageSize;
  const end = start + state.pageSize;
  const rows = state.allRecords.slice(start, end);

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><span class="cell-wrap" title="${escapeHtml(r.nombrePropietario)}">${escapeHtml(r.nombrePropietario)}</span></td>
      <td><span class="cell-wrap" title="${escapeHtml(r.correo)}">${escapeHtml(r.correo)}</span></td>
      <td>${escapeHtml(r.cedula)}</td>
      <td>${escapeHtml(r.torre)}</td>
      <td>${escapeHtml(r.apartamento)}</td>
      <td style="text-align:center">${r.cantidadCarros}</td>
      <td style="text-align:center">${r.cantidadMotos}</td>
      <td>${escapeHtml(r.placaCarro || "-")}</td>
      <td>${escapeHtml(r.placaMoto || "-")}</td>
      <td>${badgeMoroso(!!r.moroso)}</td>
      <td style="white-space:nowrap">$ ${moneyCOP(r.deudaMoroso || 0)}</td>
      <td>
        <div class="actionsCell">
          ${state.isAdmin ? `
            <button class="iconBtn" data-edit="${r.id}">Editar</button>
            <button class="iconBtn danger" data-del="${r.id}">Eliminar</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join("");

  // Actualizar info de paginación
  updatePaginationInfo();

  // bind buttons
  tbody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-edit");
      const r = await fetch(`/api/propietarios/${id}`).then(x => x.json());
      fillForm(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  tbody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      const ok = confirm("¿Seguro que quieres eliminar este registro?");
      if (!ok) return;

      const res = await fetch(`/api/propietarios/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg(data.error || "Error eliminando", "err");

      setMsg("Eliminado ✅", "ok");
      if (state.editingId === Number(id)) resetForm();
      await loadList();
    });
  });
}

function updatePaginationInfo() {
  const start = (state.currentPage - 1) * state.pageSize + 1;
  const end = Math.min(state.currentPage * state.pageSize, state.totalRecords);
  const totalPages = Math.ceil(state.totalRecords / state.pageSize);
  
  $("paginaActual").textContent = `${start}-${end}`;
  $("totalRegistros").textContent = state.totalRecords;
  $("pageInfo").textContent = `Página ${state.currentPage} de ${totalPages}`;
  
  $("btnPrevPage").disabled = state.currentPage === 1;
  $("btnNextPage").disabled = state.currentPage >= totalPages;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("");

  const payload = readForm();
  
  // Si readForm() devuelve null, significa que hubo un error de validación
  if (!payload) {
    return;
  }

  // Validación moroso/deuda
  if (payload.moroso && (!payload.deudaMoroso || payload.deudaMoroso <= 0)) {
    return setMsg("Si está moroso, pon cuánto debe (mayor a 0).", "err");
  }

  const isEdit = !!state.editingId;
  const url = isEdit ? `/api/propietarios/${state.editingId}` : "/api/propietarios";
  const method = isEdit ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return setMsg(data.error || "Algo falló guardando.", "err");
  }

  setMsg(isEdit ? "Actualizado ✅" : "Guardado ✅", "ok");
  resetForm();
  await loadList();
});

$("btnCancelar").addEventListener("click", resetForm);
$("btnBuscar").addEventListener("click", loadList);
$("q").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadList();
});

// Deuda depende del checkbox moroso
$("moroso").addEventListener("change", toggleDeuda);
toggleDeuda();

/* ===========================
   MEJORA: Backup (botón)
   =========================== */
const btnBackup = document.getElementById("btnBackup");
if (btnBackup) {
  btnBackup.addEventListener("click", async () => {
    setMsg("Creando backup...", "");
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        return setMsg(data.error || "No se pudo crear el backup.", "err");
      }

      setMsg(`Backup creado ✅ (${data.file})`, "ok");
    } catch (e) {
      setMsg("No se pudo crear el backup (error de red).", "err");
    }
  });
}

/* ============ CAMBIAR CREDENCIALES ============ */

function abrirModalCambiarCredenciales() {
  const modal = $("modalCambiarCredenciales");
  modal.style.display = "flex";
  
  // Mostrar usuario actual
  const usuarioActualInput = $("usuarioActual");
  if (usuarioActualInput) {
    usuarioActualInput.value = state.usuario;
  }
  
  // Limpiar formularios
  $("formCambiarPassword").reset();
  $("formCambiarUsername").reset();
}

function cerrarModalCambiarCredenciales() {
  const modal = $("modalCambiarCredenciales");
  modal.style.display = "none";
}

// Cerrar modal
$("btnCerrarModal").addEventListener("click", cerrarModalCambiarCredenciales);

// Cerrar modal al hacer click afuera
$("modalCambiarCredenciales").addEventListener("click", (e) => {
  if (e.target.id === "modalCambiarCredenciales") {
    cerrarModalCambiarCredenciales();
  }
});

// Tabs
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    
    // Cambiar tab activo
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    
    // Cambiar contenido
    document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
    $(`tab-${tab}`).classList.add("active");
  });
});

// Cambiar contraseña
$("formCambiarPassword").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const contrasenaActual = $("contrasenaActual").value;
  const contrasenaNueva = $("contrasenaNueva").value;
  const confirmacion = $("confirmacion").value;
  
  showToast("Cambiando contraseña...", "info");
  
  try {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contrasenaActual, contrasenaNueva, confirmacion })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      showToast(data.error || "Error al cambiar contraseña", "err");
      return;
    }
    
    showToast("Contraseña cambiada exitosamente ✅", "ok");
    
    setTimeout(() => {
      $("formCambiarPassword").reset();
      cerrarModalCambiarCredenciales();
    }, 1500);
  } catch (err) {
    showToast("Error de conexión", "err");
  }
});

// Cambiar usuario
$("formCambiarUsername").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const usuarioNuevo = $("usuarioNuevo").value.trim();
  
  showToast("Cambiando usuario...", "info");
  
  try {
    const res = await fetch("/api/auth/change-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioNuevo })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      showToast(data.error || "Error al cambiar usuario", "err");
      return;
    }
    
    showToast("Usuario cambiado exitosamente ✅", "ok");
    
    state.usuario = usuarioNuevo;
    
    setTimeout(() => {
      cerrarModalCambiarCredenciales();
      updateUIByRole();
    }, 1500);
  } catch (err) {
    showToast("Error de conexión", "err");
  }
});

// ===== IMPORTACIÓN CSV =====
const csvFileInput = $("csvFile");
const btnImportarCSV = $("btnImportarCSV");
const csvMsg = $("csvMsg");
const fileNameDisplay = $("fileName");

// Detectar cuando se selecciona un archivo
csvFileInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  
  if (file) {
    fileNameDisplay.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    fileNameDisplay.style.color = "var(--accent)";
    btnImportarCSV.disabled = false;
    csvMsg.textContent = "";
    csvMsg.className = "msg";
  } else {
    fileNameDisplay.textContent = "";
    btnImportarCSV.disabled = true;
  }
});

// Importar CSV
btnImportarCSV?.addEventListener("click", async () => {
  const file = csvFileInput.files[0];
  
  if (!file) {
    showToast("Por favor selecciona un archivo CSV", "err");
    return;
  }

  if (!file.name.endsWith('.csv')) {
    showToast("El archivo debe ser formato CSV", "err");
    return;
  }

  try {
    btnImportarCSV.disabled = true;
    btnImportarCSV.textContent = "⏳ Importando...";
    csvMsg.textContent = "";
    csvMsg.className = "msg";

    const formData = new FormData();
    formData.append('csvFile', file);

    const res = await fetch('/api/importar-csv', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      csvMsg.textContent = data.error || "Error al importar CSV";
      csvMsg.className = "msg err";
      showToast(data.error || "Error al importar CSV", "err");
      return;
    }

    // Mostrar resumen
    let mensaje = `✅ Importación exitosa:\n`;
    mensaje += `• ${data.insertados} propietarios nuevos\n`;
    mensaje += `• ${data.actualizados} propietarios actualizados\n`;
    mensaje += `• Total procesados: ${data.total}`;

    if (data.erroresValidacion && data.erroresValidacion.length > 0) {
      mensaje += `\n\n⚠️ ${data.erroresValidacion.length} filas omitidas (datos incompletos)`;
    }

    if (data.erroresDB && data.erroresDB.length > 0) {
      mensaje += `\n\n❌ ${data.erroresDB.length} registros fallaron al guardar`;
      console.warn("Errores de BD:", data.erroresDB);
    }

    csvMsg.textContent = mensaje;
    csvMsg.className = "msg ok";
    csvMsg.style.whiteSpace = "pre-line";

    showToast(`✅ ${data.insertados} insertados, ${data.actualizados} actualizados`, "ok");

    // Limpiar formulario
    csvFileInput.value = "";
    fileNameDisplay.textContent = "";
    btnImportarCSV.disabled = true;

    // Recargar lista
    await loadList();

  } catch (err) {
    console.error("Error importando:", err);
    csvMsg.textContent = "Error de conexión al importar";
    csvMsg.className = "msg err";
    showToast("Error de conexión al importar", "err");
  } finally {
    btnImportarCSV.disabled = false;
    btnImportarCSV.textContent = "⬆️ Importar datos";
  }
});

// Controles de paginación
$("pageSize")?.addEventListener("change", (e) => {
  state.pageSize = parseInt(e.target.value);
  state.currentPage = 1;
  renderPage();
});

$("btnPrevPage")?.addEventListener("click", () => {
  if (state.currentPage > 1) {
    state.currentPage--;
    renderPage();
    window.scrollTo({ top: document.querySelector('.tableWrap').offsetTop - 100, behavior: 'smooth' });
  }
});

$("btnNextPage")?.addEventListener("click", () => {
  const totalPages = Math.ceil(state.totalRecords / state.pageSize);
  if (state.currentPage < totalPages) {
    state.currentPage++;
    renderPage();
    window.scrollTo({ top: document.querySelector('.tableWrap').offsetTop - 100, behavior: 'smooth' });
  }
});

// Inicializar: verificar auth y cargar datos
checkAuth();
loadList();
