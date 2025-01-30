import React from 'react';
import { View, StyleSheet } from 'react-native';
import GenericIcon, { GenericIconProps } from '../../../../foundation/components/icon/GenericIcon';
import Colors from '../../../../foundation/theme/colors';
import ThinLine from '../../../../foundation/components/separator/ThinLine';
import { FolderItem, selectableColors } from '../../utils';
import { ListItemUpdateComponentProps } from '../../../../foundation/sortedLists/utils';
import globalStyles from '../../../../foundation/theme/globalStyles';

export interface IconConfig {
    onClick: (item: FolderItem) => FolderItem; // return the updated item
    icon: GenericIconProps;
};

export interface PopoverProps extends ListItemUpdateComponentProps<FolderItem> {
    icons: IconConfig[][];
    open: boolean;
};

const Popover = ({
    item,
    icons,
    open,
    onSave,
}: PopoverProps) => open &&
    <View style={styles.popup}>
        {icons.map((iconRow, i) =>
            <View key={`${item.value}-${i}-popover-row`}>
                <View style={globalStyles.verticallyCentered}>
                    {iconRow.map(iconConfig =>
                        <GenericIcon
                            key={iconConfig.icon.type}
                            onClick={() => onSave(iconConfig.onClick(item))}
                            {...iconConfig.icon}
                        />
                    )}
                </View>
                <ThinLine />
            </View>
        )}
        <View style={globalStyles.verticallyCentered}>
            {selectableColors.map(color =>
                <GenericIcon
                    key={color}
                    onClick={() => onSave({ ...item, color })}
                    type={item.color === color ? 'circle-filled' : 'circle'}
                    size={20}
                    color={selectableColors[color]}
                />
            )}
        </View>
    </View>

const styles = StyleSheet.create({
    popup: {
        backgroundColor: Colors.BACKGROUND,
        padding: 12,
    },
});

export default Popover;
