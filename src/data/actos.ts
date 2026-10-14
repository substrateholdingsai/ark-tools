// Datos de actos SAT/IMSS
export interface Acto {
  id: string;
  autoridad: "SAT" | "IMSS";
  descripcion: string;
}

export const actos: Acto[] = [];

export default actos;
