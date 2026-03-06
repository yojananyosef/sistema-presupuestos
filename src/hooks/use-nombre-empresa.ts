"use client";

import { useState, useEffect, useCallback } from "react";

let cacheNombre: string | null = null;

export function invalidarCacheNombreEmpresa() {
  cacheNombre = null;
}

export function useNombreEmpresa(fallback = "Zinc Industrial") {
  const [nombre, setNombre] = useState(cacheNombre || fallback);

  const refetch = useCallback(() => {
    fetch("/api/configuracion/publica", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.empresaNombre) {
          cacheNombre = data.empresaNombre;
          setNombre(data.empresaNombre);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (cacheNombre) return;
    refetch();
  }, [refetch]);

  return { nombre, refetch };
}
