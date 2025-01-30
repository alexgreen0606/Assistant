import React, { useEffect, useState } from 'react';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import TimeModal, { TimeModalProps } from '../modal/TimeModal';
import TimeValue from '../../../../foundation/planners/components/TimeValue';
import { Event, extractTimeValue, generateSortIdByTimestamp, PLANNER_STORAGE_ID, RECURRING_WEEKDAY_PLANNER_KEY } from '../../../../foundation/planners/timeUtils';
import Colors from '../../../../foundation/theme/colors';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { isItemDeleting, ItemStatus, ListItem } from '../../../../foundation/sortedLists/utils';
import { useSortableListContext } from '../../../../foundation/sortedLists/services/SortableListProvider';

interface SortedRecurringPlannerProps {
    modalOpen: boolean;
}

const SortedRecurringPlanner = ({ modalOpen }: SortedRecurringPlannerProps) => {
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();
    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    // Creates a new textfield linked to the recurring planner
    function initializeNewEvent(item: ListItem): Event {
        return {
            ...item,
            recurringConfig: {
                recurringId: item.id
            }
        }
    };

    // Stores the current recurring weekday planner and all handler functions to update it
    const SortedEvents = useSortedList<Event, Event[]>(
        RECURRING_WEEKDAY_PLANNER_KEY,
        PLANNER_STORAGE_ID,
    );

    // Save the textfield when the modal closes
    useEffect(() => {
        if (!modalOpen && currentTextfield) {
            SortedEvents.persistItemToStorage({ ...currentTextfield, status: ItemStatus.STATIC });
            setCurrentTextfield(undefined);
        }
    }, [modalOpen]);

    return (
        <SortableList<Event, never, TimeModalProps>
            items={SortedEvents.items}
            listId={RECURRING_WEEKDAY_PLANNER_KEY}
            getLeftIconConfig={item => ({
                icon: {
                    type: 'trash',
                    color: isItemDeleting(item) ? Colors.WHITE : Colors.GREY
                },
                onClick: SortedEvents.toggleItemDelete
            })}
            initializeItem={initializeNewEvent}
            getTextfieldKey={item => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}`}
            onSaveTextfield={SortedEvents.persistItemToStorage}
            onDeleteItem={SortedEvents.deleteItemFromStorage}
            onDragEnd={async (item) => { await SortedEvents.persistItemToStorage(item) }}
            onContentClick={SortedEvents.toggleItemEdit}
            getRightIconConfig={item => ({
                hideIcon: item.status === ItemStatus.STATIC && !item.timeConfig,
                icon: {
                    type: 'clock',
                    color: Colors.GREY
                },
                onClick: toggleTimeModal,
                customIcon: !!item.timeConfig?.startTime ? <TimeValue allDay={false} timeValue={item.timeConfig?.startTime} /> : undefined
            })}
            handleValueChange={(text, item) => {
                const newEvent = {
                    ...item,
                    value: text,
                };
                if (!item.timeConfig) {
                    const { timeConfig, updatedText } = extractTimeValue(text);
                    if (timeConfig) {
                        const eventsWithItem = item.status === ItemStatus.EDIT ?
                            SortedEvents.items : [...SortedEvents.items, item];
                        newEvent.timeConfig = timeConfig;
                        newEvent.value = updatedText;
                        newEvent.sortId = generateSortIdByTimestamp(newEvent, eventsWithItem);
                    }
                }
                return newEvent;
            }}
            getModal={(item: Event) => ({
                component: TimeModal,
                props: {
                    open: timeModalOpen,
                    toggleModalOpen: toggleTimeModal,
                    timestamp: RECURRING_WEEKDAY_PLANNER_KEY,
                    onSave: (updatedItem: Event) => {
                        updatedItem.sortId = generateSortIdByTimestamp(updatedItem, [...SortedEvents.items, updatedItem]);
                        toggleTimeModal();
                        return updatedItem;
                    },
                    item
                },
            })}
            emptyLabelConfig={{
                label: 'No recurring weekday plans',
                style: { height: 400 }
            }}
        />
    );
};

export default SortedRecurringPlanner;