import { describe, expect, it } from 'vitest';
import { defaultPermissions, getPermissions, withCurrentPermissions } from '@/services/authorization.service';

describe('withCurrentPermissions', () => {
  it('gives a session from before a permission change the current permissions', () => {
    const staleSession = {
      username: 'hr.person',
      groups: ['test_superuser'],
      systemRole: 'pf_hr_superuser',
      permissions: { ...getPermissions(['pf_hr_superuser'], true), canReadAllPF: false, canReadAllDocs: false },
    };

    const user = withCurrentPermissions(staleSession);

    expect(user.permissions.canReadAllPF).toBe(true);
    expect(user.permissions.canReadAllDocs).toBe(true);
    expect(user.systemRole).toBe('pf_hr_superuser');
    expect(user.username).toBe('hr.person');
  });

  it('picks the highest role when the user is in several groups', () => {
    const user = withCurrentPermissions({ groups: ['test_user', 'test_admin'], systemRole: '' });

    expect(user.systemRole).toBe('pf_hr_admin');
  });

  it('leaves a session without groups untouched rather than removing its permissions', () => {
    const session: { username: string; groups?: string[] } = { username: 'old.session' };

    expect(withCurrentPermissions(session)).toBe(session);
  });

  it('takes permissions away when the groups no longer grant them', () => {
    const user = withCurrentPermissions({
      groups: ['some_other_group'],
      permissions: getPermissions(['pf_hr_superadmin'], true),
    });

    expect(user.permissions).toEqual(defaultPermissions());
  });
});
