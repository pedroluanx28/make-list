const mockFiles = new Map<string, string>();
jest.mock('fs', () => ({
  existsSync: (path: string) => mockFiles.has(path),
  readFileSync: (path: string) => mockFiles.get(path),
  writeFileSync: (path: string, data: string) => mockFiles.set(path, data),
  mkdirSync: jest.fn(),
}));

import { authorizeGroup, deauthorizeGroup, getAuthorizedGroups, isGroupAuthorized } from '../../src/utils/authorizedGroups';

const FILE = require('path').join(__dirname, '../../assets/authorizedGroups.json');

describe('authorizedGroups', () => {
  beforeEach(() => {
    mockFiles.clear();
  });

  describe('getAuthorizedGroups', () => {
    it('should return an empty list when the file does not exist', () => {
      expect(getAuthorizedGroups()).toEqual([]);
    });

    it('should return an empty list when the file has invalid JSON', () => {
      mockFiles.set(FILE, '{not json');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(getAuthorizedGroups()).toEqual([]);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('should return an empty list when the file is not an array of group JIDs', () => {
      mockFiles.set(FILE, JSON.stringify(['not-a-group-jid', 123]));

      expect(getAuthorizedGroups()).toEqual([]);
    });

    it('should return the saved list', () => {
      mockFiles.set(FILE, JSON.stringify(['a@g.us', 'b@g.us']));

      expect(getAuthorizedGroups()).toEqual(['a@g.us', 'b@g.us']);
    });
  });

  describe('isGroupAuthorized', () => {
    it('should be false for a group not in the list', () => {
      expect(isGroupAuthorized('a@g.us')).toBe(false);
    });

    it('should be true for a group in the list', () => {
      mockFiles.set(FILE, JSON.stringify(['a@g.us']));

      expect(isGroupAuthorized('a@g.us')).toBe(true);
    });
  });

  describe('authorizeGroup', () => {
    it('should add the group and return true', () => {
      expect(authorizeGroup('a@g.us')).toBe(true);
      expect(getAuthorizedGroups()).toEqual(['a@g.us']);
    });

    it('should not recreate the assets directory when it already exists', () => {
      mockFiles.set(require('path').dirname(FILE), '');

      expect(authorizeGroup('a@g.us')).toBe(true);
    });

    it('should return false and not duplicate an already authorized group', () => {
      authorizeGroup('a@g.us');

      expect(authorizeGroup('a@g.us')).toBe(false);
      expect(getAuthorizedGroups()).toEqual(['a@g.us']);
    });
  });

  describe('deauthorizeGroup', () => {
    it('should return false when the group was not authorized', () => {
      expect(deauthorizeGroup('a@g.us')).toBe(false);
    });

    it('should remove the group and return true', () => {
      authorizeGroup('a@g.us');
      authorizeGroup('b@g.us');

      expect(deauthorizeGroup('a@g.us')).toBe(true);
      expect(getAuthorizedGroups()).toEqual(['b@g.us']);
    });
  });
});
