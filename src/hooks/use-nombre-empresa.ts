"use client";

import { useState, useEffect, useCallback } from "react";

export function useConfigPublica(fallbackNombre = "Mi Empresa") {
  const [nombre, setNombre] = useState(fallbackNombre);
  const [logoUrl, setLogoUrl] = useState("");

  const refetch = useCallback(() => {
    fetch("/api/configuracion/publica", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.empresaNombre) setNombre(data.empresaNombre);
        if (data.logoUrl !== undefined) setLogoUrl(data.logoUrl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { nombre, logoUrl, refetch };
}

/** @deprecated Usa useConfigPublica */
export function useNombreEmpresa(fallback = "Mi Empresa") {
  const { nombre, refetch } = useConfigPublica(fallback);
  return { nombre, refetch };
}
