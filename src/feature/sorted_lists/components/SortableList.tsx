import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../../../theme/theme';
import { FontAwesome } from '@expo/vector-icons';
import { ListItem } from '../../../foundation/lists/types';
import { ItemStatus, ShiftTextfieldDirection } from '../../../foundation/lists/enums';
import useSortedList from '../../../foundation/lists/hooks/useSortedList';
import { useListContext } from '../../../foundation/lists/services/ListProvider';

interface SortableListProps<ListItem> {
    listId: string;
    listItems: ListItem[];
    saveItems: (newItems: ListItem[]) => void
};

const SortableList = ({
    listId,
    listItems,
    saveItems
}: SortableListProps<ListItem>) => {
    const { colors } = useTheme();
    const { currentList, setCurrentList } = useListContext();
    const SortedList = useSortedList<ListItem>(listItems, saveItems);
    const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

    /**
     * When a different list on the screen is being edited, save this list's current textfield.
     */
    useEffect(() => {
        if (currentList.id !== listId)
            handleUpdateList(undefined, true);
        rescheduleAllDeletes();
    }, [currentList]);

    /**
     * Updates both the local list and the backend list. If an error occurs in the API, this component will
     * re-render. API errors do not need to be handled here.
     */
    const handleUpdateList = async (shiftTextfieldConfig?: string, lastUpdate?: boolean) => {
        const currentItem = SortedList.getTextfield();
        let newParentId: string | null = null;
        switch (currentItem?.status) {
            case 'NEW':
                if (currentItem.value.trim().length) {
                    delete currentItem.status;
                    SortedList.updateItem(currentItem);
                    if (shiftTextfieldConfig) {
                        newParentId = shiftTextfieldConfig === ShiftTextfieldDirection.BELOW ?
                            currentItem.id : SortedList.getParentId(currentItem.id);
                        SortedList.moveTextfield(newParentId);
                    }
                } else {
                    SortedList.deleteItem(currentItem.id);
                }
                if (!lastUpdate)
                    setCurrentList(listId)
                break;
            case 'EDIT':
                if (currentItem.value.trim().length) {
                    delete currentItem.status;
                    SortedList.updateItem(currentItem);
                    if (shiftTextfieldConfig) {
                        newParentId = shiftTextfieldConfig === ShiftTextfieldDirection.BELOW ?
                            currentItem.id : SortedList.getParentId(currentItem.id);
                        SortedList.moveTextfield(newParentId);
                    }
                } else {
                    toggleDeleteItem(currentItem, true);
                }
                if (!lastUpdate)
                    setCurrentList(listId)
                break;
        }
    };

    /**
     * Generates a textfield to create a new item.
     * 
     * 1. If a textfield exists: 
     *  a. if the line clicked is just below the textfield
     *      i. if the textfield has a value: save the textfield, generate a new textfield just below it, and exit
     *      ii. otherwise: do nothing and exit
     *  b. if the line clicked is just above the textfield
     *      i. if the textfield has a value: save the textfield, then generate a new textfield just above it, and exit
     *      ii: otherwise: do nothing and exit
     *  c. otherwise move the textfield to the new position
     * 
     * 2. Otherwise: add a new textfield just below the list item with a sort ID that matches the given parent sort ID
     * 
     * @param parentId - the sort ID of the list item just above this line
     */
    const handleLineClick = async (parentId: string) => {
        setCurrentList(listId);
        const currentItem = SortedList.getTextfield();
        if (currentItem) {
            if (parentId === currentItem.id) {
                if (currentItem.value.trim().length) {
                    await handleUpdateList(ShiftTextfieldDirection.BELOW);
                } else {
                    return;
                }
            } else if (parentId === SortedList.getParentId(currentItem.id)) {
                if (currentItem.value.trim().length) {
                    await handleUpdateList(ShiftTextfieldDirection.ABOVE)
                } else {
                    return;
                }
            } else {
                SortedList.moveItem(SortedList.getTextfield() as ListItem, parentId);
            }
        } else {
            SortedList.addNewTextfield(parentId);
        }
    };

    /**
     * Generates a textfield to edit an existing item.
     * 
     * 1. The item is deleting: do nothing and exit
     * 
     * 2. A textfield exists: save the textfield, then
     * 
     * 3. Turn the item into a textfield
     * 
     * @param item - the item that was clicked
     */
    const handleItemClick = async (item: ListItem) => {
        setCurrentList(listId)
        if (item.status === ItemStatus.DELETING)
            return;
        if (SortedList.getTextfield())
            await handleUpdateList();

        SortedList.updateItem({ ...item, status: ItemStatus.EDIT });
    };

    /**
     * Clears any pending deletes and re-schedules them 3 seconds into the future.
     */
    const rescheduleAllDeletes = () => {
        pendingDeletes.current.forEach((timeoutId, id) => {
            clearTimeout(timeoutId);
            const newTimeoutId = setTimeout(async () => {
                const currentItem = SortedList.getItemById(id);
                if (currentItem) {
                    SortedList.deleteItem(id);
                    pendingDeletes.current.delete(id);
                }
            }, 3000);
            pendingDeletes.current.set(id, newTimeoutId);
        });
    }

    /**
     * Toggles an item in and out of deleting. Changing the delete status of 
     * any item in the list will reset the timeouts for all deleting items. Items are deleted 3 seconds after clicked.
     * @param item - the item to delete
     * @param immediate - if true, delete the item without delay
     */
    const toggleDeleteItem = (item: ListItem | ListItem, immediate?: boolean) => {
        const wasDeleting = item.status === ItemStatus.DELETING;
        const updatedStatus = wasDeleting ? undefined : ItemStatus.DELETING;
        SortedList.updateItem({ ...item, status: updatedStatus } as ListItem);

        if (!wasDeleting) { // Item deletion being scheduled
            rescheduleAllDeletes();
            // Begin delete process of given item
            const timeoutId = setTimeout(async () => {
                SortedList.deleteItem(item.id);
                pendingDeletes.current.delete(item.id);
            }, immediate ? 0 : 3000);
            pendingDeletes.current.set(item.id, timeoutId);
        } else { // Item deletion being undone
            // Exit delete process of the item
            const timeoutId = pendingDeletes.current.get(item.id);
            if (timeoutId) {
                clearTimeout(timeoutId);
                pendingDeletes.current.delete(item.id);
            }
            // Re-schedule all existing deletes
            rescheduleAllDeletes();
        }
        setCurrentList(listId)
    };

    /**
     * Places a dragged item into its new location.
     */
    const handleDropItem = async ({ data, from, to }: { data: ListItem[]; from: number; to: number }) => {
        const draggedItem = data[to];
        if (from !== to) {
            const newParentId = to > 0 ?
                data[to - 1]?.id :
                'TODO'
            SortedList.moveItem(draggedItem, newParentId);
        }
        delete draggedItem.status;
        SortedList.updateItem(draggedItem);
    };

    const renderClickableLine = useCallback((parentId: string | null) =>
        <TouchableOpacity style={styles.clickableLine} onPress={parentId ? () => handleLineClick(parentId) : undefined}>
            <View style={styles.thinLine} />
        </TouchableOpacity>, [SortedList.current]);

    const renderInputField = useCallback((item: ListItem | ListItem) =>
        <TextInput
            mode="flat"
            key={`${item.id}`}
            autoFocus
            value={item.value}
            onChangeText={(text) => {SortedList.updateItem({ ...item, value: text }) }}
            selectionColor="white"
            style={styles.textInput}
            theme={{
                colors: {
                    text: 'white',
                    primary: 'transparent',
                },
            }}
            underlineColor='transparent'
            textColor='white'
            onSubmitEditing={() => handleUpdateList(ShiftTextfieldDirection.BELOW)}
        />, [SortedList.current]);

    const renderItem = useCallback((item: ListItem, drag: any) => {

        return item.status && ['EDIT', 'NEW'].includes(item.status) ?
            renderInputField(item) :
            <Text
                onLongPress={drag}
                onPress={() => handleItemClick(item)}
                style={{
                    ...styles.listItem,
                    color: item.status && ['PENDING', 'DELETING'].includes(item.status) ?
                        colors.outline : colors.secondary,
                    textDecorationLine: item.status === 'DELETING' ? 'line-through' : undefined
                }}
            >
                {item.value}
            </Text>
    }, [SortedList.current]);

    const renderRow = useCallback(({ item, drag }: RenderItemParams<ListItem>) => {
        const isItemDeleting = item.status === 'DELETING';
        const iconStyle = isItemDeleting ? 'dot-circle-o' : 'circle-thin';
        return (
            <View style={{ backgroundColor: item.status === 'DRAG' ? colors.background : undefined }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome
                        name={iconStyle}
                        size={20}
                        color={isItemDeleting ? colors.primary : colors.secondary}
                        style={{ marginLeft: 16 }}
                        onPress={() => toggleDeleteItem(item)}
                    />
                    {renderItem(item, drag)}
                </View>
                {renderClickableLine(item.id)}
            </View>
        )
    }, [SortedList.current]);

    return (
        <View style={{ width: '100%', marginBottom: 37 }}>
            {renderClickableLine('TODO')}
            <DraggableFlatList
                data={SortedList.current}
                scrollEnabled={false}
                onDragEnd={handleDropItem}
                onDragBegin={SortedList.beginDragItem}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    clickableLine: {
        width: '100%',
        height: 15,
        backgroundColor: 'transparent',
        justifyContent: 'center'
    },
    thinLine: {
        width: '100%',
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.outline,
    },
    listItem: {
        width: '100%',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        minHeight: 25,
        color: theme.colors.secondary,
        fontSize: 16
    },
    textInput: {
        backgroundColor: 'transparent',
        color: 'white',
        paddingTop: 1,
        paddingBottom: 1,
        width: '100%',
        height: 25,
        fontSize: 16
    },
});

export default SortableList;