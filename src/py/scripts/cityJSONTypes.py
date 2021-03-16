from metascript import MetaTypes, value, output, description

@value('Building', MetaTypes.BoolField, True)
@value('BuildingPart', MetaTypes.BoolField, True)
@value('BuildingInstalation', MetaTypes.BoolField, True)
@value('Bridge', MetaTypes.BoolField, True)
@value('BridgePart', MetaTypes.BoolField, True)
@value('BridgeInstallation', MetaTypes.BoolField, True)
@value('BridgeConstructionElement', MetaTypes.BoolField, True)
@value('CityObjectGroup', MetaTypes.BoolField, True)
@value('CityFurniture', MetaTypes.BoolField, True)
@value('GenericCityObject', MetaTypes.BoolField, True)
@value('LandUse', MetaTypes.BoolField, True)
@value('PlantCover', MetaTypes.BoolField, True)
@value('Railway', MetaTypes.BoolField, True)
@value('Road', MetaTypes.BoolField, True)
@value('SolitaryVegetationObject', MetaTypes.BoolField, True)
@value('Tunnel', MetaTypes.BoolField, True)
@value('TunnelPart', MetaTypes.BoolField, True)
@value('TunnelInstallation', MetaTypes.BoolField, True)
@value('WaterBody', MetaTypes.BoolField, True)
@output('Types', MetaTypes.CityJSONTypes)
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

