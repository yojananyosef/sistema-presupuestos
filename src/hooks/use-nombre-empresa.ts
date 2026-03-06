"use client";

import { useState, useEffect } from "react";

let cacheNombre: string | null = null;

export function useNombreEmpresa(fallback = "Zinc Industrial") {
  const [nombre, setNombre] = useState(cacheNombre || fallback);

  useEffect(() => {
    if (cacheNombre) return;

    fetch("/api/configuracion/publica")
      .then((res) => res.json())
      .then((data) => {
        cacheNombre = data.empresaNombre;
        setNombre(data.empresaNombre);
      })
      .catch(() => {});
  }, []);

  return nombre;
}
