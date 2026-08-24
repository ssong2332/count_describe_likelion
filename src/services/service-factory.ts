import { FirebaseService } from './firebase.service';
import { LocalBroadcastService } from './local-broadcast.service';
import { IRoomService } from './room-service.interface';

let serviceInstance: IRoomService | null = null;
let currentMode: 'firebase' | 'local' = 'local';

export function getRoomService(): IRoomService {
  if (serviceInstance) {
    return serviceInstance;
  }

  // Firebase 환경변수가 있으면 Firebase 서비스 우선 시도
  const fbService = new FirebaseService();
  if (fbService.isAvailable()) {
    serviceInstance = fbService;
    currentMode = 'firebase';
    console.log('[ServiceFactory] Running in Firebase Realtime Cloud mode');
  } else {
    serviceInstance = new LocalBroadcastService();
    currentMode = 'local';
    console.log('[ServiceFactory] Running in Local BroadcastChannel mode');
  }

  return serviceInstance || new LocalBroadcastService();
}

export function getCurrentServiceMode(): 'firebase' | 'local' {
  return currentMode;
}

export function resetServiceForTest(mockService?: IRoomService): void {
  serviceInstance = mockService || null;
}
