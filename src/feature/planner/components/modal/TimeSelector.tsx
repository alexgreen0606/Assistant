import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { TimeSelectorOptions } from '../../../../foundation/planners/timeUtils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import Colors from '../../../../foundation/theme/colors';

interface TimeSelectorProps {
    onChange: (newTimeValue: string) => void;
    options: TimeSelectorOptions;
    initialTimeValue: string;
};

const TimeSelector = ({
    onChange,
    options,
    initialTimeValue
}: TimeSelectorProps) => {
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0);
    const [indicator, setIndicator] = useState('AM');

    useEffect(() => {
        let [initialHourString, initialMinuteString] = initialTimeValue.split(':');
        const initialHour = Number(initialHourString);
        const initialMinute = Number(initialMinuteString);

        setHour(initialHour >= 12 ? initialHour - 12 : initialHour);
        setMinute(initialMinute);
        setIndicator(initialHour >= 12 ? 'PM' : 'AM');
    }, []);

    useEffect(() => {
        onChange(`${String(indicator === 'PM' && hour !== 12 ? hour + 12 : hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }, [hour, minute, indicator]);

    return (
        <View style={globalStyles.spacedApart}>
            <Picker style={styles.scrollWheel}
                selectedValue={hour}
                onValueChange={(itemValue) => setHour(Number(itemValue))}
                itemStyle={styles.wheelItem}
                selectionColor={Colors.BLUE}
            >
                {options.hour.map(hourOption => (
                    <Picker.Item
                        color={hour === hourOption ? Colors.BLUE : Colors.GREY}
                        key={hourOption}
                        label={String(hourOption === 0 ? 12 : hourOption)}
                        value={hourOption}
                    />
                ))}
            </Picker>
            <Picker style={styles.scrollWheel}
                selectedValue={minute}
                itemStyle={styles.wheelItem}
                onValueChange={(itemValue) => setMinute(itemValue)}
            >
                {options.minute.map(minuteOption => (
                    <Picker.Item
                        color={minute === minuteOption ? Colors.BLUE : Colors.GREY}
                        key={minuteOption}
                        label={String(minuteOption).padStart(2, '0')}
                        value={minuteOption}
                    />
                ))}
            </Picker>
            <Picker style={styles.scrollWheel}
                selectedValue={indicator}
                onValueChange={(itemValue) => setIndicator(itemValue)}
                itemStyle={styles.wheelItem}
            >
                {options.indicator.map(ind => (
                    <Picker.Item
                        color={indicator === ind ? Colors.BLUE : Colors.GREY}
                        key={ind}
                        label={ind}
                        value={ind}
                    />
                ))}
            </Picker>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollWheel: {
        width: '30%'
    },
    wheelItem: {
        fontSize: 14,
        color: Colors.GREY,
    },
});

export default TimeSelector;
