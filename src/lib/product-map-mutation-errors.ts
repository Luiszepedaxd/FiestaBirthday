export function isProductMapPermissionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  const message = e.message?.toLowerCase() ?? "";
  return (
    e.code === "42501" ||
    message.includes("permission") ||
    message.includes("policy") ||
    message.includes("row-level security") ||
    message.includes("not authorized")
  );
}

export function getProductMapMutationErrorMessage(error: unknown): string {
  if (isProductMapPermissionError(error)) {
    return "No tienes permisos para esta acción";
  }
  return "Error al realizar la acción";
}
