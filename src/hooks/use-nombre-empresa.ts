"use client";

import { useState, useEffect, useCallback } from "react";

export function useNombreEmpresa(fallback = "Zinc Industrial") {
  const [nombre, setNombre] = useState(fallback);

  const refetch = useCallback(() => {
    fetch("/api/configuracion/publica", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.empresaNombre) {
          setNombre(data.empresaNombre);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { nombre, refetch };
}
