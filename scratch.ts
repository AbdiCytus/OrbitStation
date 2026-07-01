import { db } from './lib/db'; db.oAuthApp.findFirst({ where: { clientId: 'orbit_iOqWbABpT0W9OjKC' } }).then(console.log);
