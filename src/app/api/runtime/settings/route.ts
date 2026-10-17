import { route } from '@/lib/http';
import { requestActor } from '@/lib/request-actor';
import { runtimeSettings } from '@/runtime/server';

export const runtime = 'nodejs';
export function GET(request: Request) {
  return route(request, 'api.settings.operational.read', '/api/runtime/settings', async () => ({
    settings: await runtimeSettings().getOperationalSettings(await requestActor(request)),
  }));
}
