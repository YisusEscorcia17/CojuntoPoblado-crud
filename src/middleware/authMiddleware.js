// Middleware para verificar autenticación
export function requireAuth(req, res, next) {
  if (!req.session?.usuario) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
}

// Middleware para verificar que sea admin
export function requireAdmin(req, res, next) {
  if (!req.session?.usuario) {
    return res.status(401).json({ error: "No autenticado" });
  }
  if (req.session.usuario.rol !== "admin") {
    return res.status(403).json({ error: "No autorizado" });
  }
  next();
}
