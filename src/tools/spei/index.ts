export { GeneradorSPEI } from './GeneradorSPEI';
export type {
  ClipCheckoutPayload,
  ClipCheckoutResult,
  ComisionClip,
  LinkCobroGuardado,
} from './types';
export {
  calcularComisionClip,
  crearLinkPagoClip,
  validarSolicitudCobro,
  generarMensajeWhatsApp,
  formatearMXN,
} from './lib/clipClient';
