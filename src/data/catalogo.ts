/**
 * Catálogo de muestra generado con IA.
 *
 * La empresa NO entrega datos reales durante el concurso, así que esta es
 * una muestra REPRESENTATIVA de la línea de negocio (sellos mecánicos,
 * capacitores y artículos de refrigeración), con códigos contables y
 * descripciones al estilo del ejemplo del documento:
 *   código "0100178" = "Sello mecánico 7 octavos, resorte corto Parxial".
 *
 * Cada producto conserva su `codigo` contable, que es el que viaja a World
 * Office aunque el vendedor lo seleccione por descripción.
 *
 * Esta misma estructura alimenta:
 *   - el cliente mock (fuente de datos durante el concurso), y
 *   - el seed de Supabase (scripts/generar-catalogo.ts → seed-catalogo.sql).
 */

import type { CategoriaProducto } from "@/domain/tipos";

/** Producto del catálogo semilla (sin id; el id se deriva del código). */
export interface ProductoSemilla {
  codigo: string;
  descripcion: string;
  categoria: CategoriaProducto;
  marca: string;
  unidad: string;
  precio: number;
  ivaPct: number;
  stock: number;
}

export const CATALOGO: ProductoSemilla[] = [
  // ----- Sellos mecánicos (0100xxx) ---------------------------------------
  { codigo: "0100178", descripcion: "Sello mecánico 7 octavos, resorte corto Parxial", categoria: "sellos_mecanicos", marca: "Parxial", unidad: "UND", precio: 38500, ivaPct: 19, stock: 24 },
  { codigo: "0100179", descripcion: "Sello mecánico 7 octavos, resorte largo Parxial", categoria: "sellos_mecanicos", marca: "Parxial", unidad: "UND", precio: 41200, ivaPct: 19, stock: 18 },
  { codigo: "0100184", descripcion: "Sello mecánico 1 pulgada, resorte corto Parxial", categoria: "sellos_mecanicos", marca: "Parxial", unidad: "UND", precio: 45900, ivaPct: 19, stock: 30 },
  { codigo: "0100185", descripcion: "Sello mecánico 1 pulgada, resorte largo Parxial", categoria: "sellos_mecanicos", marca: "Parxial", unidad: "UND", precio: 48700, ivaPct: 19, stock: 12 },
  { codigo: "0100190", descripcion: "Sello mecánico 1 1/4 pulgada cerámica/carbón Burgmann", categoria: "sellos_mecanicos", marca: "Burgmann", unidad: "UND", precio: 72300, ivaPct: 19, stock: 9 },
  { codigo: "0100191", descripcion: "Sello mecánico 1 1/2 pulgada cerámica/carbón Burgmann", categoria: "sellos_mecanicos", marca: "Burgmann", unidad: "UND", precio: 81500, ivaPct: 19, stock: 7 },
  { codigo: "0100205", descripcion: "Sello mecánico tipo cartucho 2 pulgadas John Crane", categoria: "sellos_mecanicos", marca: "John Crane", unidad: "UND", precio: 198000, ivaPct: 19, stock: 4 },
  { codigo: "0100206", descripcion: "Sello mecánico tipo cartucho 2 1/2 pulgadas John Crane", categoria: "sellos_mecanicos", marca: "John Crane", unidad: "UND", precio: 224500, ivaPct: 19, stock: 3 },
  { codigo: "0100212", descripcion: "Empaque de sello mecánico viton 7 octavos", categoria: "sellos_mecanicos", marca: "Parxial", unidad: "UND", precio: 8900, ivaPct: 19, stock: 60 },
  { codigo: "0100213", descripcion: "Empaque de sello mecánico viton 1 pulgada", categoria: "sellos_mecanicos", marca: "Parxial", unidad: "UND", precio: 9600, ivaPct: 19, stock: 55 },
  { codigo: "0100220", descripcion: "Resorte de repuesto para sello mecánico corto inox", categoria: "sellos_mecanicos", marca: "Parxial", unidad: "UND", precio: 6200, ivaPct: 19, stock: 80 },
  { codigo: "0100221", descripcion: "Resorte de repuesto para sello mecánico largo inox", categoria: "sellos_mecanicos", marca: "Parxial", unidad: "UND", precio: 6800, ivaPct: 19, stock: 75 },
  { codigo: "0100230", descripcion: "Kit reparación sello mecánico 1 pulgada Parxial", categoria: "sellos_mecanicos", marca: "Parxial", unidad: "JGO", precio: 52400, ivaPct: 19, stock: 15 },
  { codigo: "0100231", descripcion: "Kit reparación sello mecánico 1 1/2 pulgada Parxial", categoria: "sellos_mecanicos", marca: "Parxial", unidad: "JGO", precio: 64800, ivaPct: 19, stock: 11 },
  { codigo: "0100245", descripcion: "Cara estacionaria carburo de silicio 1 pulgada", categoria: "sellos_mecanicos", marca: "Burgmann", unidad: "UND", precio: 89500, ivaPct: 19, stock: 6 },

  // ----- Capacitores (0200xxx) --------------------------------------------
  { codigo: "0200310", descripcion: "Capacitor de arranque 88-108 MFD 250V", categoria: "capacitores", marca: "Mallory", unidad: "UND", precio: 18900, ivaPct: 19, stock: 40 },
  { codigo: "0200311", descripcion: "Capacitor de arranque 108-130 MFD 250V", categoria: "capacitores", marca: "Mallory", unidad: "UND", precio: 19800, ivaPct: 19, stock: 35 },
  { codigo: "0200312", descripcion: "Capacitor de arranque 161-193 MFD 250V", categoria: "capacitores", marca: "Mallory", unidad: "UND", precio: 22400, ivaPct: 19, stock: 28 },
  { codigo: "0200320", descripcion: "Capacitor de marcha 5 MFD 370V redondo", categoria: "capacitores", marca: "Genteq", unidad: "UND", precio: 14500, ivaPct: 19, stock: 50 },
  { codigo: "0200321", descripcion: "Capacitor de marcha 7.5 MFD 370V redondo", categoria: "capacitores", marca: "Genteq", unidad: "UND", precio: 15200, ivaPct: 19, stock: 48 },
  { codigo: "0200322", descripcion: "Capacitor de marcha 10 MFD 370V redondo", categoria: "capacitores", marca: "Genteq", unidad: "UND", precio: 16100, ivaPct: 19, stock: 45 },
  { codigo: "0200323", descripcion: "Capacitor de marcha 35 MFD 440V redondo", categoria: "capacitores", marca: "Genteq", unidad: "UND", precio: 21900, ivaPct: 19, stock: 33 },
  { codigo: "0200330", descripcion: "Capacitor dual 35+5 MFD 440V", categoria: "capacitores", marca: "Genteq", unidad: "UND", precio: 28700, ivaPct: 19, stock: 26 },
  { codigo: "0200331", descripcion: "Capacitor dual 40+5 MFD 440V", categoria: "capacitores", marca: "Genteq", unidad: "UND", precio: 30100, ivaPct: 19, stock: 22 },
  { codigo: "0200332", descripcion: "Capacitor dual 45+5 MFD 440V", categoria: "capacitores", marca: "Genteq", unidad: "UND", precio: 31800, ivaPct: 19, stock: 19 },
  { codigo: "0200340", descripcion: "Capacitor dual 50+5 MFD 440V", categoria: "capacitores", marca: "Genteq", unidad: "UND", precio: 33400, ivaPct: 19, stock: 16 },
  { codigo: "0200350", descripcion: "Relé de arranque potencial 110V para compresor", categoria: "capacitores", marca: "Embraco", unidad: "UND", precio: 12300, ivaPct: 19, stock: 38 },
  { codigo: "0200351", descripcion: "Relé de arranque PTC universal nevera", categoria: "capacitores", marca: "Danfoss", unidad: "UND", precio: 9800, ivaPct: 19, stock: 42 },

  // ----- Refrigeración (0300xxx) ------------------------------------------
  { codigo: "0300410", descripcion: "Filtro secador 1/4 soldable 16 g3", categoria: "refrigeracion", marca: "Danfoss", unidad: "UND", precio: 11200, ivaPct: 19, stock: 60 },
  { codigo: "0300411", descripcion: "Filtro secador 3/8 soldable 30 g3", categoria: "refrigeracion", marca: "Danfoss", unidad: "UND", precio: 14900, ivaPct: 19, stock: 52 },
  { codigo: "0300420", descripcion: "Válvula de expansión termostática R-404A 1 TR", categoria: "refrigeracion", marca: "Danfoss", unidad: "UND", precio: 96500, ivaPct: 19, stock: 10 },
  { codigo: "0300421", descripcion: "Válvula de expansión termostática R-134A 2 TR", categoria: "refrigeracion", marca: "Danfoss", unidad: "UND", precio: 104800, ivaPct: 19, stock: 8 },
  { codigo: "0300430", descripcion: "Compresor hermético 1/3 HP R-134A 110V", categoria: "refrigeracion", marca: "Embraco", unidad: "UND", precio: 285000, ivaPct: 19, stock: 5 },
  { codigo: "0300431", descripcion: "Compresor hermético 1/2 HP R-404A 220V", categoria: "refrigeracion", marca: "Tecumseh", unidad: "UND", precio: 412000, ivaPct: 19, stock: 4 },
  { codigo: "0300440", descripcion: "Termostato digital control temperatura -50 a 110°C", categoria: "refrigeracion", marca: "Full Gauge", unidad: "UND", precio: 68900, ivaPct: 19, stock: 14 },
  { codigo: "0300441", descripcion: "Termostato mecánico universal refrigerador", categoria: "refrigeracion", marca: "Ranco", unidad: "UND", precio: 24600, ivaPct: 19, stock: 27 },
  { codigo: "0300450", descripcion: "Gas refrigerante R-134A cilindro 13.6 kg", categoria: "refrigeracion", marca: "Chemours", unidad: "UND", precio: 245000, ivaPct: 19, stock: 9 },
  { codigo: "0300451", descripcion: "Gas refrigerante R-404A cilindro 10.9 kg", categoria: "refrigeracion", marca: "Chemours", unidad: "UND", precio: 318000, ivaPct: 19, stock: 6 },
  { codigo: "0300460", descripcion: "Tubería capilar cobre 0.031 rollo 30 m", categoria: "refrigeracion", marca: "Mueller", unidad: "RLL", precio: 42800, ivaPct: 19, stock: 18 },
  { codigo: "0300461", descripcion: "Tubería de cobre flexible 1/4 rollo 15 m", categoria: "refrigeracion", marca: "Mueller", unidad: "RLL", precio: 78500, ivaPct: 19, stock: 13 },
  { codigo: "0300470", descripcion: "Ventilador axial condensador 110V 1/20 HP", categoria: "refrigeracion", marca: "Elco", unidad: "UND", precio: 89400, ivaPct: 19, stock: 11 },
  { codigo: "0300471", descripcion: "Aspas para ventilador condensador 5 paletas 14 pulg", categoria: "refrigeracion", marca: "Elco", unidad: "UND", precio: 21500, ivaPct: 19, stock: 23 },
  { codigo: "0300480", descripcion: "Presostato de alta y baja R-404A ajustable", categoria: "refrigeracion", marca: "Danfoss", unidad: "UND", precio: 112000, ivaPct: 19, stock: 7 },
];

/** Etiquetas legibles de las categorías, para mostrar en la interfaz. */
export const ETIQUETAS_CATEGORIA: Record<CategoriaProducto, string> = {
  sellos_mecanicos: "Sellos mecánicos",
  capacitores: "Capacitores",
  refrigeracion: "Refrigeración",
};

/** Deriva un id estable a partir del código contable (usado en seed y mock). */
export function idDesdeCodigo(codigo: string): string {
  return `prod-${codigo}`;
}
