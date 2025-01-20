import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import useSortedList, { StorageConfigType } from '../../../../foundation/sortedLists/hooks/useSortedList';
import DayBanner from '../banner/DayBanner';
import { persistEvent, deleteEvent } from '../../storage/plannerStorage';
import TimeModal, { TimeModalProps } from '../modal/TimeModal';
import CustomText from '../../../../foundation/components/text/CustomText';
import Time from '../info/Time';
import { Event, extractTimeValue, generateSortIdByTimestamp, PLANNER_STORAGE_ID } from '../../timeUtils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import GenericIcon from '../../../../foundation/components/icons/GenericIcon';
import colors from '../../../../foundation/theme/colors';
import Card from '../../../../foundation/components/card/Card';
import Chip from '../info/Chip';
import { WeatherForecast } from '../../../../foundation/weather/types';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { ItemStatus } from '../../../../foundation/sortedLists/utils';
import ClickableLine from '../../../../foundation/sortedLists/components/separator/ClickableLine';
import EmptyLabel from '../../../../foundation/sortedLists/components/emptyLabel/EmptyLabel';

interface SortablePlannerProps {
    timestamp: string;
    birthdays: string[];
    holidays: string[];
    forecast: WeatherForecast;
    allDayEvents: string[];
};

const SortedPlanner = ({
    timestamp,
    birthdays,
    holidays,
    forecast,
    allDayEvents
}: SortablePlannerProps) => {
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapsed = () => setCollapsed(curr => !curr);
    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    // Stores the current planner and all handler functions to update it
    const SortedEvents = useSortedList<Event, Event[]>(
        timestamp,
        PLANNER_STORAGE_ID,
        (planner) => planner,
        {
            type: StorageConfigType.HANDLERS,
            customStorageHandlers: {
                create: persistEvent,
                update: persistEvent,
                delete: deleteEvent
            }
        }
    );

    return (
        <Card
            header={<DayBanner forecast={forecast} timestamp={timestamp} />}
            footer={
                <View style={{
                    ...globalStyles.verticallyCentered,
                    width: '100%',
                    flexWrap: 'wrap',
                    gap: 8
                }}>
                    {allDayEvents.map((allDayEvent, i) =>
                        <Chip
                            label={allDayEvent}
                            iconConfig={{
                                type: 'megaphone',
                                size: 10,
                                color: colors.red
                            }}
                            color={colors.red}
                            key={`${allDayEvent}-${timestamp}`}
                        />
                    )}
                    {holidays.map(holiday =>
                        <Chip
                            label={holiday}
                            iconConfig={{
                                type: 'globe',
                                size: 10,
                                color: colors.purple
                            }}
                            color={colors.purple}
                            key={holiday}
                        />
                    )}
                    {birthdays.map(birthday =>
                        <Chip
                            label={birthday}
                            iconConfig={{
                                type: 'birthday',
                                size: 10,
                                color: colors.green
                            }}
                            color={colors.green}
                            key={birthday}
                        />
                    )}
                </View>
            }
        >

            {/* Collapse Control */}
            {SortedEvents.items.length > 15 && !collapsed && (
                <View>
                    <TouchableOpacity style={{ ...globalStyles.verticallyCentered, gap: 8, paddingLeft: 8 }} onPress={toggleCollapsed}>
                        <GenericIcon
                            type='chevron-down'
                            color={colors.grey}
                            size={16}
                        />
                        <CustomText
                            type='label'
                            style={{
                                color: colors.grey,
                            }}
                        >
                            {collapsed ? 'View ' : 'Hide '}
                            {SortedEvents.items.filter(item => item.status !== ItemStatus.NEW).length} plans
                        </CustomText>
                    </TouchableOpacity>
                    <ClickableLine onPress={toggleCollapsed} />
                </View>
            )}

            {/* Planner List */}
            <SortableList<Event, TimeModalProps>
                listId={timestamp}
                items={SortedEvents.items}
                getLeftIconConfig={item => ({
                    icon: {
                        type: item.status === ItemStatus.DELETE ? 'circle-filled' : 'circle',
                        color: item.status === ItemStatus.DELETE ? colors.blue : colors.grey
                    },
                    onClick: SortedEvents.toggleDeleteItem
                })}
                onDeleteItem={SortedEvents.deleteItemFromStorage}
                hideList={collapsed}
                onContentClick={SortedEvents.convertItemToTextfield}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
                handleValueChange={(text, item) => {
                    const newEvent = {
                        ...item,
                        value: text,
                    };
                    if (!item.timeConfig) {
                        const { timeConfig, updatedText } = extractTimeValue(text);
                        if (timeConfig) {
                            newEvent.timeConfig = timeConfig;
                            newEvent.value = updatedText;
                            newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedEvents.items);
                        }
                    }
                    return newEvent;
                }}
                onSaveTextfield={SortedEvents.persistItemToStorage}
                getRightIconConfig={item => ({
                    hideIcon: item.status === ItemStatus.STATIC && !item.timeConfig,
                    icon: {
                        type: 'clock',
                        color: colors.grey
                    },
                    onClick: toggleTimeModal,
                    customIcon: !!item.timeConfig?.startTime ? <Time timeValue={item.timeConfig?.startTime} /> : undefined
                })}
                getModal={item => ({
                    component: TimeModal,
                    props: {
                        open: timeModalOpen,
                        toggleModalOpen: toggleTimeModal,
                        event: item,
                        timestamp: timestamp
                    },
                    onSave: (updatedItem: Event) => {
                        updatedItem.sortId = generateSortIdByTimestamp(updatedItem, [...SortedEvents.items, updatedItem]);
                        toggleTimeModal();
                        return updatedItem;
                    }
                })}
            />

            {/* Collapse Control */}
            {!!SortedEvents.items.length ? (
                <TouchableOpacity style={{ ...globalStyles.verticallyCentered, gap: 8, paddingLeft: 8 }} onPress={toggleCollapsed}>
                    <GenericIcon
                        type={collapsed ? 'chevron-right' : 'chevron-up'}
                        color={colors.grey}
                        size={16}
                    />
                    <CustomText
                        type='label'
                        style={{ color: colors.grey }}
                    >
                        {collapsed ? 'View ' : 'Hide '}
                        {SortedEvents.items.filter(item => item.status !== ItemStatus.NEW).length} plans
                    </CustomText>
                </TouchableOpacity>
            ) : (
                <EmptyLabel
                    label='No Plans!'
                    iconConfig={{
                        type: 'celebrate',
                        color: colors.grey,
                        size: 16
                    }}
                />
            )}

            {/* Separator Line */}
            <ClickableLine onPress={toggleCollapsed} />
        </Card>
    );
};

export default SortedPlanner;
