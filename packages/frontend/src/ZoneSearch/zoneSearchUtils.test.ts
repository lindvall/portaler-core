import { FilterOptionsState } from '@material-ui/lab/useAutocomplete'
import { filterZones, getMaxString } from './zoneSearchUtils'
import { Zone } from '@portaler/types'

describe('Test zoneSearchUtils', () => {
  describe('Test filterZones', () => {
    const getState = (inputValue: string): FilterOptionsState<Zone> => ({
      inputValue,
      getOptionLabel: () => '',
    })

    const testList: Zone[] = [
      { name: 'Stinkhag', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Sectun-Qinsom', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Bank of Thetford', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Bank of Lymhurst', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Mushroom Cave', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'LEGACY-UNDEAD-02', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'HomeTerritory Skirmish', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Frostpeak Ascent', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Flatrock Plateau', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Darkstone Drift', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Windgrass Border', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Highstone Loch', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Chambers of Truth', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: "Conquerors' Hall Lvl. 1", id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Hasitos-Umayaum', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Tonitos-Uxavrom', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'PSG-0051', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'DNG-0602', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'PSG-0041', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Secent-Qi-Odesom', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      { name: 'Sectun-In-Qinsom', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
    ]

    test('starts with', () => {
      expect(filterZones(testList, getState('sectun')).length).toBe(2)
      expect(filterZones(testList, getState('SeCtuN')).length).toBe(2)
      expect(filterZones(testList, getState('SeCtuN-I')).length).toBe(1)
      expect(filterZones(testList, getState('Bank o')).length).toBe(2)
      expect(filterZones(testList, getState('xxx')).length).toBe(0)
    })

    test('fuzzy search', () => {
      expect(filterZones(testList, getState('sec qi')).length).toBe(3)
      expect(filterZones(testList, getState('p 0')).length).toBe(2)
      expect(filterZones(testList, getState('BA O')).length).toBe(2)
      expect(filterZones(testList, getState('xxx')).length).toBe(0)
    })

    test('Test single entry', () => {
      const singleList: Zone[] = [
        { name: 'HomeTerritory Skirmish', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      ]

      expect(filterZones(singleList, getState('ho'))).toMatchObject(singleList)
    })

    test('Test empty list', () => {
      expect(filterZones([], getState('xx')).length).toBe(0)
    })
  })

  describe('Test getMaxString', () => {
    test('Test common cases', () => {
      const testList1: Zone[] = [
        { name: 'Sectun-Qinsom', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
        { name: 'Secent-Qi-Odesom', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
        { name: 'Sectun-In-Qinsom', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      ]

      expect(getMaxString(testList1, 'se')).toBe('Sec')
      expect(getMaxString(testList1, 'sEc')).toBe('Sec')

      const testList2: Zone[] = [
        { name: 'Bank of Thetford', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
        { name: 'Bank of Lymhurst', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
        { name: 'Bank of Batman', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
        { name: 'Bank of Joker', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      ]

      expect(getMaxString(testList2, 'b')).toBe('Bank of ')
      expect(getMaxString(testList2, 'Ban')).toBe('Bank of ')
      expect(getMaxString(testList2, 'bAnk o')).toBe('Bank of ')

      const testList3: Zone[] = [
        { name: 'Sectun-Qinsom', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
        { name: 'Sectun-Qi-Odesom', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
        { name: 'Sectun-Qi-Qinsom', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      ]

      expect(getMaxString(testList3, 'se')).toBe('Sectun-Qi')
      expect(getMaxString(testList3.slice(1, 3), 'Se')).toBe('Sectun-Qi-')
    })

    test('Test single entry', () => {
      const singleList: Zone[] = [
        { name: 'HomeTerritory Skirmish', id: 0, tier: 'tier', 'color': 'black', 'type': '' },
      ]

      expect(getMaxString(singleList, 'ho')).toBe('HomeTerritory Skirmish')
    })

    test('Test empty list', () => {
      expect(getMaxString([], 'xx')).toBe('xx')
    })
  })
})
