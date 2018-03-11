import { PermissionsStore } from './PermissionsStore';
import { backendSrv } from 'test/mocks/common';

describe('PermissionsStore', () => {
  let store;

  beforeEach(async () => {
    backendSrv.get.mockReturnValue(
      Promise.resolve([
        { id: 2, dashboardId: 1, role: 'Viewer', permission: 1, permissionName: 'View' },
        { id: 3, dashboardId: 1, role: 'Editor', permission: 1, permissionName: 'Edit' },
        {
          id: 4,
          dashboardId: 10,
          permission: 1,
          permissionName: 'View',
          teamId: 1,
          teamName: 'MyTestTeam',
        },
      ])
    );

    backendSrv.post = jest.fn(() => Promise.resolve({}));

    store = PermissionsStore.create(
      {
        fetching: false,
        items: [],
      },
      {
        backendSrv: backendSrv,
      }
    );

    await store.load(1, false, false);
  });

  it('should save update on permission change', async () => {
    expect(store.items[0].permission).toBe(1);
    expect(store.items[0].permissionName).toBe('View');

    await store.updatePermissionOnIndex(0, 2, 'Edit');

    expect(store.items[0].permission).toBe(2);
    expect(store.items[0].permissionName).toBe('Edit');
    expect(backendSrv.post.mock.calls.length).toBe(1);
    expect(backendSrv.post.mock.calls[0][0]).toBe('/api/dashboards/id/1/permissions');
  });

  it('should save removed permissions automatically', async () => {
    expect(store.items.length).toBe(3);

    await store.removeStoreItem(2);

    expect(store.items.length).toBe(2);
    expect(backendSrv.post.mock.calls.length).toBe(1);
    expect(backendSrv.post.mock.calls[0][0]).toBe('/api/dashboards/id/1/permissions');
  });

  describe('when one inherited and one not inherited team permission are added', () => {
    beforeEach(async () => {
      const overridingItemForChildDashboard = {
        team: 'MyTestTeam',
        dashboardId: 1,
        teamId: 1,
        permission: 2,
      };

      store.resetNewType();
      store.newItem.setTeam(overridingItemForChildDashboard.teamId, overridingItemForChildDashboard.team);
      store.newItem.setPermission(overridingItemForChildDashboard.permission);
      await store.addStoreItem();
    });

    it('should add new overriding permission', () => {
      expect(store.items.length).toBe(4);
    });
  });
});
