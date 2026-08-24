import { describe, it, expect, beforeEach } from 'vitest';
import { LocalBroadcastService } from '../../src/services/local-broadcast.service';

describe('LocalBroadcastService', () => {
  let service: LocalBroadcastService;

  beforeEach(() => {
    localStorage.clear();
    service = new LocalBroadcastService();
  });

  it('should create room with empty members list and verify pin correctly', async () => {
    const room = await service.createRoom('TEST-ROOM', '1234');
    expect(room.roomId).toBe('TEST-ROOM');
    expect(room.pin).toBe('1234');
    expect(Object.keys(room.members).length).toBe(0);

    const isValid = await service.verifyPin('TEST-ROOM', '1234');
    expect(isValid).toBe(true);

    const isInvalid = await service.verifyPin('TEST-ROOM', '9999');
    expect(isInvalid).toBe(false);
  });

  it('should import schedule members properly', async () => {
    await service.createRoom('SCHEDULE-ROOM', '0000');
    await service.importScheduleMembers('SCHEDULE-ROOM', [
      { name: 'A', group: '메인 운영진', shiftTime: '12:00 ~ 13:05' },
      { name: 'B', group: '전우조1', shiftTime: '12:00 ~ 13:05' },
    ]);

    const room = await service.getRoom('SCHEDULE-ROOM');
    expect(room).toBeDefined();
    expect(Object.keys(room!.members).length).toBe(2);
  });

  it('should add, update with extra fields (phone, group, shiftTime), and delete members', async () => {
    await service.createRoom('ROOM-1', '0000');
    const member = await service.addMember('ROOM-1', {
      name: '홍길동',
      phone: '010-1111-2222',
      group: '전우조1',
      shiftTime: '12:00 ~ 13:05',
    });

    expect(member.name).toBe('홍길동');
    expect(member.phone).toBe('010-1111-2222');
    expect(member.group).toBe('전우조1');
    expect(member.shiftTime).toBe('12:00 ~ 13:05');
    expect(member.isPresent).toBe(false);

    // checkIn
    await service.checkIn('ROOM-1', member.id);
    let room = await service.getRoom('ROOM-1');
    expect(room?.members[member.id].isPresent).toBe(true);

    // updateMember
    await service.updateMember('ROOM-1', member.id, {
      name: '홍길순',
      phone: '010-9999-8888',
      group: '전우조2',
      shiftTime: '13:00 ~ 14:05',
    });
    room = await service.getRoom('ROOM-1');
    expect(room?.members[member.id].name).toBe('홍길순');
    expect(room?.members[member.id].group).toBe('전우조2');
    expect(room?.members[member.id].phone).toBe('010-9999-8888');

    // delete
    await service.deleteMember('ROOM-1', member.id);
    room = await service.getRoom('ROOM-1');
    expect(room?.members[member.id]).toBeUndefined();
  });
});
