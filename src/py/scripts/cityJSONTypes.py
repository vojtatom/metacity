from functions import value, output, description

@value('Building', 'bool', True)
@value('BuildingPart', 'bool', True)
@value('BuildingInstalation', 'bool', True)
@value('Bridge', 'bool', True)
@value('BridgePart', 'bool', True)
@value('BridgeInstallation', 'bool', True)
@value('BridgeConstructionElement', 'bool', True)
@value('CityObjectGroup', 'bool', True)
@value('CityFurniture', 'bool', True)
@value('GenericCityObject', 'bool', True)
@value('LandUse', 'bool', True)
@value('PlantCover', 'bool', True)
@value('Railway', 'bool', True)
@value('Road', 'bool', True)
@value('SolitaryVegetationObject', 'bool', True)
@value('Tunnel', 'bool', True)
@value('TunnelPart', 'bool', True)
@value('TunnelInstallation', 'bool', True)
@value('WaterBody', 'bool', True)
@output('Types', 'CityJSONTypes')
@description('Available CityJSON types')
def call(b, bp, bi, br, brp, bri, brce, cog, cf, gco, lu, pc, ra, ro, svo, tu, tup, tui, wb):
    types = []
    if b:
        types.append('Building')
    if bp:
        types.append('BuildingPart')
    if bi:
        types.append('BuildingInstalation')
    if br:
        types.append('Bridge')
    if brp:
        types.append('BridgePart')
    if bri:
        types.append('BridgeInstallation')
    if brce:
        types.append('BridgeConstructionElement')
    if cog:
        types.append('CityObjectGroup')
    if cf:
        types.append('CityFurniture')
    if gco:
        types.append('GenericCityObject')
    if lu:
        types.append('LandUse')
    if pc:
        types.append('PlantCover')
    if ra:
        types.append('Railway')
    if ro:
        types.append('Road')
    if svo:
        types.append('SolitaryVegetationObject')
    if tu:
        types.append('Tunnel')
    if tup:
        types.append('TunnelPart')
    if tui:
        types.append('TunnelInstallation')
    if wb:
        types.append('WaterBody')
    return types

