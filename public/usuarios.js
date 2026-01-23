const $ = (id) => document.getElementById(id);

// Toast notifications (copiado de app.js)
function showToast(message, type = "info") {
  const container = $("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = { ok: "✅", err: "❌", info: "ℹ️", warning: "⚠️" };
  const icon = icons[type] || icons.info;

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-text">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Verificar autenticación
async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) {
      console.log("No autenticado, redirigiendo a login");
      window.location.href = "/login.html";
      return false;
    }

    const user = await res.json();
    console.log("Usuario autenticado:", user);
    
    if (user.rol !== "admin") {
      showToast("Acceso denegado. Solo administradores.", "err");
      setTimeout(() => (window.location.href = "/index.html"), 2000);
      return false;
    }

    // Actualizar header
    const headerInfo = document.querySelector(".header-info");
    if (headerInfo) {
      headerInfo.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
            <span style="color: var(--muted);">${user.usuario}</span>
            <span style="background: var(--accent); color: var(--bg); padding: 4px 10px; border-radius: 16px; font-size: 11px; font-weight: 600;">ADMIN</span>
          </div>
          <button class="btn ghost" onclick="logout()" style="padding: 6px 12px; font-size: 12px;">🚪 Salir</button>
        </div>
      `;
    }
    
    return true;
  } catch (err) {
    console.error("Error verificando auth:", err);
    window.location.href = "/login.html";
    return false;
  }
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login.html";
}

// Cargar lista de usuarios
async function loadUsuarios() {
  try {
    const res = await fetch("/api/usuarios");
    const usuarios = await res.json();

    const tbody = $("tbody");
    const emptyState = $("emptyState");

    if (!usuarios || usuarios.length === 0) {
      tbody.innerHTML = "";
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    tbody.innerHTML = usuarios
      .map(
        (u) => `
      <tr>
        <td>${u.id}</td>
        <td><strong>${u.usuario}</strong></td>
        <td>
          <span class="badge ${u.rol === "admin" ? "ok" : "bad"}">
            ${u.rol === "admin" ? "👨‍💼 Admin" : "👁️ Vigilante"}
          </span>
        </td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</td>
        <td class="actionsCell">
          <button class="iconBtn" onclick="abrirModalPassword(${u.id}, '${u.usuario}')">🔑 Contraseña</button>
          <button class="iconBtn danger" onclick="eliminarUsuario(${u.id}, '${u.usuario}')">🗑️ Eliminar</button>
        </td>
      </tr>
    `
      )
      .join("");
  } catch (err) {
    showToast("Error al cargar usuarios", "err");
  }
}

// Crear usuario
$("formUsuario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = $("usuario").value.trim();
  const contrasena = $("contrasena").value;
  const rol = $("rol").value;

  if (!usuario || !contrasena || !rol) {
    showToast("Completa todos los campos", "err");
    return;
  }

  try {
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, contrasena, rol }),
    });

    const data = await res.json();

    if (!res.ok) {
      $("formMsg").textContent = data.error || "Error al crear usuario";
      $("formMsg").className = "msg err";
      showToast(data.error || "Error al crear usuario", "err");
      return;
    }

    $("formMsg").textContent = "✅ Usuario creado exitosamente";
    $("formMsg").className = "msg ok";
    showToast("Usuario creado exitosamente", "ok");

    // Limpiar formulario
    $("formUsuario").reset();
    setTimeout(() => {
      $("formMsg").textContent = "";
      $("formMsg").className = "msg";
    }, 3000);

    // Recargar lista
    await loadUsuarios();
  } catch (err) {
    showToast("Error de conexión", "err");
  }
});

// Cancelar edición
$("btnCancelar").addEventListener("click", () => {
  $("formUsuario").reset();
  $("editId").value = "";
  $("formTitle").textContent = "➕ Crear nuevo usuario";
  $("btnCancelar").hidden = true;
  $("formMsg").textContent = "";
  $("formMsg").className = "msg";
});

// Modal cambiar contraseña
function abrirModalPassword(id, usuario) {
  $("passwordUserId").value = id;
  $("nuevaContrasena").value = "";
  $("passwordMsg").textContent = "";
  $("passwordMsg").className = "msg";
  $("modalPassword").style.display = "flex";
  document.querySelector("#modalPassword h2").textContent = `🔑 Cambiar contraseña de: ${usuario}`;
}

function cerrarModalPassword() {
  $("modalPassword").style.display = "none";
}

async function cambiarPassword() {
  const id = $("passwordUserId").value;
  const nuevaContrasena = $("nuevaContrasena").value;

  if (!nuevaContrasena) {
    showToast("Escribe la nueva contraseña", "err");
    return;
  }

  try {
    const res = await fetch(`/api/usuarios/${id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuevaContrasena }),
    });

    const data = await res.json();

    if (!res.ok) {
      $("passwordMsg").textContent = data.error || "Error al cambiar contraseña";
      $("passwordMsg").className = "msg err";
      showToast(data.error || "Error al cambiar contraseña", "err");
      return;
    }

    showToast("Contraseña actualizada exitosamente", "ok");
    cerrarModalPassword();
    await loadUsuarios();
  } catch (err) {
    showToast("Error de conexión", "err");
  }
}

// Eliminar usuario
async function eliminarUsuario(id, usuario) {
  if (!confirm(`¿Seguro que quieres eliminar al usuario "${usuario}"?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Error al eliminar usuario", "err");
      return;
    }

    showToast("Usuario eliminado exitosamente", "ok");
    await loadUsuarios();
  } catch (err) {
    showToast("Error de conexión", "err");
  }
}

// Cerrar modal con ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModalPassword();
  }
});

// Inicializar
(async function init() {
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) {
    await loadUsuarios();
  }
})();
