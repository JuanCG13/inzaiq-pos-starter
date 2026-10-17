import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
export default function NotFound() { return <div className="empty-state page-error"><div className="empty-icon"><Compass size={30} /></div><span className="section-kicker">404</span><h1>Esta página no está acá</h1><p>Volvé a tu punto de venta para continuar.</p><Link href="/" className="button button-primary"><ArrowLeft size={16} />Volver al inicio</Link></div>; }
